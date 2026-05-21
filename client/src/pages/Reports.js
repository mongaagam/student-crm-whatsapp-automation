import React, { useState, useEffect } from 'react';
import { leads, stats, automation } from '../services/api';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cron execution results
  const [followupResults, setFollowupResults] = useState(null);
  const [reportResults, setReportResults] = useState(null);
  const [executingFollowups, setExecutingFollowups] = useState(false);
  const [executingReport, setExecutingReport] = useState(false);

  // File upload state
  const [csvFile, setCsvFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await stats.getWhatsAppLogs();
      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Failed to load transmission logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // CSV exporting
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
      console.error('Failed to trigger CSV export download:', err.message);
    }
  };

  // CSV importing
  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Uploading & running AI background scoring... Please wait...');
    try {
      const res = await leads.importCSV(file);
      if (res.success) {
        setImportStatus(`Success! ${res.message}`);
        fetchLogs();
        setTimeout(() => setImportStatus(''), 5000);
      }
    } catch (err) {
      console.error('Spreadsheet bulk import failure:', err.message);
      setImportStatus('CSV Import failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Trigger manual followups
  const handleRunFollowups = async () => {
    setExecutingFollowups(true);
    setFollowupResults(null);
    try {
      const res = await automation.triggerFollowups();
      if (res.success) {
        setFollowupResults(res.data);
        fetchLogs();
      }
    } catch (err) {
      console.error('Automation execution failed:', err.message);
      alert('Follow-up job failed: ' + err.message);
    } finally {
      setExecutingFollowups(false);
    }
  };

  // Trigger manual emails
  const handleRunDailyReport = async () => {
    setExecutingReport(true);
    setReportResults(null);
    try {
      const res = await automation.triggerDailyReport();
      if (res.success) {
        setReportResults(res.data);
      }
    } catch (err) {
      console.error('Email report generation failed:', err.message);
      alert('Report job failed: ' + err.message);
    } finally {
      setExecutingReport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Reports & Automation Control</h1>
        <p className="text-gray-400 text-sm mt-1">Simulate daily tasks, generate spreadsheets, and audit transmission histories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
        
        {/* Left Columns: Import/Export & Manual Cron Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Spreadsheet and Data Import/Export */}
          <div className="glass-panel border border-white/5 p-6 rounded-3xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              📁 Database Management
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Manage student lead spreadsheets. You can back up your entire admissions pipeline database as a standard CSV spreadsheet file, or import new inbound lead sheets in bulk.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CSV Export Card */}
              <div className="p-4 bg-white/2 rounded-2xl border border-white/5 text-center">
                <span className="text-2xl block mb-2">📥</span>
                <span className="text-xs font-bold text-white block">Download Leads Sheet</span>
                <p className="text-[10px] text-gray-500 mt-1 mb-4">Export all student details, courses, statuses, and AI scores.</p>
                <button
                  onClick={handleCSVDownload}
                  className="w-full bg-[#101d25] border border-white/8 hover:bg-white/5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                >
                  Generate CSV Export
                </button>
              </div>

              {/* CSV Import Card */}
              <div className="p-4 bg-white/2 rounded-2xl border border-white/5 text-center relative">
                <span className="text-2xl block mb-2">📤</span>
                <span className="text-xs font-bold text-white block">Upload Leads Sheet</span>
                <p className="text-[10px] text-gray-500 mt-1 mb-4">Upload a bulk list of student prospects to auto score them.</p>
                
                <label className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer">
                  Import CSV File
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                </label>
                {importStatus && (
                  <span className="absolute bottom-1 left-4 right-4 text-[9px] text-indigo-400 font-bold block truncate animate-pulse">
                    {importStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Automation Cron Trigger console */}
          <div className="glass-panel border border-white/5 p-6 rounded-3xl space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              ⚡ Automation Schedulers (Cron Jobs)
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              These cron tasks are scheduled in the backend to run automatically every day. However, for active testing, you can click the buttons below to trigger them manually right now!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Follow-up triggers */}
              <div className="p-4 bg-white/2 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Daily Follow-Up Checker</span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">09:00 AM</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                    Scans leads scheduled for follow-ups today, updates database states, and automatically queues WhatsApp reminders.
                  </p>
                </div>
                <button
                  onClick={handleRunFollowups}
                  disabled={executingFollowups}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                >
                  {executingFollowups ? 'Executing Reminders...' : 'Run Follow-up Job'}
                </button>
              </div>

              {/* Email summary report triggers */}
              <div className="p-4 bg-white/2 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Executive Daily Summary</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">11:59 PM</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">
                    Compiles active leads, regional demographic counts, and conversion percentages. Emails a formatted HTML report to the admin.
                  </p>
                </div>
                <button
                  onClick={handleRunDailyReport}
                  disabled={executingReport}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  {executingReport ? 'Compiling Summary...' : 'Run Email Summary'}
                </button>
              </div>

            </div>

            {/* Execution logs output grids */}
            {followupResults && (
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2 animate-scaleIn">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">Follow-up Job Result Feed</span>
                {followupResults.length === 0 ? (
                  <p className="text-[10px] text-gray-400">Execution successful. No follow-ups were scheduled or due today.</p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {followupResults.map((res, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] border-b border-indigo-500/5 pb-1">
                        <span className="text-white font-bold">{res.leadName} ({res.phone})</span>
                        <span className={`px-1.5 rounded uppercase font-semibold text-[8px] border ${
                          res.status === 'sent' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {res.status === 'sent' ? (res.isSimulated ? 'Simulated Out' : 'Transmitted') : 'Error'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {reportResults && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2 animate-scaleIn">
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">Email Summary Job Result Feed</span>
                <div className="text-[10px] text-gray-300 space-y-1 font-medium">
                  <div className="flex justify-between"><span>Recipient Admin Box:</span><span className="text-white font-bold">{reportResults.emailSentTo}</span></div>
                  <div className="flex justify-between"><span>Enrollment Conversion Rate:</span><span className="text-emerald-400 font-bold">{reportResults.conversionRate}%</span></div>
                  <div className="flex justify-between"><span>Converted / Total leads count:</span><span className="text-white">{reportResults.convertedLeads} / {reportResults.totalLeads}</span></div>
                  <div className="flex justify-between"><span>Delivery Type:</span><span className="text-amber-400 font-bold">{reportResults.simulated ? 'SIMULATOR logged to server/email_logs.txt' : 'SMTP SMTP Transmitted'}</span></div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Mini Transmissions Auditor Log */}
        <div className="glass-panel border border-white/5 p-6 rounded-3xl h-[560px] flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audit logs Feed</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">outbound notifications transmission logs</p>
            </div>
            <button onClick={fetchLogs} className="p-1 hover:bg-white/5 rounded text-gray-400">
              🔄
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 gap-2.5 flex flex-col">
            {loading ? (
              <div className="my-auto text-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Syncing Auditor logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="my-auto text-center px-4 text-gray-600 text-[10px]">
                No transmission records logged in system auditor database.
              </div>
            ) : (
              logs.map((log) => {
                const formattedTime = new Date(log.sentTime || log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={log._id || Math.random()} className="p-3 bg-white/2 rounded-xl border border-white/5 hover:border-white/10 transition-colors space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-bold">
                      <span className="text-gray-300 select-all">{log.leadName}</span>
                      <span className="text-gray-500 select-none">{formattedTime}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal line-clamp-2 select-text">{log.message}</p>
                    <div className="flex items-center justify-between text-[8px] pt-1">
                      <span className={`px-1 rounded uppercase font-semibold border ${
                        log.type === 'welcome' 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {log.type} text
                      </span>
                      <span className={`px-1 rounded uppercase font-semibold border ${
                        log.status === 'failed'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : log.isSimulated
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {log.status === 'failed' ? 'Error' : log.isSimulated ? 'Simulated' : 'Twilio Sent'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
