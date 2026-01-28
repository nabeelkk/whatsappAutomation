import React, { useState, useEffect } from 'react';
import { getWhatsAppNumbers, addWhatsAppNumber, deleteWhatsAppNumber, updateWhatsAppNumber } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaWhatsapp, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [numbers, setNumbers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    displayName: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: ''
  });

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      const data = await getWhatsAppNumbers();
      setNumbers(data || []);
    } catch (error) {
      console.error('Failed to load WhatsApp numbers:', error);
      toast.error('Failed to load WhatsApp numbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number format
    if (!formData.phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error('Please enter a valid phone number in E.164 format (e.g., +1234567890)');
      return;
    }

    try {
      await addWhatsAppNumber(formData);
      toast.success('WhatsApp number added successfully! 🎉');
      setShowAddModal(false);
      setFormData({
        phoneNumber: '',
        displayName: '',
        phoneNumberId: '',
        businessAccountId: '',
        accessToken: ''
      });
      loadNumbers();
    } catch (error) {
      console.error('Add number error:', error);
      toast.error(error.response?.data?.error || 'Failed to add WhatsApp number');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this WhatsApp number? This action cannot be undone.')) {
      try {
        await deleteWhatsAppNumber(id);
        toast.success('WhatsApp number deleted');
        loadNumbers();
      } catch (error) {
        toast.error('Failed to delete WhatsApp number');
      }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <nav className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'whatsapp'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaWhatsapp className="inline mr-2" />
              WhatsApp Numbers
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              General
            </button>
          </nav>
        </div>

        {/* WhatsApp Numbers Tab */}
        {activeTab === 'whatsapp' && (
          <div className="p-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex items-start">
                <FaInfoCircle className="text-blue-400 mt-1 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>WhatsApp Business API Required:</strong> You need a WhatsApp Business API account to use this platform.
                  </p>
                  <button
                    onClick={() => setShowGuideModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center"
                  >
                    How to get WhatsApp Business API credentials
                    <FaExternalLinkAlt className="ml-1" size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">WhatsApp Business Numbers</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaPlus className="mr-2" /> Add WhatsApp Number
              </button>
            </div>

            {/* Numbers List */}
            <div className="space-y-3">
              {numbers.map((number) => (
                <div key={number._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FaWhatsapp className="text-green-500 text-2xl mr-3" />
                        <div>
                          <p className="font-semibold text-lg">{number.displayName || number.phoneNumber}</p>
                          <p className="text-sm text-gray-600">{number.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Phone Number ID</p>
                          <p className="font-mono text-xs text-gray-700 break-all">{number.phoneNumberId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Daily Usage</p>
                          <p className="font-semibold">
                            {number.currentDailyCount} / {number.dailyLimit} messages
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(number.currentDailyCount / number.dailyLimit) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        number.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {number.isActive ? '● Active' : '● Inactive'}
                      </span>
                      <button
                        onClick={() => handleDelete(number._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete number"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {numbers.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                  <FaWhatsapp className="text-gray-300 text-6xl mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No WhatsApp numbers configured yet</p>
                  <p className="text-gray-400 text-sm mb-4">Add your first WhatsApp Business number to start messaging</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center"
                  >
                    <FaPlus className="mr-2" /> Add Your First Number
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Additional settings coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Number Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <FaWhatsapp className="text-green-500 mr-2" />
              Add WhatsApp Business Number
            </h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You need credentials from WhatsApp Business API. 
                <button 
                  onClick={() => setShowGuideModal(true)}
                  className="text-blue-600 hover:text-blue-800 ml-1 underline"
                >
                  Click here for setup guide
                </button>
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Display Name <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="My Business WhatsApp"
                  />
                  <p className="text-xs text-gray-500 mt-1">Friendly name to identify this number</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: +[country code][number] (E.164 format)</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Phone Number ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({...formData, phoneNumberId: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder="102364918273645"
                  />
                  <p className="text-xs text-gray-500 mt-1">From WhatsApp Business API Dashboard</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Business Account ID <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessAccountId}
                    onChange={(e) => setFormData({...formData, businessAccountId: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    placeholder="108364948273645"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your WhatsApp Business Account ID</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Access Token <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.accessToken}
                    onChange={(e) => setFormData({...formData, accessToken: e.target.value})}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-xs"
                    placeholder="EAAxxxxxxxxxx..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Permanent access token from Meta Business Suite. 
                    <strong className="text-red-600"> Keep this secret!</strong>
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
                >
                  Add WhatsApp Number
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      phoneNumber: '',
                      displayName: '',
                      phoneNumberId: '',
                      businessAccountId: '',
                      accessToken: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">WhatsApp Business API Setup Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Step 1: Create Meta Business Account</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.facebook.com</a></li>
                  <li>Create a Business Account if you don't have one</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Step 2: Create a Meta App</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Visit <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
                  <li>Click "My Apps" → "Create App"</li>
                  <li>Select "Business" as app type</li>
                  <li>Fill in app details and create</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Step 3: Add WhatsApp Product</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>In your app dashboard, click "Add Product"</li>
                  <li>Find "WhatsApp" and click "Set Up"</li>
                  <li>Complete the WhatsApp Business API setup</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Step 4: Get Your Credentials</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Phone Number ID:</strong></p>
                  <p className="text-gray-700">WhatsApp → API Setup → Phone Number ID</p>
                  
                  <p className="mt-3"><strong>Access Token:</strong></p>
                  <p className="text-gray-700">WhatsApp → API Setup → Temporary Access Token (get permanent token)</p>
                  
                  <p className="mt-3"><strong>Business Account ID:</strong></p>
                  <p className="text-gray-700">Business Settings → Business Info → Business Account ID</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Step 5: Get Permanent Access Token</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Go to your App → Tools → Access Token Tool</li>
                  <li>Select your System User</li>
                  <li>Generate token with "whatsapp_business_messaging" permission</li>
                  <li>Copy and save the token securely</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Keep your access token secure. Never share it publicly or commit it to version control.
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Need Help?</strong> Visit the <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="underline">official WhatsApp Cloud API documentation</a>
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                Got it, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;