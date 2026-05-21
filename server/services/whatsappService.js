const WhatsAppLog = require('../models/WhatsAppLog');
const Lead = require('../models/Lead');

/**
 * Sends a WhatsApp message using Twilio WhatsApp API, or logs it in simulator mode if no credentials exist.
 * @param {Object} lead - Lead object
 * @param {string} messageBody - The text content of the message
 * @param {string} type - Message type: 'welcome', 'reminder', 'custom'
 * @returns {Promise<Object>} - WhatsAppLog record
 */
const sendWhatsAppMessage = async (lead, messageBody, type = 'custom') => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Default sandbox number

  let isSimulated = true;
  let twilioSid = null;
  let status = 'sent';

  if (accountSid && authToken) {
    try {
      console.log(`Sending live Twilio WhatsApp message to ${lead.phone}...`);
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      const toPhoneNumber = lead.phone.startsWith('whatsapp:') ? lead.phone : `whatsapp:${lead.phone}`;
      
      const response = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: toPhoneNumber
      });

      twilioSid = response.sid;
      isSimulated = false;
      status = 'sent';
      console.log(`Twilio message sent. SID: ${twilioSid}`);
    } catch (err) {
      console.error('Failed to send live Twilio WhatsApp message:', err.message);
      status = 'failed';
    }
  } else {
    console.log(`[SIMULATOR WHATSAPP] To: ${lead.phone} (${lead.name})`);
    console.log(`[SIMULATOR WHATSAPP] Body: "${messageBody}"`);
    isSimulated = true;
    status = 'sent';
  }

  // Record log in Database
  const log = await WhatsAppLog.create({
    leadId: lead._id,
    leadName: lead.name,
    leadPhone: lead.phone,
    message: messageBody,
    status,
    type,
    twilioSid,
    isSimulated,
    sentTime: new Date()
  });

  // Update lead's WhatsApp status
  if (status === 'sent') {
    let whatsappStatus = 'welcome_sent';
    if (type === 'reminder') {
      whatsappStatus = 'followup_sent';
    } else if (type === 'welcome') {
      whatsappStatus = 'welcome_sent';
    }
    await Lead.findByIdAndUpdate(lead._id, {
      whatsappStatus,
      lastContacted: new Date()
    });
  } else {
    await Lead.findByIdAndUpdate(lead._id, {
      whatsappStatus: 'failed'
    });
  }

  return log;
};

module.exports = { sendWhatsAppMessage };
