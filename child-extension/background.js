const BACKEND_URL = 'http://localhost:5000';
const MALICIOUS_API_URL = 'http://localhost:5001/predict';
const CYBERBULLYING_API_URL = 'http://localhost:5002/predict';
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

const checkUrlSafety = async (url) => {
  try {
    // Skip checking for certain URLs
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return null;
    }

    const response = await fetch(MALICIOUS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.result_str;
  } catch (error) {
    console.error('Error checking URL safety:', error);
    return null;
  }
};


const checkContentForCyberbullying = async (content) => {
  try {
    const requestData = { text: content };
    console.log('Sending request to cyberbullying API:', requestData);

    const response = await fetch(CYBERBULLYING_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from cyberbullying API:', data);
    return data;
  } catch (error) {
    console.error('Error checking content for cyberbullying:', error);
    return null;
  }
};

const extractPageContent = () => {
  return document.body.innerText; // Extracting the visible text content of the page
};


// Initial fetch and periodic refresh
fetchBlockedSites();
setInterval(fetchBlockedSites, 5 * 60 * 1000);

// Block web requests
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (isUrlBlocked(details.url)) {
      console.log(`Blocking: ${details.url}`);
      return { 
        redirectUrl: chrome.runtime.getURL('blocked.html') + '?blocked=' + encodeURIComponent(details.url)
      };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listen for tab updates to track browsing history
chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {

    setTimeout(async () => {
      // Get the page content
      chrome.tabs.sendMessage(tabId, { type: 'getPageContent' }, async function(content) {
        if (content) {
          const resultc = await checkContentForCyberbullying(content);
          if (resultc && resultc.is_cyberbullying !== undefined) {
            const isSafe = !resultc.is_cyberbullying;
            const message = isSafe ? 'Content appears safe.' : 'Potential cyberbullying detected.';
            chrome.tabs.sendMessage(tabId, { 
              type: 'cyberbullyingDetected', 
              result: isSafe,
              message: message 
            });
          }
        }
      });
    }, 9000);

    const result = await checkUrlSafety(tab.url);
    if (result) {
      chrome.tabs.sendMessage(tabId, { type: 'urlSafetyCheck', result });
    }

    // Check if URL is blocked first
    if (isUrlBlocked(tab.url)) {
      chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
      return;
    }

    // Exclude unnecessary URLs
    const unnecessaryUrls = [
      'chrome://', 
      'chrome-extension://', 
      'about:', 
      'file://', 
      'localhost:'
    ];

    // Only track meaningful URLs
    if (!unnecessaryUrls.some(url => tab.url.includes(url))) {
      const data = {
        url: tab.url,
        timestamp: new Date().toISOString()
      };

      // Send browsing data to backend
      fetch(`${BACKEND_URL}/api/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Sensitive Topic Detected') {
          // Block sensitive topics
          chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
        } else {
          console.log(`Tracked: ${tab.url}`);
        }
      })
      .catch(error => {
        console.error('Error tracking URL:', error);
      });
    }
  }
});