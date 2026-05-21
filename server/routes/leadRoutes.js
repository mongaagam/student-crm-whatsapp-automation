const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
console.log("Lead Routes Loaded");

const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  triggerAIAnalysis,
  triggerWhatsAppMessage,
  importCSVLeads,
  exportCSVLeads,
  getDashboardStats,
  getWhatsAppLogs,
  triggerCronFollowUp,
  triggerCronDailyReport
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer for temp CSV uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Protect all CRM routes under JWT auth
//router.use(protect);

// Analytical Statistics (Must be above /:id to avoid collision)
router.get('/stats/dashboard', getDashboardStats);
router.get('/stats/whatsapp-logs', getWhatsAppLogs);

// Import & Export
router.get('/export', exportCSVLeads);
router.post('/import', upload.single('file'), importCSVLeads);

// Manual Automation Cron Overrides
router.post('/automation/trigger-followups', triggerCronFollowUp);
router.post('/automation/trigger-daily-report', triggerCronDailyReport);

// Core CRUD Endpoints
router.get('/', getLeads);
router.post('/', createLead);
router.get('/:id', getLeadById);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

// Direct Actions / Integrations
router.post('/:id/analyze', triggerAIAnalysis);
router.post('/:id/whatsapp', triggerWhatsAppMessage);

module.exports = router;
