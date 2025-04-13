import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAnalyticsData } from './analyticsSlice';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode.react';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const analyticsData = useSelector((state) => state.analytics.analyticsData) || [];
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/analytics');
        const data = await response.json();
        dispatch(setAnalyticsData(data));
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dispatch]);

  const handleLinkClick = async (shortUrl) => {
    try {
      await fetch(`http://localhost:5000/api/click/${shortUrl}`, { method: 'POST' });
      const response = await fetch('http://localhost:5000/api/analytics');
      const data = await response.json();
      dispatch(setAnalyticsData(data));
    } catch (error) {
      console.error('Error updating click count:', error);
    }
  };

  // Filter analytics data based on search term
  const filteredAnalyticsData = analyticsData.filter((link) =>
    link.longUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.shortUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = {
    labels: filteredAnalyticsData.map((item) => item.shortUrl),
    datasets: [
      {
        label: 'Click Count',
        data: filteredAnalyticsData.map((item) => item.clicks),
        backgroundColor: 'rgb(86, 77, 208)', // Tailwind indigo-500
        borderRadius: 5,
        deviceInfo: filteredAnalyticsData.map((item) => {
          const devices = item.devices || [];
          return devices.reduce((acc, d) => {
            acc[d.device] = d.count;
            return acc;
          }, {});
        }),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const index = context.dataIndex;
            const deviceData = dataset.deviceInfo?.[index];

            let label = `Clicks: ${context.formattedValue}`;
            if (deviceData) {
              const deviceDetails = Object.entries(deviceData)
                .map(([device, count]) => `${device}: ${count}`)
                .join(', ');
              label += ` | ${deviceDetails}`;
            }

            return label;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <span className="text-xl font-semibold text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">📊 Analytics Dashboard</h2>
          <Link
            to="/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-200"
          >
            + Create New Link
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search by short URL..."
            className="p-2 border border-gray-500 rounded-md w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto bg-white rounded-xl shadow-md">
            <thead>
              <tr className="bg-indigo-100 text-indigo-700">
                <th className="px-4 py-3 text-left">Original URL</th>
                <th className="px-4 py-3 text-left">Short URL</th>
                <th className="px-4 py-3 text-left">QR Code</th>
                <th className="px-4 py-3 text-left">Total Clicks</th>
                <th className="px-4 py-3 text-left">Created Date</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnalyticsData.length > 0 ? (
                filteredAnalyticsData.map((link) => (
                  <tr key={link.shortUrl} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700 break-all">{link.longUrl}</td>
                    <td className="px-4 py-3">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                        onClick={() => handleLinkClick(link.shortUrl)}
                      >
                        {link.shortUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/qr/${link.shortUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Click here
                      </a>
                    </td>
                    <td className="px-4 py-3">{link.clicks}</td>
                    <td className="px-4 py-3">{new Date(link.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-lg ${link.expirationDate
                          ? new Date(link.expirationDate) > new Date()
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {link.expirationDate
                          ? new Date(link.expirationDate) > new Date()
                            ? 'Active'
                            : 'Expired'
                          : 'No Expiration'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    No matching analytics data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
