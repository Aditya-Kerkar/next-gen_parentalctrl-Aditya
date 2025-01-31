import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import './Analytics.css'; // External CSS for styling the layout

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [analyticsData, setAnalyticsData] = useState({ daily: [], weekly: [], monthly: [] });
  const [statistics, setStatistics] = useState({ totalVisits: 0, uniqueSites: 0 });

  useEffect(() => {
    fetchAnalyticsData('daily');
    fetchAnalyticsData('weekly');
    fetchAnalyticsData('monthly');
  }, []);

  const fetchAnalyticsData = (period) => {
    fetch(`/api/analytics/${period}`)
      .then(response => response.json())
      .then(({ totalVisits, uniqueSites, data }) => {
        const aggregatedData = aggregateVisitData(data);
        setAnalyticsData(prevData => ({ ...prevData, [period]: aggregatedData }));
        setStatistics(prevStats => ({
          ...prevStats,
          [period]: { totalVisits, uniqueSites }, // Store stats separately for each period
        }));
      })
      .catch(error => console.error(`Error fetching ${period} analytics:`, error));
  };

  const aggregateVisitData = (data) => {
    const websiteVisitMap = new Map();
    data.forEach(record => {
      const domain = new URL(record.url).hostname;
      websiteVisitMap.set(domain, (websiteVisitMap.get(domain) || 0) + 1);
    });
    return Array.from(websiteVisitMap).map(([domain, visits]) => ({ domain, visits }));
  };

  const calculateStatistics = (data) => {
    const uniqueSites = new Set(data.map(record => new URL(record.url).hostname)).size;
    setStatistics({
      totalVisits: data.length,
      uniqueSites,
    });
  };

  const generateChartData = (analyticsData) => {
    const labels = analyticsData.map(item => item.domain);
    const dataValues = analyticsData.map(item => item.visits);

    return {
      labels,
      datasets: [
        {
          label: 'Number of Visits',
          data: dataValues,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="analytics-container">
      <h2>Website Activity Analytics</h2>

      {/* Navigation Tabs */}
      <div className="tabs">
        {['daily', 'weekly', 'monthly'].map(period => (
          <button
            key={period}
            className={activeTab === period ? 'active' : ''}
            onClick={() => setActiveTab(period)}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics Panel */}
<div className="statistics-panel">
  <div className="stat-card">
    <h4>Total Websites Visited</h4>
    <p>{statistics[activeTab]?.totalVisits || 0}</p>
  </div>
  <div className="stat-card">
    <h4>Unique Websites</h4>
    <p>{statistics[activeTab]?.uniqueSites || 0}</p>
  </div>
</div>

      {/* Bar Chart Visualization */}
      <div className="chart-container">
        <Bar data={generateChartData(analyticsData[activeTab])} options={{ maintainAspectRatio: false }} />
      </div>

      {/* Top Websites List */}
      <div className="top-sites">
        <h3>Top 10 Websites</h3>
        <ul>
        {analyticsData[activeTab]
  .sort((a, b) => b.visits - a.visits)  // Sort by visits (highest to lowest)
  .slice(0, 10)
  .map(site => (
            <li key={site.domain}>
              <img src={`https://www.google.com/s2/favicons?sz=64&domain=${site.domain}`} alt="favicon" className="favicon" />
              {site.domain} - {site.visits} visits
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Analytics;