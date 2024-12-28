import React, { useState, useEffect } from 'react';
import HistoryList from './HistoryList';
import BlockList from './BlockList';

const Dashboard = () => {
  const [browsingHistory, setBrowsingHistory] = useState([]);
  const [blockedSites, setBlockedSites] = useState([]);
  const [newBlockedSite, setNewBlockedSite] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setBrowsingHistory(data));
    fetch('/api/blocked-sites')
      .then(res => res.json())
      .then(data => setBlockedSites(data));
  }, []);

  const handleBlockSite = () => {
    if (newBlockedSite.trim() !== '') {
      setBlockedSites([...blockedSites, { url: newBlockedSite }]); // Add new site to state
      setNewBlockedSite(''); // Clear the input field after submission
    }
  };

  return (
    <div>
      <BlockList
        blockedSites={blockedSites}
        newBlockedSite={newBlockedSite}
        setNewBlockedSite={setNewBlockedSite}
        handleBlockSite={handleBlockSite}
      />
      <HistoryList browsingHistory={browsingHistory} />
    </div>
  );
};

export default Dashboard;
