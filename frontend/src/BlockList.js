import React from 'react';
import './App.css'; // Import your CSS here

const BlockList = ({ blockedSites, newBlockedSite, setNewBlockedSite, handleBlockSite }) => {

  // Function to handle copying the URL to clipboard
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  return (
    <div className="BlockList-container">
      {/* <h2>Blocked Sites</h2> */}

      {/* Input Form */}
      <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/block-brick.png" alt="Shield Check Icon" className="icon" />
          <h3>Block List</h3>
        </div>
      <form onSubmit={(e) => { e.preventDefault(); handleBlockSite(); }}>
        <input
          type="text"
          value={newBlockedSite}
          onChange={(e) => setNewBlockedSite(e.target.value)}
          placeholder="Block website"
        />
        <button type="submit">Block Site</button>
      </form>

      {/* Blocked Sites Cards */}
      <div className="BlockedSites-list">
        {blockedSites.map((site, index) => (
          <div key={index} className="BlockedSite-card">
            {/* Copy Button */}
            <button 
              className="copy-button" 
              onClick={() => copyToClipboard(site.url)}
            >
              Copy
            </button>

            {/* Display the URL */}
            <p>{site.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockList;
