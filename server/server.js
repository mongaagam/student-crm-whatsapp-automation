require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const { initCronJobs } = require('./cron/followUpCron');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Student CRM Server is running smoothly!' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR HANDLER]:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An internal server error occurred'
  });
});

// Database Connection & Server Bootstrap
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/student-crm';

console.log('Connecting to MongoDB database...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB successfully connected.');
    
    // Start Server Listener
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 STUDENT CRM SERVER RUNNING ON PORT: ${PORT}`);
      console.log(`🔗 API Base url: http://localhost:${PORT}/api`);
      console.log(`==================================================`);
      
      // Initialize automated background tasks (Cron)
      initCronJobs();
    });
  })
  .catch(err => {
    console.error('CRITICAL ERROR: Failed to connect to MongoDB database.');
    console.error(err.message);
    console.log('Ensure MongoDB service is running locally or check MONGO_URI in your .env file.');
    process.exit(1);
  });
