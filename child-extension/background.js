// background.js

const BACKEND_URL = 'http://localhost:5000'; // Replace with your backend URL if different
let blockedSites = [];

// Fetch blocked sites from the backend
const fetchBlockedSites = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocked-sites`);
    const data = await response.json();
    blockedSites = data.map(site => site.url);
    console.log('Blocked Sites Updated:', blockedSites);
  } catch (error) {
    console.error('Error fetching blocked sites:', error);
  }
};

// Initial fetch
fetchBlockedSites();

// Refresh blocked sites every 5 minutes
setInterval(fetchBlockedSites, 5 * 60 * 1000); // 5 minutes

const normalizeUrl = (url) => {
  const parsedUrl = new URL(url);
  return `${parsedUrl.protocol}://${parsedUrl.hostname}${parsedUrl.pathname}`;
};

// Listen for web requests to block
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = normalizeUrl(details.url);
    if (blockedSites.includes(url)) {
      console.log(`Blocking access to: ${url}`);
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

// Listen for tab updates to track browsing history
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
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
    .then(response => {
      if (response.ok) {
        console.log(`Tracked: ${tab.url}`);
      } else {
        console.error('Failed to track URL:', tab.url);
      }
    })
    .catch(error => {
      console.error('Error tracking URL:', error);
    });
  }
});
