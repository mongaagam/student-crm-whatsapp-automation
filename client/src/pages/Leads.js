import React, { useState, useEffect } from 'react';
import { leads } from '../services/api';

const Leads = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [country, setCountry] = useState('all');
  const [course, setCourse] = useState('all');

  // Modal / Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  
  // Lead Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadCountry, setLeadCountry] = useState('');
  const [leadCourse, setLeadCourse] = useState('');
  const [notes, setNotes] = useState('');
  const [leadStatus, setLeadStatus] = useState('new');
  const [nextFollowUp, setNextFollowUp] = useState('');

  // AI Analysis Viewer modal state
  const [aiLead, setAiLead] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // WhatsApp Sender modal state
  const [waLead, setWaLead] = useState(null);
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);

  // CSV Drag and drop / file upload state
  const [csvFile, setCsvFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leads.getAll({ search, status, country, course });
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to query leads list:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [status, country, course]); // Fetch automatically on dropdown toggles

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleOpenAddForm = () => {
    setEditingLead(null);
    setName('');
    setEmail('');
    setPhone('');
    setLeadCountry('');
    setLeadCourse('');
    setNotes('');
    setLeadStatus('new');
    
    // Set follow up to tomorrow as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextFollowUp(tomorrow.toISOString().split('T')[0]);
    
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (lead) => {
    setEditingLead(lead);
    setName(lead.name);
    setEmail(lead.email);
    setPhone(lead.phone);
    setLeadCountry(lead.country);
    setLeadCourse(lead.course);
    setNotes(lead.notes || '');
    setLeadStatus(lead.status);
    
    if (lead.nextFollowUp) {
      setNextFollowUp(new Date(lead.nextFollowUp).toISOString().split('T')[0]);
    } else {
      setNextFollowUp('');
    }
    
    setIsFormOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      email,
      phone,
      country: leadCountry,
      course: leadCourse,
      notes,
      status: leadStatus,
      nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null
    };

    try {
      let res;
      if (editingLead) {
        res = await leads.update(editingLead._id, payload);
      } else {
        res = await leads.create(payload);
      }

      if (res.success) {
        setIsFormOpen(false);
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to save lead database entry:', err.message);
      alert('Error saving lead: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead? All associated logs will be deleted.')) return;
    try {
      const res = await leads.delete(id);
      if (res.success) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to delete student record:', err.message);
    }
  };

  // Run or View AI report popup
  const handleTriggerAI = async (lead) => {
    setAiLead(lead);
    setAiLoading(true);
    try {
      const res = await leads.analyzeAI(lead._id);
      if (res.success && res.data) {
        setAiLead(res.data);
        // Refresh local items
        setData(prev => prev.map(item => item._id === res.data._id ? res.data : item));
      }
    } catch (err) {
      console.error('Manual AI scoring failed:', err.message);
      alert('AI scoring failed: ' + (err.response?.data?.message || err.message));
      setAiLead(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Open quick whatsapp message modal
  const handleOpenWhatsApp = (lead) => {
    setWaLead(lead);
    setWaMessage(`Hi ${lead.name}, regarding your target course *${lead.course}*, we have some open enrollment seats. Are you available for a 5-minute call today?`);
  };

  const handleSendWhatsApp = async () => {
    if (!waMessage.trim()) return;
    setWaSending(true);
    try {
      const res = await leads.sendWhatsApp(waLead._id, waMessage);
      if (res.success) {
        setWaLead(null);
        setWaMessage('');
        fetchLeads(); // Sync latest logs/badges
      }
    } catch (err) {
      console.error('Failed to send WhatsApp message:', err.message);
      alert('Failed to send message: ' + (err.response?.data?.message || err.message));
    } finally {
      setWaSending(false);
    }
  };

  // CSV Drag/Drop Import triggers
  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportStatus('Uploading & parsing CSV... Please wait while AI analyses are running...');
    try {
      const res = await leads.importCSV(file);
      if (res.success) {
        setImportStatus(`Success! ${res.message}`);
        fetchLeads();
        setTimeout(() => setImportStatus(''), 5000);
      }
    } catch (err) {
      console.error('Bulk CSV file import failure:', err.message);
      setImportStatus('CSV Import failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Download entire database as spreadsheet CSV
  const handleCSVDownload = async () => {
    try {
      const blob = await leads.downloadCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_leads_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('CSV Export download trigger failure:', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Lead Database</h1>
          <p className="text-gray-400 text-sm mt-1">Manage admissions queries, trigger automatic scores, and send follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCSVDownload}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-500/10"
          >
            ➕ Add Student Lead
          </button>
        </div>
      </div>

      {/* CSV Bulk Importer bar */}
      <div className="glass-panel border border-white/5 p-4 rounded-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🗂️</span>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Bulk Lead Spreadsheet Import</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Upload a CSV file containing columns: name, email, phone, country, course, notes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {importStatus && (
              <span className="text-[10px] text-indigo-400 font-semibold max-w-[280px] truncate animate-pulse bg-indigo-500/5 border border-indigo-500/10 px-2 py-1 rounded">
                {importStatus}
              </span>
            )}
            <label className="px-4 py-2 bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 rounded-xl text-[11px] font-bold text-indigo-400 cursor-pointer transition-all select-none">
              📂 Select CSV File
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Grid */}
      <div className="glass-panel border border-white/5 p-4 rounded-2xl mb-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          
          {/* Query search Input */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-9 pr-4 py-2 text-xs glass-input"
            />
            <div className="absolute left-3.5 top-2.5 text-gray-500 select-none">🔍</div>
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-2 px-3 text-xs glass-input"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Inbounds</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted (Enrolled)</option>
            <option value="lost">Lost</option>
          </select>

          {/* Country Filter Selector */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="py-2 px-3 text-xs glass-input"
          >
            <option value="all">All Countries</option>
            <option value="India">India</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
          </select>

          {/* Search Trigger Button */}
          <button
            type="submit"
            className="w-full bg-[#101d25] border border-white/8 hover:bg-white/5 text-xs font-semibold py-2 rounded-xl text-white transition-all"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Leads Table Card */}
      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span className="text-gray-500 text-xs font-semibold uppercase">Querying leads directory...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <span className="text-3xl block mb-2 opacity-50">📂</span>
              <p className="text-xs">No student leads matching your criteria.</p>
              <button onClick={handleOpenAddForm} className="mt-3 text-xs text-indigo-400 font-semibold hover:underline">
                Register a new lead manually
              </button>
            </div>
          ) : (
            <table className="min-w-full crm-table select-text">
              <thead>
                <tr className="bg-white/2 text-left">
                  <th className="py-3.5 px-4 font-semibold">Student Name</th>
                  <th className="py-3.5 px-4 font-semibold">Program / Course</th>
                  <th className="py-3.5 px-4 font-semibold">Demographic</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-center">AI Rating</th>
                  <th className="py-3.5 px-4 font-semibold text-center">WhatsApp Queue</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/2">
                {data.map((lead) => {
                  let statusBadge = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                  if (lead.status === 'contacted') statusBadge = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                  if (lead.status === 'converted') statusBadge = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                  if (lead.status === 'lost') statusBadge = 'bg-rose-500/10 border-rose-500/20 text-rose-400';

                  let waBadge = 'bg-gray-500/10 text-gray-400 border-white/5';
                  let waLabel = 'Inactive';
                  if (lead.whatsappStatus === 'welcome_sent') {
                    waBadge = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                    waLabel = 'Welcome Sent';
                  } else if (lead.whatsappStatus === 'followup_scheduled') {
                    waBadge = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                    waLabel = 'Follow-up Active';
                  } else if (lead.whatsappStatus === 'followup_sent') {
                    waBadge = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                    waLabel = 'Follow-up Sent';
                  } else if (lead.whatsappStatus === 'failed') {
                    waBadge = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                    waLabel = 'Delivery Error';
                  }

                  return (
                    <tr key={lead._id} className="text-xs">
                      {/* Name & Contact */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{lead.name}</span>
                          <span className="text-[10px] text-gray-500 font-medium select-all mt-0.5">{lead.email} • {lead.phone}</span>
                        </div>
                      </td>
                      
                      {/* Course */}
                      <td className="py-4 px-4 font-semibold text-gray-200">
                        {lead.course}
                      </td>

                      {/* Demographic */}
                      <td className="py-4 px-4 text-gray-400">
                        {lead.country}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusBadge}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* AI Rating */}
                      <td className="py-4 px-4 text-center">
                        {lead.aiScore !== null ? (
                          <button
                            onClick={() => handleTriggerAI(lead)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              lead.aiAnalysis?.riskLevel === 'high'
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                                : lead.aiScore >= 75
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                            } transition-colors`}
                            title="Click to view AI assessment details"
                          >
                            🤖 {lead.aiScore}%
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTriggerAI(lead)}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all text-[9px] font-semibold"
                          >
                            💡 Analyze
                          </button>
                        )}
                      </td>

                      {/* WhatsApp Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-semibold ${waBadge}`}>
                          {waLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenWhatsApp(lead)}
                            className="p-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded"
                            title="Quick custom WhatsApp message"
                          >
                            💬
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(lead)}
                            className="p-1 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded"
                            title="Edit Lead details"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="p-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded"
                            title="Delete Lead"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD/EDIT LEAD FORM SLIDE-OUT */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scaleIn bg-[#0d0f17]">
            <div className="flex items-center justify-between bg-white/2 px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingLead ? `✏️ Edit Student: ${editingLead.name}` : '➕ Add New Student Lead'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-white text-lg">✖</button>
            </div>
            
            <form onSubmit={handleSaveLead} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Student Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 text-xs glass-input"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@student.com"
                    className="w-full px-3 py-2 text-xs glass-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Phone Number (include code)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919988776655"
                    className="w-full px-3 py-2 text-xs glass-input"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Country</label>
                  <input
                    type="text"
                    value={leadCountry}
                    onChange={(e) => setLeadCountry(e.target.value)}
                    placeholder="India"
                    className="w-full px-3 py-2 text-xs glass-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Target Course / Program</label>
                  <input
                    type="text"
                    value={leadCourse}
                    onChange={(e) => setLeadCourse(e.target.value)}
                    placeholder="M.S. Computer Science"
                    className="w-full px-3 py-2 text-xs glass-input"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Lead status</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs glass-input"
                  >
                    <option value="new">New Inbound</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted (Enrolled)</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Next Follow-Up Date</label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full px-3 py-2 text-xs glass-input"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">Background Query Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Student expresses strong interest but requires detailed visa scholarship options. Immediate callback requested..."
                  rows="3"
                  className="w-full px-3 py-2 text-xs glass-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-400 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-xl text-xs font-semibold shadow-lg hover:from-indigo-600 transition-all text-center"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AI ANALYSIS VIEWER */}
      {/* ========================================================================= */}
      {aiLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-scaleIn bg-[#0d0f17]">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/2 px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Lead Analysis Profile</h2>
                  <p className="text-[10px] text-gray-500 font-medium">Student: {aiLead.name} • {aiLead.course}</p>
                </div>
              </div>
              <button onClick={() => setAiLead(null)} className="text-gray-400 hover:text-white text-lg">✖</button>
            </div>

            {aiLoading ? (
              <div className="text-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <span className="text-gray-400 text-xs font-bold tracking-wider uppercase animate-pulse">Running Deep Learning Scorer...</span>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* Score & Risk level Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Gauge Card */}
                  <div className="glass-panel border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Admissions Probability</span>
                    <span className="text-4xl font-black mt-2 text-gradient-purple">{aiLead.aiScore}%</span>
                    <span className="text-[9px] text-gray-500 mt-1">Out of 100 maximum score</span>
                  </div>

                  {/* Risk Card */}
                  <div className="glass-panel border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Student Dropout Risk</span>
                    <span className={`text-2xl font-black mt-2 uppercase ${
                      aiLead.aiAnalysis?.riskLevel === 'high' 
                        ? 'text-rose-400' 
                        : aiLead.aiAnalysis?.riskLevel === 'medium' 
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                    }`}>
                      {aiLead.aiAnalysis?.riskLevel || 'unknown'}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-1">Based on notes and indicators</span>
                  </div>
                </div>

                {/* Analysis Breakdown reasons */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Evaluation Breakdown</h3>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs text-gray-300 leading-relaxed">
                    {(aiLead.aiAnalysis?.reasons || []).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {/* Follow-up suggestions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-emerald-500 pl-2">AI-Generated Follow-up Strategy</h3>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs text-gray-300 leading-relaxed">
                    {(aiLead.aiAnalysis?.followUpSuggestions || []).map((suggestion, idx) => (
                      <li key={idx} className="text-emerald-300/90">{suggestion}</li>
                    ))}
                  </ul>
                </div>

                {/* Footer close */}
                <div className="pt-4 border-t border-white/5 text-center text-[10px] text-gray-500 select-none">
                  Analyzed at: {aiLead.aiAnalysis?.analyzedAt ? new Date(aiLead.aiAnalysis.analyzedAt).toLocaleString() : new Date().toLocaleString()}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK WHATSAPP SEND BOX */}
      {/* ========================================================================= */}
      {waLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-scaleIn bg-[#0d0f17]">
            <div className="flex items-center justify-between bg-white/2 px-5 py-4 border-b border-white/5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                💬 Direct WhatsApp Chat
              </h2>
              <button onClick={() => setWaLead(null)} className="text-gray-400 hover:text-white text-lg">✖</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">Recipient student</span>
                <span className="text-xs font-bold text-white">{waLead.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">Phone: {waLead.phone}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider pl-1">WhatsApp message body</label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder="Enter message text..."
                  rows="4"
                  className="w-full px-3 py-2 text-xs glass-input resize-none"
                  required
                />
                <span className="text-[9px] text-gray-500 pl-1 mt-0.5 block">Markdown syntax like *bold text* is supported on WhatsApp.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setWaLead(null)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-400 text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={waSending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg transition-all text-center flex items-center gap-1.5 disabled:opacity-50"
                >
                  {waSending ? 'Transmitting...' : '🚀 Transmit WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leads;
