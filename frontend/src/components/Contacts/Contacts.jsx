import React, { useState, useEffect } from 'react';
import { getContacts, createContact, updateContact, deleteContact, importContacts, bulkContactAction } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaFileImport, FaEdit, FaTrash, FaTags, FaDownload, FaUsers } from 'react-icons/fa';
import { CSVLink } from 'react-csv';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTag, setFilterTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    tags: ''
  });

  const [groupFormData, setGroupFormData] = useState({
    groupName: '',
    description: '',
    contactIds: []
  });

  useEffect(() => {
    loadContacts();
  }, [page, search, filterTag]);

  const loadContacts = async () => {
    try {
      const params = { page, search, limit: 50 };
      if (filterTag) {
        params.tags = filterTag;
      }

      const data = await getContacts(params);
      setContacts(data.contacts);
      setTotalPages(data.totalPages);

      // Extract all unique tags
      const tags = new Set();
      data.contacts.forEach(contact => {
        contact.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const contactData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingContact) {
        await updateContact(editingContact._id, contactData);
        toast.success('Contact updated successfully');
      } else {
        await createContact(contactData);
        toast.success('Contact created successfully');
      }

      setShowAddModal(false);
      setEditingContact(null);
      setFormData({ name: '', phoneNumber: '', email: '', tags: '' });
      loadContacts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact(id);
        toast.success('Contact deleted');
        loadContacts();
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const result = await importContacts(file);
      toast.success(`Imported ${result.imported} contacts`);
      loadContacts();
    } catch (error) {
      toast.error('Failed to import contacts');
    }
    e.target.value = '';
  };

  const handleBulkAction = async (action) => {
    if (selectedContacts.length === 0) {
      toast.warning('Please select contacts first');
      return;
    }

    try {
      let data = {};
      
      if (action === 'addTags') {
        const tags = prompt('Enter tags (comma-separated):');
        if (!tags) return;
        data = { tags: tags.split(',').map(t => t.trim()) };
      } else if (action === 'createGroup') {
        setGroupFormData({ ...groupFormData, contactIds: selectedContacts });
        setShowGroupModal(true);
        return;
      }

      await bulkContactAction(action, selectedContacts, data);
      toast.success('Bulk action completed');
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      // Add group tag to selected contacts
      const groupTag = `group:${groupFormData.groupName.toLowerCase().replace(/\s+/g, '-')}`;
      await bulkContactAction('addTags', groupFormData.contactIds, { tags: [groupTag] });
      
      toast.success(`Group "${groupFormData.groupName}" created with ${groupFormData.contactIds.length} contacts`);
      setShowGroupModal(false);
      setGroupFormData({ groupName: '', description: '', contactIds: [] });
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(c => c._id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phoneNumber: contact.phoneNumber,
      email: contact.email || '',
      tags: contact.tags.join(', ')
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
        
        <div className="flex space-x-3">
          <CSVLink
            data={contacts}
            filename="contacts.csv"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <FaDownload className="mr-2" /> Export
          </CSVLink>
          
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center">
            <FaFileImport className="mr-2" /> Import
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          
          <button
            onClick={() => {
              setEditingContact(null);
              setFormData({ name: '', phoneNumber: '', email: '', tags: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <FaPlus className="mr-2" /> Add Contact
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Tag Filter */}
          <div className="mr-4">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {selectedContacts.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('createGroup')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FaUsers className="mr-2" /> Create Group
              </button>
              <button
                onClick={() => handleBulkAction('addTags')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <FaTags className="mr-2" /> Add Tags
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                <FaTrash className="mr-2" /> Delete ({selectedContacts.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact._id)}
                    onChange={() => handleSelectContact(contact._id)}
                    className="rounded"
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{contact.name || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{contact.phoneNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{contact.email || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`px-2 py-1 text-xs rounded-full ${
                          tag.startsWith('group:') 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tag.startsWith('group:') ? tag.replace('group:', '📁 ') : tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    contact.optIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {contact.optIn ? 'Opted In' : 'Opted Out'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => openEditModal(contact)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(contact._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingContact ? 'Edit' : 'Add'} Contact</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="customer, vip, premium"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  {editingContact ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Create Contact Group</h2>
            
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name *</label>
                <input
                  type="text"
                  value={groupFormData.groupName}
                  onChange={(e) => setGroupFormData({...groupFormData, groupName: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="VIP Customers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Group description..."
                />
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <strong>{groupFormData.contactIds.length}</strong> contacts will be added to this group
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
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

export default Contacts;