const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const connectDB = require('./config/db');
const whatsappConfig = require('./config/whatsapp');
const { validateCloudinaryConfig } = require('./config/cloudinary');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true }
});

// Validate configurations
try {
  whatsappConfig.validateConfig();
  console.log('✓ WhatsApp configuration validated');
} catch (error) {
  console.error('✗ WhatsApp configuration error:', error.message);
}

if (validateCloudinaryConfig()) {
  console.log('✓ Cloudinary configuration validated');
} else {
  console.warn('⚠ Cloudinary not configured (optional for basic functionality)');
}

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
connectDB();

// Socket.IO
global.io = io;
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/social', require('./routes/social'));
app.use('/api/numbers', require('./routes/numbers'));

// Webhook for WhatsApp
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', require('./services/webhookService'));

// Scheduler for campaigns
const schedulerService = require('./services/schedulerService');
cron.schedule('* * * * *', schedulerService.checkScheduledCampaigns);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});