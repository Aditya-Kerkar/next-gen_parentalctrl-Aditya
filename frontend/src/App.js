import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './NavBar';
import Dashboard from './Dashboard'; // Your existing dashboard component
import Analytics from './Analytics'; // Your existing analytics component
// import Gamification from './components/Gamification'; // Your existing gamification component
import RequestsPage from './RequestsPage';

function App() {
  return (
    <Router>
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
           <Route path="/analytics" element={<Analytics />} />
         {/* {<Route path="/gamification" element={<Gamification />} /> } */}
          <Route path="/requests" element={<RequestsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;