import React, { useState, useEffect } from 'react';
import { getDashboardAnalytics, exportData } from '../../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const data = await getDashboardAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const data = await exportData(type, startDate.toISOString(), endDate.toISOString());
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.json`;
      a.click();
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Analytics & Reports</h1>
        
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <div className="relative">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
              <FaDownload className="mr-2" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Messages Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.messagesByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent" stroke="#10b981" strokeWidth={2} name="Sent" />
              <Line type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={2} name="Received" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Message Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.messagesByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="#10b981" name="Sent" />
              <Bar dataKey="received" fill="#3b82f6" name="Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Export Reports</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('contacts')}
            className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
          >
            <FaDownload className="text-green-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Export Contacts</p>
          </button>
          <button
            onClick={() => handleExport('messages')}
            className="p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <FaDownload className="text-blue-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Export Messages</p>
          </button>
          <button
            onClick={() => handleExport('campaigns')}
            className="p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <FaDownload className="text-purple-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Export Campaigns</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;