import React from 'react';
import './App.css';

const BlockList = ({ blockedSites, newBlockedSite, setNewBlockedSite, setBlockedSites }) => {
  const handleBlockSite = async () => {
    if (!newBlockedSite.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      console.log('Sending request to block:', newBlockedSite);
      
      const response = await fetch('http://localhost:5000/api/block-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: newBlockedSite }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to block site');
      }

      console.log('Server response:', data);
      
      // Update the local state with the new blocked site
      setBlockedSites(prevSites => [...prevSites, { id: data.id, url: data.url }]);
      
      // Clear the input
      setNewBlockedSite('');
      
      // Show success message
      alert('Site blocked successfully!');
      
    } catch (error) {
      console.error('Error details:', error);
      alert(`Failed to block site: ${error.message}`);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert(`Copied: ${url}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleBlockSite();
  };

  return (
    <div className="BlockList-container">
      <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: "20px"}}>
        <img src="/block-brick.png" alt="Shield Check Icon" className="icon" />
        <h3 style={{ color: "white"}}>Block List</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newBlockedSite}
          onChange={(e) => setNewBlockedSite(e.target.value)}
          placeholder="Enter website URL"
        />
        <button type="submit"><b>BLOCK</b></button>
      </form>

      <div className="BlockedSites-list">
        {blockedSites.map((site, index) => (
          <div key={index} className="BlockedSite-card">
            <button 
              className="copy-button" 
              onClick={() => copyToClipboard(site.url)}
            >
              Copy
            </button>
            <p>{site.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockList;