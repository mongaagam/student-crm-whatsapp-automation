const cron = require('node-cron');
const Lead = require('../models/Lead');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { sendEmailReport } = require('../services/emailService');

/**
 * Checks for leads scheduled for follow-ups today and sends automatic WhatsApp notifications.
 * @returns {Promise<Array>} - List of logged messages
 */
const runDailyFollowUpCheck = async () => {
  console.log('[CRON] Starting daily follow-up checker...');
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  try {
    // Find leads where nextFollowUp is today or in the past, and status is not 'converted' or 'lost'
    const pendingLeads = await Lead.find({
      nextFollowUp: { $lte: todayEnd },
      status: { $in: ['new', 'contacted'] }
    });

    console.log(`[CRON] Found ${pendingLeads.length} pending follow-up leads.`);
    const logs = [];

    for (const lead of pendingLeads) {
      const message = `Hi ${lead.name}, this is an automated follow-up reminder from Admissions. We had scheduled a catch-up regarding your target course: *${lead.course}*. Do you have 10 minutes to connect today?`;
      
      const log = await sendWhatsAppMessage(lead, message, 'reminder');
      logs.push({
        leadName: lead.name,
        phone: lead.phone,
        status: log.status,
        isSimulated: log.isSimulated
      });

      // Update lead's next follow up to 3 days from now as a placeholder to avoid spamming daily
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      lead.nextFollowUp = threeDaysLater;
      await lead.save();
    }

    console.log('[CRON] Completed daily follow-up notifications.');
    return logs;
  } catch (error) {
    console.error('[CRON ERROR] Daily follow-up check failed:', error.message);
    throw error;
  }
};

/**
 * Compiles a CRM dashboard summary and emails it to the administrator.
 * @returns {Promise<Object>} - Report data sent
 */
const runDailyExecutiveReport = async () => {
  console.log('[CRON] Starting daily executive report generation...');

  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const contactedLeads = await Lead.countDocuments({ status: 'contacted' });
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const lostLeads = await Lead.countDocuments({ status: 'lost' });

    // Country wise breakdown
    const countryStats = await Lead.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Added in last 24 hours
    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLeads = await Lead.find({ createdAt: { $gte: past24Hours } }).limit(5);

    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fcfcfc;">
        <h2 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Executive CRM Daily Summary</h2>
        
        <p style="font-size: 15px; color: #555;">Here is the daily performance dashboard summary for your admissions funnel as of <b>${new Date().toLocaleDateString()}</b>:</p>
        
        <div style="margin: 20px 0; background-color: #ecf0f1; padding: 15px; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #2c3e50;">Total Managed Leads:</td>
              <td style="text-align: right; font-weight: bold; color: #2c3e50;">${totalLeads}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #27ae60; font-weight: bold;">Converted Students:</td>
              <td style="text-align: right; color: #27ae60; font-weight: bold;">${convertedLeads} (${conversionRate}%)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #e67e22;">Active Follow-ups:</td>
              <td style="text-align: right; color: #e67e22;">${contactedLeads}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #3498db;">New Inbound Leads:</td>
              <td style="text-align: right; color: #3498db;">${newLeads}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #95a5a6;">Lost Leads:</td>
              <td style="text-align: right; color: #95a5a6;">${lostLeads}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #2c3e50; font-size: 16px; border-left: 4px solid #3498db; padding-left: 8px;">Top Active Lead Demographics</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 10px 0;">
          <tr style="background-color: #f2f2f2;">
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Country</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Lead Count</th>
          </tr>
          ${countryStats.slice(0, 5).map(stat => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${stat._id}</td>
              <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${stat.count}</td>
            </tr>
          `).join('')}
        </table>

        ${recentLeads.length > 0 ? `
          <h3 style="color: #2c3e50; font-size: 16px; border-left: 4px solid #27ae60; padding-left: 8px; margin-top: 20px;">Leads Added Today</h3>
          <ul style="font-size: 13px; color: #555; padding-left: 20px;">
            ${recentLeads.map(l => `<li><b>${l.name}</b> (${l.country}) - ${l.course} - <i>Status: ${l.status}</i></li>`).join('')}
          </ul>
        ` : ''}

        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px dashed #e0e0e0; padding-top: 15px;">
          This is an automated system generated report from your AI Student CRM.
        </p>
      </div>
    `;

    const adminEmail = process.env.ADMIN_REPORT_EMAIL || 'admin@studentcrm.com';
    const emailResult = await sendEmailReport(
      adminEmail,
      `[Student CRM] Daily Performance Report - ${new Date().toLocaleDateString()}`,
      htmlContent
    );

    console.log('[CRON] Executive report emailed successfully.');
    return {
      totalLeads,
      convertedLeads,
      contactedLeads,
      newLeads,
      lostLeads,
      conversionRate,
      emailSentTo: adminEmail,
      simulated: emailResult.simulated
    };
  } catch (error) {
    console.error('[CRON ERROR] Executive report failed:', error.message);
    throw error;
  }
};

/**
 * Initializes and schedules the background cron jobs.
 */
const initCronJobs = () => {
  // 1. Run at 9:00 AM every day: check follow-ups and send WhatsApp automated reminders
  // Cron syntax: '0 9 * * *'
  cron.schedule('0 9 * * *', async () => {
    try {
      await runDailyFollowUpCheck();
    } catch (err) {
      console.error('[CRON RUN TIME ERROR] Follow-up job exception:', err.message);
    }
  });

  // 2. Run at 11:59 PM every day: compile dashboard and email executive summary
  // Cron syntax: '59 23 * * *'
  cron.schedule('59 23 * * *', async () => {
    try {
      await runDailyExecutiveReport();
    } catch (err) {
      console.error('[CRON RUN TIME ERROR] Report job exception:', err.message);
    }
  });

  console.log('[CRON SERVICE] Cron schedules registered successfully:');
  console.log(' - Follow-Up automated reminders: Scheduled for 09:00 AM daily.');
  console.log(' - Daily Executive email reports: Scheduled for 11:59 PM daily.');
};

module.exports = {
  initCronJobs,
  runDailyFollowUpCheck,
  runDailyExecutiveReport
};
