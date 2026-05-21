import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';

const WhatsAppSimulator = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const chatEndRef = useRef(null);

  const fetchLogs = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await API.get('/leads/stats/whatsapp-logs');

      if (response.data?.success && response.data?.data) {
        // Reverse array to put oldest at top and newest at bottom for linear chat flow
        setLogs([...response.data.data].reverse());
      }
    } catch (err) {
      console.error('Failed to poll WhatsApp logs:', err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll database logs for real-time reactive feel
  useEffect(() => {
    fetchLogs(true);

    let intervalId;
    if (pollingActive) {
      intervalId = setInterval(() => {
        fetchLogs(false);
      }, 7000); // Poll every 7 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive]);

  // Scroll chat list to bottom when logs load
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full max-w-[360px] mx-auto glass-panel border border-white/10 rounded-[40px] p-3 shadow-2xl relative bg-[#090C16] overflow-hidden select-none">
      {/* Phone Notch/Speaker Header */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-[#05070F] rounded-b-xl z-20 flex items-center justify-center">
        <span className="w-8 h-1 rounded-full bg-gray-700 block"></span>
      </div>

      {/* Screen Container */}
      <div className="rounded-[32px] overflow-hidden border border-white/5 bg-[#075E54] w-full h-[520px] flex flex-col relative">
        
        {/* WhatsApp App Topbar */}
        <div className="bg-[#075E54] text-white pt-6 pb-2.5 px-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-2.5">
            {/* Logo Badge */}
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 font-bold text-sm">
              💬
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide">WhatsApp Queue</span>
              <span className="text-[10px] text-emerald-200/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping"></span>
                Automation Monitor
              </span>
            </div>
          </div>
          
          {/* Sync Trigger button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(true)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/95"
              title="Refresh logs"
              disabled={loading}
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18"></path>
              </svg>
            </button>
            <button
              onClick={() => setPollingActive(!pollingActive)}
              className={`p-1 rounded-full transition-colors ${pollingActive ? 'text-emerald-300' : 'text-gray-400'}`}
              title={pollingActive ? 'Pause real-time sync' : 'Resume real-time sync'}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pollingActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${pollingActive ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
              </span>
            </button>
          </div>
        </div>

        {/* WhatsApp Dynamic Wallpaper Background */}
        <div 
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-[#0b141a] relative"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 0)",
            backgroundSize: "16px 16px"
          }}
        >
          {logs.length === 0 ? (
            <div className="my-auto text-center px-4 flex flex-col items-center justify-center text-gray-500">
              <span className="text-3xl mb-2 opacity-50">⚡</span>
              <p className="text-xs">No notifications sent yet.</p>
              <p className="text-[10px] mt-1 text-gray-600">Add a student lead or trigger follow-ups to populate the queue!</p>
            </div>
          ) : (
            <>
              {/* Simulator info tag */}
              <div className="mx-auto my-1 bg-[#182229] border border-white/5 text-[10px] text-gray-400 px-3 py-1 rounded-md text-center max-w-[85%]">
                🔒 Messages are logged dynamically here for active demo verification.
              </div>

              {logs.map((log) => {
                const isFailed = log.status === 'failed';
                const formattedTime = new Date(log.sentTime || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Color mapping for message type tags
                let tagColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                let tagLabel = 'Custom Chat';
                if (log.type === 'welcome') {
                  tagColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
                  tagLabel = 'Welcome Ping';
                } else if (log.type === 'reminder') {
                  tagColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                  tagLabel = 'Cron Reminder';
                }

                return (
                  <div key={log._id || Math.random()} className="w-full flex flex-col items-end">
                    {/* Chat Bubble card */}
                    <div className="max-w-[90%] bg-[#005c4b] border border-emerald-900/40 text-white rounded-2xl rounded-tr-none px-3 py-2 shadow-lg relative flex flex-col">
                      
                      {/* Recipient lead tag */}
                      <span className="text-[9px] font-bold text-emerald-300/80 mb-0.5 select-all">
                        To: {log.leadName} ({log.leadPhone})
                      </span>
                      
                      {/* Body message content */}
                      <p className="text-[11px] leading-relaxed text-gray-100 whitespace-pre-wrap select-text">
                        {log.message}
                      </p>
                      
                      {/* Footer: status labels and blue double ticks */}
                      <div className="flex items-center justify-between mt-1.5 gap-3 border-t border-emerald-800/40 pt-1 select-none">
                        
                        {/* Service mode indicators */}
                        <span className={`text-[8px] font-semibold border px-1 rounded uppercase tracking-wide ${tagColor}`}>
                          {tagLabel}
                        </span>

                        <div className="flex items-center gap-1 text-[8px] text-emerald-200/70 ml-auto">
                          <span>{formattedTime}</span>
                          
                          {/* Sending success blue checks */}
                          {isFailed ? (
                            <span className="text-rose-400 font-bold">✖</span>
                          ) : log.isSimulated ? (
                            <span className="text-amber-400 font-semibold" title="Simulated Fallback">Sim</span>
                          ) : (
                            <span className="text-emerald-300 font-bold" title="Twilio Sent">✓✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Mock input bar */}
        <div className="bg-[#101d25] p-2 flex items-center gap-2 border-t border-white/5">
          <div className="flex-1 bg-[#202c33] rounded-full px-3.5 py-1.5 text-[10px] text-gray-500 flex items-center justify-between border border-white/5 select-none">
            <span>Automation listening...</span>
            <span className="text-emerald-500 font-bold">⚡</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs select-none shadow-md shadow-emerald-500/10">
            🎙️
          </div>
        </div>

      </div>
    </div>
  );
};

export default WhatsAppSimulator;
