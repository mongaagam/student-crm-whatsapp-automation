const axios = require('axios');

/**
 * Analyzes a student lead using Gemini API or OpenAI API, and falls back to a smart algorithm if no keys are set.
 * @param {Object} lead - Lead object
 * @returns {Promise<Object>} - Analysis results: { score, riskLevel, reasons, followUpSuggestions }
 */
const analyzeLead = async (lead) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const leadDataString = `
    Name: ${lead.name}
    Email: ${lead.email}
    Phone: ${lead.phone}
    Country: ${lead.country}
    Course: ${lead.course}
    Notes: ${lead.notes || 'None'}
    Status: ${lead.status}
  `;

  if (geminiKey) {
    try {
      console.log(`Running AI analysis using Gemini API for lead: ${lead.name}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const prompt = `
        You are an expert student admissions consultant and lead analyzer.
        Analyze this student lead and evaluate their conversion probability, dropout/lost risk, and logical next steps.
        
        Lead Data:
        ${leadDataString}
        
        Provide your assessment strictly in the following JSON format:
        {
          "score": <number from 0 to 100 representing conversion probability>,
          "riskLevel": "<low | medium | high>",
          "reasons": ["reason 1", "reason 2", ...],
          "followUpSuggestions": ["suggestion 1", "suggestion 2", ...]
        }
        
        Respond with ONLY the JSON object. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.
      `;

      const response = await axios.post(url, {
        contents: [{ parts: [{ text: prompt }] }]
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      let responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        // Strip markdown code fences if Gemini added them despite instructions
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(responseText);
        if (typeof parsed.score === 'number' && parsed.riskLevel) {
          return {
            score: Math.min(100, Math.max(0, parsed.score)),
            riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons : ['Data completed'],
            followUpSuggestions: Array.isArray(parsed.followUpSuggestions) ? parsed.followUpSuggestions : ['Follow up within 24 hours']
          };
        }
      }
    } catch (err) {
      console.error('Gemini AI Analysis failed, falling back to simulator:', err.message);
    }
  } else if (openaiKey) {
    try {
      console.log(`Running AI analysis using OpenAI API for lead: ${lead.name}`);
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: openaiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an admissions CRM analyst. Respond ONLY with a valid JSON object.'
          },
          {
            role: 'user',
            content: `Analyze this student lead and score their enrollment probability out of 100.
            
            Lead:
            ${leadDataString}
            
            Format:
            {
              "score": <number>,
              "riskLevel": "<low|medium|high>",
              "reasons": [<array of strings>],
              "followUpSuggestions": [<array of strings>]
            }`
          }
        ],
        response_format: { type: 'json_object' }
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      return {
        score: Math.min(100, Math.max(0, parsed.score || 70)),
        riskLevel: parsed.riskLevel || 'medium',
        reasons: parsed.reasons || ['Details submitted'],
        followUpSuggestions: parsed.followUpSuggestions || ['Contact student']
      };
    } catch (err) {
      console.error('OpenAI AI Analysis failed, falling back to simulator:', err.message);
    }
  }

  // Smart Simulator / Local Fallback Algorithm
  console.log(`Using Local AI Simulator Engine for lead: ${lead.name}`);
  
  let score = 50; // Base score
  const reasons = [];
  const followUpSuggestions = [];

  // Evaluate Name
  if (lead.name.length > 3) score += 5;
  else reasons.push('Name is unusually short, check for invalid entry');

  // Evaluate Phone
  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length >= 10) {
    score += 10;
    reasons.push('Valid phone number format detected');
  } else {
    score -= 15;
    reasons.push('Phone number seems incomplete or invalid');
  }

  // Evaluate Email domain
  if (lead.email.includes('@gmail.com') || lead.email.includes('@yahoo.com') || lead.email.includes('@outlook.com') || lead.email.includes('.edu')) {
    score += 10;
    reasons.push('Trustworthy email domain provider');
  } else {
    reasons.push('Generic or custom business domain email');
  }

  // Evaluate Notes
  const noteText = (lead.notes || '').toLowerCase();
  if (noteText.length > 20) {
    score += 15;
    reasons.push('Rich history and background notes provided');
    
    if (noteText.includes('budget') || noteText.includes('scholarship') || noteText.includes('fees') || noteText.includes('cost')) {
      reasons.push('Lead mentions financial or fee questions');
      followUpSuggestions.push('Send tuition fee structures and scholarship criteria options');
    }
    if (noteText.includes('visa') || noteText.includes('permit') || noteText.includes('embassy')) {
      reasons.push('Lead inquiry includes visa processes');
      followUpSuggestions.push('Schedule a session with a certified visa assistance officer');
    }
    if (noteText.includes('immediate') || noteText.includes('now') || noteText.includes('asap') || noteText.includes('urgent')) {
      score += 15;
      reasons.push('Student expresses highly urgent/immediate interest');
      followUpSuggestions.push('Call immediately to initiate admissions counseling');
    }
    if (noteText.includes('undecided') || noteText.includes('maybe') || noteText.includes('thinking') || noteText.includes('later')) {
      score -= 10;
      reasons.push('Student indicates indecisiveness regarding timelines');
      followUpSuggestions.push('Send a brochure containing course success outcomes and alumni reviews');
    }
  } else if (noteText.length > 0) {
    score += 5;
    reasons.push('Brief query notes submitted');
    followUpSuggestions.push('Initiate standard onboarding email chain');
  } else {
    score -= 10;
    reasons.push('No detailed query notes provided by student');
    followUpSuggestions.push('Call student to understand course goals and requirements');
  }

  // Status Modifiers
  if (lead.status === 'converted') {
    score = 100;
    reasons.push('Lead is marked as converted (enrolled student)');
    followUpSuggestions.push('Transition to academic onboarding and portal setup');
  } else if (lead.status === 'lost') {
    score = 15;
    reasons.push('Lead is marked as lost');
    followUpSuggestions.push('Move to passive quarterly re-engagement marketing campaign');
  } else if (lead.status === 'contacted') {
    score += 10;
    reasons.push('Successful initial communications established');
    if (followUpSuggestions.length === 0) {
      followUpSuggestions.push('Propose a personalized 1-on-1 counseling video call');
    }
  } else {
    if (followUpSuggestions.length === 0) {
      followUpSuggestions.push('Send WhatsApp welcome message and email brochure');
    }
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  // Determine Risk Level
  let riskLevel = 'medium';
  if (score >= 75) {
    riskLevel = 'low';
  } else if (score < 45) {
    riskLevel = 'high';
  }

  // Make sure we have reasons and suggestions
  if (reasons.length === 0) reasons.push('Basic lead details parsed');
  if (followUpSuggestions.length === 0) followUpSuggestions.push('Check in with student via call next week');

  return {
    score,
    riskLevel,
    reasons,
    followUpSuggestions
  };
};

module.exports = { analyzeLead };
