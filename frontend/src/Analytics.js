import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, Tooltip, Legend, ArcElement } from 'chart.js';
import { extractDomain } from './utils'; // Helper to extract domain from URLs

ChartJS.register(Tooltip, Legend, ArcElement);

const Analytics = () => {
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([]);

  useEffect(() => {
    fetch('/api/analytics/daily')
      .then(response => response.json())
      .then(data => {
        const aggregatedData = aggregateTimeSpent(data);
        console.log('Daily Aggregated Data:', aggregatedData);
        setDailyAnalytics(aggregatedData);
      })
      .catch(error => console.error('Error fetching daily analytics:', error));

    fetch('/api/analytics/weekly')
      .then(response => response.json())
      .then(data => {
        const aggregatedData = aggregateTimeSpent(data);
        console.log('Weekly Aggregated Data:', aggregatedData);
        setWeeklyAnalytics(aggregatedData);
      })
      .catch(error => console.error('Error fetching weekly analytics:', error));
  }, []);

  const aggregateTimeSpent = (data) => {
    const websiteTimeMap = new Map();

    data.forEach((record, index) => {
      const domain = extractDomain(record.url);
      const timestamp = new Date(record.timestamp).getTime();

      if (!websiteTimeMap.has(domain)) {
        websiteTimeMap.set(domain, { timeSpent: 0, lastTimestamp: timestamp });
      }

      const siteData = websiteTimeMap.get(domain);

      if (index > 0) {
        siteData.timeSpent += timestamp - siteData.lastTimestamp;
      }

      siteData.lastTimestamp = timestamp;
    });

    return Array.from(websiteTimeMap).map(([domain, siteData]) => ({
      domain,
      timeSpent: siteData.timeSpent / (1000 * 60), // Time in minutes
    }));
  };

  const generateChartData = (analyticsData) => {
    const labels = analyticsData.map(item => item.domain);
    const dataValues = analyticsData.map(item => item.timeSpent);

    console.log('Chart Labels:', labels);
    console.log('Chart Data Values:', dataValues);

    return {
      labels,
      datasets: [
        {
          label: 'Time Spent (minutes)',
          data: dataValues,
          backgroundColor: labels.map(() => `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div>
      <h2>Website Activity Analytics</h2>

      <div>
        <h3>Daily Activity (Pie Chart)</h3>
        <Pie data={generateChartData(dailyAnalytics)} options={{ maintainAspectRatio: false }} />
      </div>

      <div>
        <h3>Weekly Activity (Pie Chart)</h3>
        <Pie data={generateChartData(weeklyAnalytics)} options={{ maintainAspectRatio: false }} />
      </div>
    </div>
  );
};

export default Analytics;
