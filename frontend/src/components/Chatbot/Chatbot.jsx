import React, { useState, useEffect } from 'react';
import { getChatbots, createChatbot, updateChatbot, deleteChatbot } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaPlay, FaPause } from 'react-icons/fa';

const Chatbot = () => {
  const [chatbots, setChatbots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerKeywords: '',
    flows: [
      {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 100 },
        data: { message: 'Welcome! How can I help you?' },
        nextFlowId: ''
      }
    ]
  });

  useEffect(() => {
    loadChatbots();
  }, []);

  const loadChatbots = async () => {
    try {
      const data = await getChatbots();
      setChatbots(data);
    } catch (error) {
      toast.error('Failed to load chatbots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const botData = {
        ...formData,
        triggerKeywords: formData.triggerKeywords.split(',').map(k => k.trim()).filter(Boolean)
      };

      if (selectedBot) {
        await updateChatbot(selectedBot._id, botData);
        toast.success('Chatbot updated successfully');
      } else {
        await createChatbot(botData);
        toast.success('Chatbot created successfully');
      }

      setShowCreateModal(false);
      setSelectedBot(null);
      setFormData({
        name: '',
        description: '',
        triggerKeywords: '',
        flows: [{
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { message: 'Welcome! How can I help you?' },
          nextFlowId: ''
        }]
      });
      loadChatbots();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save chatbot');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      try {
        await deleteChatbot(id);
        toast.success('Chatbot deleted');
        loadChatbots();
      } catch (error) {
        toast.error('Failed to delete chatbot');
      }
    }
  };

  const handleToggleActive = async (bot) => {
    try {
      await updateChatbot(bot._id, { isActive: !bot.isActive });
      toast.success(`Chatbot ${!bot.isActive ? 'activated' : 'deactivated'}`);
      loadChatbots();
    } catch (error) {
      toast.error('Failed to update chatbot');
    }
  };

  const addFlow = (type) => {
    const newFlow = {
      id: `flow_${Date.now()}`,
      type,
      position: { x: 100, y: formData.flows.length * 150 + 100 },
      data: {},
      nextFlowId: ''
    };

    setFormData({ ...formData, flows: [...formData.flows, newFlow] });
  };

  const updateFlow = (id, updates) => {
    setFormData({
      ...formData,
      flows: formData.flows.map(f => f.id === id ? { ...f, ...updates } : f)
    });
  };

  const removeFlow = (id) => {
    setFormData({
      ...formData,
      flows: formData.flows.filter(f => f.id !== id)
    });
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
        <h1 className="text-3xl font-bold text-gray-800">Chatbot Builder</h1>
        
        <button
          onClick={() => {
            setSelectedBot(null);
            setFormData({
              name: '',
              description: '',
              triggerKeywords: '',
              flows: [{
                id: 'start',
                type: 'start',
                position: { x: 100, y: 100 },
                data: { message: 'Welcome! How can I help you?' },
                nextFlowId: ''
              }]
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Create Chatbot
        </button>
      </div>

      {/* Chatbots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.map((bot) => (
          <div key={bot._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                <p className="text-sm text-gray-600">{bot.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                bot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {bot.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <p>Triggers: <span className="font-semibold">{bot.triggerKeywords.join(', ')}</span></p>
              <p>Total Triggers: <span className="font-semibold">{bot.stats.totalTriggers}</span></p>
              <p>Completed: <span className="font-semibold">{bot.stats.completedFlows}</span></p>
              <p>Flows: <span className="font-semibold">{bot.flows.length}</span></p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleToggleActive(bot)}
                className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center ${
                  bot.isActive
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {bot.isActive ? <><FaPause className="mr-1" /> Pause</> : <><FaPlay className="mr-1" /> Activate</>}
              </button>
              <button
                onClick={() => {
                  setSelectedBot(bot);
                  setFormData({
                    name: bot.name,
                    description: bot.description,
                    triggerKeywords: bot.triggerKeywords.join(', '),
                    flows: bot.flows
                  });
                  setShowCreateModal(true);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(bot._id)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {chatbots.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No chatbots yet. Create your first chatbot!</p>
        </div>
      )}

      {/* Create/Edit Chatbot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8">
            <h2 className="text-2xl font-bold mb-4">{selectedBot ? 'Edit' : 'Create'} Chatbot</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bot Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Keywords (comma-separated) *</label>
                  <input
                    type="text"
                    value={formData.triggerKeywords}
                    onChange={(e) => setFormData({...formData, triggerKeywords: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="hello, hi, help"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Conversation Flow</label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => addFlow('message')}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      + Message
                    </button>
                    <button
                      type="button"
                      onClick={() => addFlow('question')}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                    >
                      + Question
                    </button>
                    <button
                      type="button"
                      onClick={() => addFlow('action')}
                      className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                    >
                      + Action
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                  {formData.flows.map((flow, index) => (
                    <div key={flow.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">
                          {index + 1}. {flow.type.toUpperCase()}
                        </span>
                        {flow.type !== 'start' && (
                          <button
                            type="button"
                            onClick={() => removeFlow(flow.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>

                      {flow.type === 'message' && (
                        <input
                          type="text"
                          value={flow.data.message || ''}
                          onChange={(e) => updateFlow(flow.id, { data: { ...flow.data, message: e.target.value } })}
                          placeholder="Message text..."
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      )}

                      {flow.type === 'question' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={flow.data.message || ''}
                            onChange={(e) => updateFlow(flow.id, { data: { ...flow.data, message: e.target.value } })}
                            placeholder="Question text..."
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                          <input
                            type="text"
                            value={flow.data.variableName || ''}
                            onChange={(e) => updateFlow(flow.id, { data: { ...flow.data, variableName: e.target.value } })}
                            placeholder="Variable name (e.g., user_name)"
                            className="w-full px-3 py-2 border rounded text-sm"
                          />
                        </div>
                      )}

                      {flow.type === 'action' && (
                        <select
                          value={flow.data.action?.type || ''}
                          onChange={(e) => updateFlow(flow.id, { data: { ...flow.data, action: { type: e.target.value } } })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="">Select Action</option>
                          <option value="addTag">Add Tag</option>
                          <option value="removeTag">Remove Tag</option>
                          <option value="updateField">Update Field</option>
                          <option value="webhook">Webhook</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {selectedBot ? 'Update' : 'Create'} Chatbot
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
