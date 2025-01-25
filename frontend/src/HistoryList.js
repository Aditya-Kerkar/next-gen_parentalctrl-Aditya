import React from 'react';
import './App.css'; // Ensure you have the right path for CSS import

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero if needed
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Get month (0-11) and pad with zero
  const year = date.getFullYear(); // Get year
  const hours = String(date.getHours()).padStart(2, '0'); // Get hours and pad with zero
  const minutes = String(date.getMinutes()).padStart(2, '0'); // Get minutes and pad with zero

  return `${day}-${month}-${year} ${hours}:${minutes}`; // Return formatted string
};

const HistoryList = ({ browsingHistory }) => {
  return (
    <div>
      <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/time-past.png" alt="Shield Check Icon" className="icon" />
        <h3>Web Activity Log</h3>
      </div>
      <div className="HistoryList-container">
        {browsingHistory.map((history, index) => (
          <div key={index} className="HistoryItem-card">
            <div className="HistoryItem-url" lines={1}>
              <b>URL<div className="category-badge">{history.category}</div></b> : {history.url}
            </div>
            <div className="HistoryItem-timestamp">{formatTimestamp(history.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
