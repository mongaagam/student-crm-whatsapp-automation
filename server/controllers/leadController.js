const Lead = require('../models/Lead');
const WhatsAppLog = require('../models/WhatsAppLog');
const { analyzeLead } = require('../services/aiService');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { runDailyFollowUpCheck, runDailyExecutiveReport } = require('../cron/followUpCron');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * @desc    Get all student leads with filtering & search
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res) => {
  try {
    const { search, status, country, course } = req.query;
    const query = {};

    // Apply Search Filter (Name, Email, Phone)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Status Filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply Country Filter
    if (country && country !== 'all') {
      query.country = country;
    }

    // Apply Course Filter
    if (course && course !== 'all') {
      query.course = course;
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    console.error('Fetch leads error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch leads: ' + error.message });
  }
};

/**
 * @desc    Get a single lead by ID
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    return res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Fetch lead by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch lead: ' + error.message });
  }
};

/**
 * @desc    Create a new student lead + auto trigger AI scoring & Welcome WhatsApp
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res) => {
  const { name, email, phone, country, course, notes, status, nextFollowUp } = req.body;

  try {
    const lead = await Lead.create({
      name,
      email,
      phone,
      country,
      course,
      notes: notes || '',
      status: status || 'new',
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default tomorrow
    });

    console.log(`[CRM] Lead created: ${lead.name}. Launching AI + WhatsApp welcome workflows...`);

    // 1. Auto Trigger AI Scoring
    let aiAssessment = null;
    try {
      aiAssessment = await analyzeLead(lead);
      lead.aiScore = aiAssessment.score;
      lead.aiAnalysis = {
        ...aiAssessment,
        analyzedAt: new Date()
      };
      await lead.save();
    } catch (aiErr) {
      console.error(`AI background scoring failed for ${lead.name}:`, aiErr.message);
    }

    // 2. Auto Trigger WhatsApp Welcome message
    try {
      const welcomeMsg = `Hi *${lead.name}*, warm welcome from our admissions team! 🌟 We have received your application query for our *${lead.course}* program. One of our education consultants will call you shortly. Let us know if you have any questions!`;
      await sendWhatsAppMessage(lead, welcomeMsg, 'welcome');
    } catch (waErr) {
      console.error(`WhatsApp welcome message failed for ${lead.name}:`, waErr.message);
    }

    return res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Create lead error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to create lead: ' + error.message });
  }
};

/**
 * @desc    Update a student lead details
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const originalCourse = lead.course;
    const originalNotes = lead.notes;

    // Update fields
    const allowedFields = ['name', 'email', 'phone', 'country', 'course', 'notes', 'status', 'nextFollowUp'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    await lead.save();

    // If course or notes changed, optionally trigger re-analysis
    if (lead.course !== originalCourse || lead.notes !== originalNotes) {
      console.log(`[CRM] Significant details modified for ${lead.name}. Recalculating AI score...`);
      try {
        const aiAssessment = await analyzeLead(lead);
        lead.aiScore = aiAssessment.score;
        lead.aiAnalysis = {
          ...aiAssessment,
          analyzedAt: new Date()
        };
        await lead.save();
      } catch (aiErr) {
        console.error('AI background re-analysis failed:', aiErr.message);
      }
    }

    return res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Update lead error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update lead: ' + error.message });
  }
};

/**
 * @desc    Delete a student lead
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Delete associated WhatsApp logs
    await WhatsAppLog.deleteMany({ leadId: lead._id });
    
    // Delete lead
    await Lead.findByIdAndDelete(lead._id);

    return res.json({ success: true, message: 'Lead and associated logs deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete lead: ' + error.message });
  }
};

/**
 * @desc    Manually run AI Analysis on a lead
 * @route   POST /api/leads/:id/analyze
 * @access  Private
 */
const triggerAIAnalysis = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    console.log(`[CRM] Manual AI scoring triggered for ${lead.name}`);
    const aiAssessment = await analyzeLead(lead);

    lead.aiScore = aiAssessment.score;
    lead.aiAnalysis = {
      ...aiAssessment,
      analyzedAt: new Date()
    };
    await lead.save();

    return res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Manual AI scoring failed:', error.message);
    return res.status(500).json({ success: false, message: 'AI Assessment failed: ' + error.message });
  }
};

/**
 * @desc    Manually send custom WhatsApp message to a lead
 * @route   POST /api/leads/:id/whatsapp
 * @access  Private
 */
const triggerWhatsAppMessage = async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required' });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    console.log(`[CRM] Manual WhatsApp message triggered for ${lead.name}`);
    const log = await sendWhatsAppMessage(lead, message, 'custom');

    return res.json({ success: true, data: log });
  } catch (error) {
    console.error('Manual WhatsApp sending failed:', error.message);
    return res.status(500).json({ success: false, message: 'WhatsApp trigger failed: ' + error.message });
  }
};

/**
 * @desc    Import student leads from uploaded CSV file
 * @route   POST /api/leads/import
 * @access  Private
 */
const importCSVLeads = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
  }

  const results = [];
  const filePath = req.file.path;
  let importedCount = 0;
  let skippedCount = 0;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      // Basic normalizations
      const name = data.name || data.Name;
      const email = data.email || data.Email;
      const phone = data.phone || data.Phone;
      const country = data.country || data.Country;
      const course = data.course || data.Course;
      const notes = data.notes || data.Notes || '';
      const status = (data.status || data.Status || 'new').toLowerCase();

      if (name && email && phone && country && course) {
        results.push({ name, email, phone, country, course, notes, status });
      } else {
        skippedCount++;
      }
    })
    .on('end', async () => {
      try {
        for (const record of results) {
          // Check for duplication
          const exists = await Lead.findOne({ email: record.email });
          if (!exists) {
            const lead = await Lead.create({
              ...record,
              nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default follow up tomorrow
            });

            // Trigger background AI Scorer
            try {
              const aiAssessment = await analyzeLead(lead);
              lead.aiScore = aiAssessment.score;
              lead.aiAnalysis = {
                ...aiAssessment,
                analyzedAt: new Date()
              };
              await lead.save();
            } catch (err) {
              console.error('AI bulk analysis skip:', err.message);
            }

            importedCount++;
          } else {
            skippedCount++;
          }
        }

        // Remove temp uploaded file safely
        fs.unlinkSync(filePath);
        return res.json({
          success: true,
          message: `CSV import completed successfully. Imported: ${importedCount}, Skipped/Duplicates: ${skippedCount}`
        });
      } catch (dbErr) {
        console.error('CSV db writing error:', dbErr.message);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ success: false, message: 'Failed to write CSV records to database: ' + dbErr.message });
      }
    })
    .on('error', (err) => {
      console.error('CSV stream reading failure:', err.message);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(500).json({ success: false, message: 'CSV parse error: ' + err.message });
    });
};

/**
 * @desc    Export student leads to CSV format
 * @route   GET /api/leads/export
 * @access  Private
 */
const exportCSVLeads = async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 });

    let csvContent = 'Name,Email,Phone,Country,Course,Notes,Status,AI Score,Risk Level,Created At\n';
    
    leads.forEach(l => {
      const notesClean = (l.notes || '').replace(/"/g, '""');
      const row = [
        `"${l.name}"`,
        `"${l.email}"`,
        `"${l.phone}"`,
        `"${l.country}"`,
        `"${l.course}"`,
        `"${notesClean}"`,
        `"${l.status}"`,
        l.aiScore !== null ? l.aiScore : 'N/A',
        `"${l.aiAnalysis?.riskLevel || 'unknown'}"`,
        `"${l.createdAt.toISOString()}"`
      ].join(',');
      csvContent += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=student_leads_${new Date().toISOString().split('T')[0]}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export failed:', error.message);
    return res.status(500).json({ success: false, message: 'CSV export failed: ' + error.message });
  }
};

/**
 * @desc    Fetch CRM analytics KPI stats
 * @route   GET /api/leads/stats/dashboard
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const contactedLeads = await Lead.countDocuments({ status: 'contacted' });
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const lostLeads = await Lead.countDocuments({ status: 'lost' });

    // Active pending followups count (not converted/lost, and nextFollowUp is past due or today)
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const pendingFollowups = await Lead.countDocuments({
      nextFollowUp: { $lte: todayEnd },
      status: { $in: ['new', 'contacted'] }
    });

    // Country distribution
    const countryAggregation = await Lead.aggregate([
      { $group: { _id: '$country', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // Average AI Score
    const scoreAgg = await Lead.aggregate([
      { $match: { aiScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$aiScore' } } }
    ]);
    const averageScore = scoreAgg.length > 0 ? parseFloat(scoreAgg[0].avgScore.toFixed(1)) : 70;

    // Course interest distributions
    const courseStats = await Lead.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    // Conversion rate timeline (last 7 days aggregate - simulated or based on actual data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const timelineData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);

      const added = await Lead.countDocuments({ createdAt: { $gte: dStart, $lte: dEnd } });
      const converted = await Lead.countDocuments({ 
        status: 'converted', 
        updatedAt: { $gte: dStart, $lte: dEnd } 
      });

      timelineData.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        'New Leads': added,
        'Converted Students': converted
      });
    }

    // Identify top "hot leads" (high AI score, low risk) and high risk (high score but high dropout/lost risk notes)
    const hotLeads = await Lead.find({
      aiScore: { $gte: 75 },
      status: { $in: ['new', 'contacted'] }
    }).sort({ aiScore: -1 }).limit(5);

    const highRiskLeads = await Lead.find({
      'aiAnalysis.riskLevel': 'high',
      status: { $in: ['new', 'contacted'] }
    }).sort({ aiScore: -1 }).limit(5);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalLeads,
          newLeads,
          contactedLeads,
          convertedLeads,
          lostLeads,
          pendingFollowups,
          averageScore,
          conversionRate: totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0
        },
        countryBreakdown: countryAggregation,
        courseDistribution: courseStats,
        growthTimeline: timelineData,
        hotLeads,
        highRiskLeads
      }
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error.message);
    return res.status(500).json({ success: false, message: 'Stats calculation failed: ' + error.message });
  }
};

/**
 * @desc    Fetch sent WhatsApp logs (for simulator view)
 * @route   GET /api/leads/stats/whatsapp-logs
 * @access  Private
 */
const getWhatsAppLogs = async (req, res) => {
  try {
    const logs = await WhatsAppLog.find({}).sort({ sentTime: -1 }).limit(40);
    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('Fetch WhatsApp logs error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch WhatsApp logs: ' + error.message });
  }
};

/**
 * @desc    Trigger manual Cron Follow Up Check immediately
 * @route   POST /api/automation/trigger-followups
 * @access  Private
 */
const triggerCronFollowUp = async (req, res) => {
  try {
    const results = await runDailyFollowUpCheck();
    return res.json({ success: true, message: 'Automated follow-up reminders executed successfully.', data: results });
  } catch (error) {
    console.error('Manual cron follow-up check fail:', error.message);
    return res.status(500).json({ success: false, message: 'Follow-up job failed: ' + error.message });
  }
};

/**
 * @desc    Trigger manual Cron Executive Email Report immediately
 * @route   POST /api/automation/trigger-daily-report
 * @access  Private
 */
const triggerCronDailyReport = async (req, res) => {
  try {
    const results = await runDailyExecutiveReport();
    return res.json({ success: true, message: 'Daily executive summary report compiled and sent successfully.', data: results });
  } catch (error) {
    console.error('Manual cron report trigger fail:', error.message);
    return res.status(500).json({ success: false, message: 'Report job failed: ' + error.message });
  }
};

module.exports = {
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
};
