import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, getContacts, getWhatsAppNumbers } from '../../services/api';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaImage, FaFile, FaSmile, FaCheckCircle, FaCheck } from 'react-icons/fa';
import io from 'socket.io-client';

const Inbox = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [whatsappNumbers, setWhatsappNumbers] = useState([]);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    loadData();
    
    // Setup socket connection
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    socketRef.current = io(import.meta.env.REACT_APP_SOCKET_URL || '');
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join_user', userId);
    });

    socketRef.current.on('new_message', (message) => {
      if (selectedContact && message.contactId === selectedContact._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      // Reload contacts to update last message
      loadContacts();
    });

    socketRef.current.on('message_status_update', (message) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    });

    socketRef.current.on('message_sent', (message) => {
      if (selectedContact && message.contactId === selectedContact._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages();
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    try {
      const [contactsData, numbersData] = await Promise.all([
        getContacts({ limit: 100 }),
        getWhatsAppNumbers()
      ]);
      
      setContacts(contactsData.contacts || []);
      setWhatsappNumbers(numbersData || []);
      
      if (numbersData && numbersData.length > 0) {
        setSelectedNumber(numbersData[0]);
      } else {
        toast.warning('Please add a WhatsApp number in Settings first');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await getContacts({ limit: 100 });
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to reload contacts');
    }
  };

  const loadMessages = async () => {
    try {
      const data = await getMessages({ contactId: selectedContact._id });
      setMessages(data.messages ? data.messages.reverse() : []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast.warning('Please enter a message');
      return;
    }
    
    if (!selectedContact) {
      toast.warning('Please select a contact');
      return;
    }
    
    if (!selectedNumber) {
      toast.error('No WhatsApp number selected. Please add one in Settings.');
      return;
    }

    setSending(true);

    try {
      const messageData = {
        contactId: selectedContact._id,
        whatsappNumberId: selectedNumber._id,
        type: 'text',
        content: { text: newMessage }
      };

      const message = await sendMessage(messageData);

      // Add message to UI immediately
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <FaCheck className="text-gray-400" size={12} />;
      case 'delivered':
        return <FaCheckCircle className="text-gray-400" size={12} />;
      case 'read':
        return <FaCheckCircle className="text-blue-500" size={12} />;
      default:
        return null;
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
    contact.phoneNumber.includes(searchContact)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (whatsappNumbers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No WhatsApp number configured</p>
          <p className="text-gray-500 mb-4">Please add a WhatsApp Business number in Settings</p>
          <button
            onClick={() => window.location.href = '/settings'}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Live Chat Inbox</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-200px)] flex">
        {/* Contacts Sidebar */}
        <div className="w-1/3 border-r overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="divide-y">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedContact?._id === contact._id ? 'bg-green-50 border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg mr-3 flex-shrink-0">
                      {contact.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {contact.name || contact.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{contact.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No contacts found</p>
                <button
                  onClick={() => window.location.href = '/contacts'}
                  className="mt-4 text-green-600 hover:text-green-700 font-semibold"
                >
                  Add Contacts
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Header */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                    {selectedContact.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedContact.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{selectedContact.phoneNumber}</p>
                  </div>
                </div>

                {whatsappNumbers.length > 1 && (
                  <select
                    value={selectedNumber?._id}
                    onChange={(e) => setSelectedNumber(whatsappNumbers.find(n => n._id === e.target.value))}
                    className="px-3 py-1 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {whatsappNumbers.map(num => (
                      <option key={num._id} value={num._id}>
                        {num.displayName || num.phoneNumber}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.direction === 'outbound'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 shadow'
                        }`}
                      >
                        {message.content.text && <p className="break-words">{message.content.text}</p>}
                        {message.content.mediaUrl && (
                          <img src={message.content.mediaUrl} alt="Media" className="mt-2 rounded max-w-full" />
                        )}
                        <div className={`flex items-center space-x-1 text-xs mt-1 ${
                          message.direction === 'outbound' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.direction === 'outbound' && (
                            <>
                              <span>•</span>
                              {getStatusIcon(message.status)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                <div className="flex items-center space-x-2">
                  <button 
                    type="button" 
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    disabled={sending}
                  >
                    <FaSmile size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    disabled={sending}
                  >
                    <FaImage size={20} />
                  </button>
                  <button 
                    type="button" 
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    disabled={sending}
                  >
                    <FaFile size={20} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaPaperPlane />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FaSmile size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a contact to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;