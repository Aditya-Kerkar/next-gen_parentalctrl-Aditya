import React from 'react';
import './App.css'; // Ensure you have the right path for CSS import

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp * 1000); // Convert UNIX timestamp (seconds) to milliseconds
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `Date : ${day}-${month}-${year} Time : ${hours}:${minutes}`;
};


const HistoryList = ({ browsingHistory }) => {
  const sortedHistory = [...browsingHistory].sort((a, b) => b.timestamp - a.timestamp);
  return (
    <div>
      <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/time-past.png" alt="Shield Check Icon" className="icon" />
        <h3>Web Activity Log</h3>
      </div>
      <div className="HistoryList-container">
        {sortedHistory.map((history, index) => (
          <div key={index} className="HistoryItem-card">
            <div className="HistoryItem-url" lines={1}>
            <b>URL <div className={`category-badge ${history.category === 'Sensitive Topics' ? 'sensitive' : ''}`}>{history.category}</div> </b>: {history.url} 
            </div>
            <div className="HistoryItem-timestamp"><b>{formatTimestamp(history.timestamp)}</b></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
