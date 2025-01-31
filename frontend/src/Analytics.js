import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registering Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [dailyAnalytics, setDailyAnalytics] = useState([]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([]);

  // Fetch daily analytics data
  useEffect(() => {
    fetch('/api/analytics/daily')
      .then((response) => response.json())
      .then((data) => setDailyAnalytics(data))
      .catch((error) => console.error('Error fetching daily analytics:', error));
  }, []);

  // Fetch weekly analytics data
  useEffect(() => {
    fetch('/api/analytics/weekly')
      .then((response) => response.json())
      .then((data) => setWeeklyAnalytics(data))
      .catch((error) => console.error('Error fetching weekly analytics:', error));
  }, []);

  // Prepare data for the daily chart
  const dailyChartData = {
    labels: dailyAnalytics.map((item) => item.day), // Days as labels
    datasets: [
      {
        label: 'Daily Website Visits',
        data: dailyAnalytics.map((item) => item.visit_count), // Visit count as data
        borderColor: 'rgba(75, 192, 192, 1)', // Line color
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill color
        fill: true, // To fill the area under the line
      },
    ],
  };

  // Prepare data for the weekly chart
  const weeklyChartData = {
    labels: weeklyAnalytics.map((item) => `Week ${item.week}`), // Week as labels
    datasets: [
      {
        label: 'Weekly Website Visits',
        data: weeklyAnalytics.map((item) => item.visit_count), // Visit count as data
        borderColor: 'rgba(153, 102, 255, 1)', // Line color
        backgroundColor: 'rgba(153, 102, 255, 0.2)', // Fill color
        fill: true, // To fill the area under the line
      },
    ],
  };

  return (
    <div>
      <h2>Website Activity Analytics</h2>

      <div>
        <h3>Daily Activity</h3>
        <Line data={dailyChartData} />
      </div>

      <div>
        <h3>Weekly Activity</h3>
        <Line data={weeklyChartData} />
      </div>

      <div>
        <h3>Website Visit Counts</h3>
        {/* Table to show website visits per day */}
        <table>
          <thead>
            <tr>
              <th>Website</th>
              <th>Date</th>
              <th>Visit Count</th>
            </tr>
          </thead>
          <tbody>
            {dailyAnalytics.map((item) => (
              <tr key={item.day + item.url}>
                <td>{item.url}</td>
                <td>{item.day}</td>
                <td>{item.visit_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
