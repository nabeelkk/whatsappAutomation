import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, deleteTemplate } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttons: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const components = [];

      if (formData.headerText) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: formData.headerText
        });
      }

      components.push({
        type: 'BODY',
        text: formData.bodyText
      });

      if (formData.footerText) {
        components.push({
          type: 'FOOTER',
          text: formData.footerText
        });
      }

      if (formData.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: formData.buttons
        });
      }

      const templateData = {
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        category: formData.category,
        language: formData.language,
        components
      };

      await createTemplate(templateData);
      toast.success('Template submitted for approval');
      setShowCreateModal(false);
      setFormData({
        name: '',
        category: 'MARKETING',
        language: 'en',
        headerText: '',
        bodyText: '',
        footerText: '',
        buttons: []
      });
      loadTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(id);
        toast.success('Template deleted');
        loadTemplates();
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const addButton = () => {
    setFormData({
      ...formData,
      buttons: [...formData.buttons, { type: 'QUICK_REPLY', text: '' }]
    });
  };

  const updateButton = (index, field, value) => {
    const newButtons = [...formData.buttons];
    newButtons[index][field] = value;
    setFormData({ ...formData, buttons: newButtons });
  };

  const removeButton = (index) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index)
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <FaCheckCircle className="text-green-500" />;
      case 'PENDING':
        return <FaClock className="text-yellow-500" />;
      case 'REJECTED':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
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
        <h1 className="text-3xl font-bold text-gray-800">Message Templates</h1>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
        >
          <FaPlus className="mr-2" /> Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(template.status)}
                <button
                  onClick={() => handleDelete(template._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="border rounded p-3 bg-gray-50 space-y-2 text-sm">
              {template.components.map((comp, i) => (
                <div key={i}>
                  {comp.type === 'HEADER' && (
                    <p className="font-semibold">{comp.text}</p>
                  )}
                  {comp.type === 'BODY' && (
                    <p className="text-gray-700">{comp.text}</p>
                  )}
                  {comp.type === 'FOOTER' && (
                    <p className="text-gray-500 text-xs">{comp.text}</p>
                  )}
                  {comp.type === 'BUTTONS' && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {comp.buttons.map((btn, j) => (
                        <span key={j} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {btn.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {template.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No templates yet. Create your first template!</p>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create Template</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="welcome_message"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Header (Optional)</label>
                <input
                  type="text"
                  value={formData.headerText}
                  onChange={(e) => setFormData({...formData, headerText: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Body *</label>
                <textarea
                  value={formData.bodyText}
                  onChange={(e) => setFormData({...formData, bodyText: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Footer (Optional)</label>
                <input
                  type="text"
                  value={formData.footerText}
                  onChange={(e) => setFormData({...formData, footerText: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Buttons (Optional)</label>
                  <button
                    type="button"
                    onClick={addButton}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    + Add Button
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.buttons.map((button, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={button.type}
                        onChange={(e) => updateButton(index, 'type', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="QUICK_REPLY">Quick Reply</option>
                        <option value="URL">URL</option>
                        <option value="PHONE_NUMBER">Phone</option>
                      </select>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateButton(index, 'text', e.target.value)}
                        placeholder="Button text"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeButton(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Submit for Approval
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

export default Templates;