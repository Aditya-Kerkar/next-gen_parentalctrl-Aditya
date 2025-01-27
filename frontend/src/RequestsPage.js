import React, { useState, useEffect } from 'react';

function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/revocation-requests');
      const data = await response.json();
      setRequests(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleRequest = async (id, approved) => {
    try {
      await fetch(`http://localhost:5000/api/revocation-request/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'resolved',
          approved
        })
      });
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="requests-page">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/code-pull-request.png" alt="Shield Check Icon" className="icon" />
        <h3>Access Revocation Requests</h3>
      </div>
      <div className="requests-container">
        {requests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="card-content">
              <div>
                <p className="req-badge">URL: {request.url}</p>
                <p className="request-reason">Reason: {request.description}</p>
                <p className="request-timestamp">
                  <b>
                  Requested: {new Date(request.timestamp).toLocaleString()}
                  </b>
                </p>
              </div>
              <div className="card-actions">
                {request.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleRequest(request.id, true)}
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, false)}
                      className="decline-button"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <span className="request-status">
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="no-requests">No requests found</p>
        )}
      </div>
    </div>
  );
}

export default RequestsPage;
