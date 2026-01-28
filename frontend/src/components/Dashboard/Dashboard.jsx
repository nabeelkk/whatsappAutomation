import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardAnalytics } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaEnvelope, FaCheckCircle, FaEye, FaBullhorn, FaRobot } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

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
          startDate.setDate(endDate.getDate() - 7);
      }

      const data = await getDashboardAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addContact':
        navigate('/contacts');
        break;
      case 'sendMessage':
        navigate('/inbox');
        break;
      case 'newCampaign':
        navigate('/campaigns');
        break;
      case 'createBot':
        navigate('/chatbot');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Contacts',
      value: analytics?.overview?.totalContacts || 0,
      icon: FaUsers,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Messages Sent',
      value: analytics?.overview?.totalMessages || 0,
      icon: FaEnvelope,
      color: 'bg-green-500',
      change: '+23%'
    },
    {
      title: 'Delivered',
      value: analytics?.overview?.deliveredMessages || 0,
      icon: FaCheckCircle,
      color: 'bg-yellow-500',
      change: `${analytics?.deliveryRate || 0}%`
    },
    {
      title: 'Read Rate',
      value: `${analytics?.readRate || 0}%`,
      icon: FaEye,
      color: 'bg-purple-500',
      change: '+5%'
    },
    {
      title: 'Active Campaigns',
      value: analytics?.overview?.activeCampaigns || 0,
      icon: FaBullhorn,
      color: 'bg-red-500',
      change: '2 running'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white text-xl" />
                </div>
                <span className="text-sm text-green-600 font-semibold">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Over Time */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Messages Over Time</h2>
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

        {/* Message Distribution */}
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

      {/* Quick Actions - FIXED */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('addContact')}
            className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors cursor-pointer"
          >
            <FaUsers className="text-green-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Add Contact</p>
          </button>
          <button 
            onClick={() => handleQuickAction('sendMessage')}
            className="p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <FaEnvelope className="text-blue-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Send Message</p>
          </button>
          <button 
            onClick={() => handleQuickAction('newCampaign')}
            className="p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <FaBullhorn className="text-purple-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">New Campaign</p>
          </button>
          <button 
            onClick={() => handleQuickAction('createBot')}
            className="p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors cursor-pointer"
          >
            <FaRobot className="text-yellow-500 text-2xl mx-auto mb-2" />
            <p className="text-sm font-semibold">Create Bot</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;