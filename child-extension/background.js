const BACKEND_URL = 'http://localhost:5000';
let blockedSites = [];

// Enhanced domain extraction and matching
const extractDomain = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Remove protocol and www, get base domain
    return parsedUrl.hostname.replace(/^www\./, '').split('.').slice(-2).join('.');
  } catch (error) {
    console.error('Domain extraction error:', error);
    return '';
  }
};

const fetchBlockedSites = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-sites`);
    const data = await response.json();
    
    // Store both full URLs and base domains
    blockedSites = data.map(site => ({
      fullUrl: site.url,
      baseDomain: extractDomain(site.url)
    }));
    console.log('Blocked Sites Updated:', blockedSites);
  } catch (error) {
    console.error('Error fetching blocked sites:', error);
  }
};

const isUrlBlocked = (url) => {
  try {
    const currentDomain = extractDomain(url);
    
    return blockedSites.some(blockedSite => 
      // Multiple blocking conditions
      url.includes(blockedSite.fullUrl) ||  // Partial URL match
      currentDomain === blockedSite.baseDomain ||  // Exact domain match
      currentDomain.endsWith('.' + blockedSite.baseDomain)  // Subdomain match
    );
  } catch (error) {
    console.error('Blocking check error:', error);
    return false;
  }
};

// Initial fetch and periodic refresh
fetchBlockedSites();
setInterval(fetchBlockedSites, 5 * 60 * 1000);

// Block web requests
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (isUrlBlocked(details.url)) {
      console.log(`Blocking: ${details.url}`);
      return { redirectUrl: chrome.runtime.getURL('blocked.html') };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Additional tab blocking
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (isUrlBlocked(tab.url)) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
    }
  }
});
