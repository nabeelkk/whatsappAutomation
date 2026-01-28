import React, { useState, useEffect } from 'react';
import { getCampaigns, createCampaign, deleteCampaign, getTemplates, getWhatsAppNumbers } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaPlay, FaPause, FaTrash, FaEye, FaBullhorn } from 'react-icons/fa';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'immediate',
    whatsappNumberId: '',
    messageType: 'text',
    messageContent: '',
    templateId: '',
    tags: '',
    scheduleDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [campaignsData, templatesData, numbersData] = await Promise.all([
        getCampaigns(),
        getTemplates(),
        getWhatsAppNumbers()
      ]);
      
      setCampaigns(campaignsData || []);
      setTemplates((templatesData || []).filter(t => t.status === 'APPROVED'));
      setWhatsappNumbers(numbersData || []);
      
      // Auto-select first WhatsApp number if available
      if (numbersData && numbersData.length > 0) {
        setFormData(prev => ({ ...prev, whatsappNumberId: numbersData[0]._id }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  const handleOpenModal = async () => {
    // Ensure we have the latest WhatsApp numbers before opening modal
    if (whatsappNumbers.length === 0) {
      try {
        const numbersData = await getWhatsAppNumbers();
        setWhatsappNumbers(numbersData || []);
        if (numbersData && numbersData.length > 0) {
          setFormData(prev => ({ ...prev, whatsappNumberId: numbersData[0]._id }));
        } else {
          toast.error('Please add a WhatsApp number in Settings first');
          return;
        }
      } catch (error) {
        toast.error('Failed to load WhatsApp numbers');
        return;
      }
    }
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.whatsappNumberId) {
      toast.error('Please select a WhatsApp number');
      return;
    }

    try {
      const campaignData = {
        name: formData.name,
        type: formData.type,
        whatsappNumberId: formData.whatsappNumberId,
        status: formData.type === 'immediate' ? 'running' : 'scheduled',
        filters: {
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          optInOnly: true
        },
        message: {
          type: formData.messageType,
          content: formData.messageType === 'template' ? {} : { text: formData.messageContent }
        }
      };

      if (formData.messageType === 'template') {
        campaignData.message.templateId = formData.templateId;
      }

      if (formData.type === 'scheduled' && formData.scheduleDate) {
        campaignData.schedule = {
          startDate: new Date(formData.scheduleDate)
        };
      }

      await createCampaign(campaignData);
      toast.success('Campaign created successfully');
      setShowCreateModal(false);
      setFormData({
        name: '',
        type: 'immediate',
        whatsappNumberId: whatsappNumbers.length > 0 ? whatsappNumbers[0]._id : '',
        messageType: 'text',
        messageContent: '',
        templateId: '',
        tags: '',
        scheduleDate: ''
      });
      loadData();
    } catch (error) {
      console.error('Campaign creation error:', error);
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(id);
        toast.success('Campaign deleted');
        loadData();
      } catch (error) {
        toast.error('Failed to delete campaign');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-800">Campaigns</h1>
        
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Create Campaign
        </button>
      </div>

      {/* Warning if no WhatsApp numbers */}
      {whatsappNumbers.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to add a WhatsApp Business number before creating campaigns.
                <a href="/settings" className="font-medium underline ml-2">
                  Go to Settings
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <p>Type: <span className="font-semibold">{campaign.type}</span></p>
              <p>Total Contacts: <span className="font-semibold">{campaign.stats.total}</span></p>
              <p>Sent: <span className="font-semibold text-green-600">{campaign.stats.sent}</span></p>
              <p>Delivered: <span className="font-semibold text-blue-600">{campaign.stats.delivered}</span></p>
              <p>Read: <span className="font-semibold text-purple-600">{campaign.stats.read}</span></p>
              <p>Failed: <span className="font-semibold text-red-600">{campaign.stats.failed}</span></p>
            </div>

            {campaign.stats.total > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(campaign.stats.sent / campaign.stats.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((campaign.stats.sent / campaign.stats.total) * 100)}% completed
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => handleDelete(campaign._id)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center text-sm"
              >
                <FaTrash className="mr-1" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaBullhorn size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-4">No campaigns yet. Create your first campaign!</p>
          {whatsappNumbers.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Create Campaign Modal - FIXED */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Campaign</h2>
            
            {loadingData ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Summer Sale Campaign"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Campaign Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp Number *</label>
                    <select
                      value={formData.whatsappNumberId}
                      onChange={(e) => setFormData({...formData, whatsappNumberId: e.target.value})}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {whatsappNumbers.length === 0 ? (
                        <option value="">No numbers available</option>
                      ) : (
                        whatsappNumbers.map(num => (
                          <option key={num._id} value={num._id}>
                            {num.displayName || num.phoneNumber}
                          </option>
                        ))
                      )}
                    </select>
                    {whatsappNumbers.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Please add a WhatsApp number in Settings
                      </p>
                    )}
                  </div>
                </div>

                {formData.type === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Schedule Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({...formData, scheduleDate: e.target.value})}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Message Type *</label>
                  <select
                    value={formData.messageType}
                    onChange={(e) => setFormData({...formData, messageType: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="text">Text</option>
                    <option value="template">Template</option>
                  </select>
                </div>

                {formData.messageType === 'text' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Message Content *</label>
                    <textarea
                      value={formData.messageContent}
                      onChange={(e) => setFormData({...formData, messageContent: e.target.value})}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Enter your message here..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Template *</label>
                    <select
                      value={formData.templateId}
                      onChange={(e) => setFormData({...formData, templateId: e.target.value})}
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Template</option>
                      {templates.map(template => (
                        <option key={template._id} value={template._id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    {templates.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No approved templates available. Create templates in the Templates section.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Target Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="vip, customer, premium"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to send to all opted-in contacts</p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={whatsappNumbers.length === 0}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Create Campaign
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;