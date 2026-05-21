const mongoose = require('mongoose');

const WhatsAppLogSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  leadName: {
    type: String,
    required: true
  },
  leadPhone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'failed'],
    default: 'sent'
  },
  scheduledTime: {
    type: Date,
    default: null
  },
  sentTime: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['welcome', 'reminder', 'custom'],
    default: 'custom'
  },
  twilioSid: {
    type: String,
    default: null
  },
  isSimulated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WhatsAppLog', WhatsAppLogSchema);
