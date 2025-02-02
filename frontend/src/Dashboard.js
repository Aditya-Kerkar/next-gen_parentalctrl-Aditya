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

  useEffect(() => {
    // Fetch blocked sites when component mounts
    const fetchBlockedSites = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/blocked-sites');
        if (!response.ok) {
          throw new Error('Failed to fetch blocked sites');
        }
        const data = await response.json();
        setBlockedSites(data);
      } catch (error) {
        console.error('Error fetching blocked sites:', error);
      }
    };

    fetchBlockedSites();
  }, []);

  // const handleBlockSite = () => {
  //   if (newBlockedSite.trim() !== '') {
  //     setBlockedSites([...blockedSites, { url: newBlockedSite }]); // Add new site to state
  //     setNewBlockedSite(''); // Clear the input field after submission
  //   }
  // };

  return (
    <div>
      <BlockList
        blockedSites={blockedSites}
        newBlockedSite={newBlockedSite}
        setNewBlockedSite={setNewBlockedSite}
        setBlockedSites={setBlockedSites}
      />
      <HistoryList browsingHistory={browsingHistory} />
    </div>
  );
};

export default Dashboard;
