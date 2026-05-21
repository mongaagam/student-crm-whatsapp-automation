import React, { useState, useEffect } from 'react';
import { stats, automation } from '../services/api';
import WhatsAppSimulator from '../components/WhatsAppSimulator';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cronLoading, setCronLoading] = useState(false);
  const [cronSuccessMsg, setCronSuccessMsg] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const response = await stats.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const triggerCronReminders = async () => {
    setCronLoading(true);
    setCronSuccessMsg('');
    try {
      const res = await automation.triggerFollowups();
      if (res.success) {
        setCronSuccessMsg('Automated daily follow-up cron executed! Queue updated.');
        fetchDashboardStats();
        // Clear message after 4s
        setTimeout(() => setCronSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Manual cron trigger fail:', err.message);
    } finally {
      setCronLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#05070F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Loading Command Center...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
    lostLeads: 0,
    pendingFollowups: 0,
    averageScore: 0,
    conversionRate: 0
  };

  const COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admissions Command Center</h1>
          <p className="text-gray-400 text-sm mt-1">Real-time analytical trends, automated queues, and AI performance metrics.</p>
        </div>

        {/* Quick action: Cron triggering */}
        <div className="flex items-center gap-3">
          {cronSuccessMsg && (
            <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg animate-pulse">
              {cronSuccessMsg}
            </span>
          )}
          <button
            onClick={triggerCronReminders}
            disabled={cronLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
          >
            {cronLoading ? 'Triggering...' : '⚡ Simulate Follow-Up Cron'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1: Total Leads */}
        <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Leads</span>
          <span className="text-3xl font-bold text-white mt-2 group-hover:scale-105 transition-transform duration-200">{kpis.totalLeads}</span>
          <span className="text-[10px] text-indigo-400 font-semibold mt-1">Inbound Registered</span>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10 select-none">👥</div>
        </div>

        {/* KPI 2: Conversion rate */}
        <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
          <span className="text-3xl font-bold text-gradient-emerald mt-2 group-hover:scale-105 transition-transform duration-200">{kpis.conversionRate}%</span>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1">{kpis.convertedLeads} students enrolled</span>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10 select-none">🎓</div>
        </div>

        {/* KPI 3: Pending Followups */}
        <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Follow-ups Due</span>
          <span className="text-3xl font-bold text-gradient-gold mt-2 group-hover:scale-105 transition-transform duration-200">{kpis.pendingFollowups}</span>
          <span className="text-[10px] text-amber-400 font-semibold mt-1">Scheduled for today/past</span>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10 select-none">📅</div>
        </div>

        {/* KPI 4: Average AI score */}
        <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Avg AI Lead Score</span>
          <span className="text-3xl font-bold text-gradient-purple mt-2 group-hover:scale-105 transition-transform duration-200">{kpis.averageScore}/100</span>
          <span className="text-[10px] text-indigo-300 font-semibold mt-1">Conversion probability avg</span>
          <div className="absolute right-4 bottom-4 text-3xl opacity-10 select-none">🤖</div>
        </div>
      </div>

      {/* Main Split Layout: Left Content, Right Phone Simulator */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Charts & Lists */}
        <div className="flex-1 space-y-8 w-full">
          
          {/* Charts container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Funnel Timeline */}
            <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col">
              <h2 className="text-base font-bold text-white mb-4">Admissions Funnel Activity</h2>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.growthTimeline || []} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEnrolls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: 10 }} />
                    <YAxis stroke="#6B7280" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: 11 }} />
                    <Area type="monotone" dataKey="New Leads" stroke="#6366F1" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Converted Students" stroke="#10B981" fillOpacity={1} fill="url(#colorEnrolls)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Country Distribution */}
            <div className="glass-panel border border-white/5 p-5 rounded-2xl flex flex-col">
              <h2 className="text-base font-bold text-white mb-4">Top Lead Demographics</h2>
              <div className="w-full h-56">
                {data?.countryBreakdown && data.countryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.countryBreakdown.slice(0, 5)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: 10 }} />
                      <YAxis stroke="#6B7280" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: 11 }} />
                      <Bar dataKey="value" name="Leads count" radius={[6, 6, 0, 0]}>
                        {(data.countryBreakdown.slice(0, 5)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-xs">No demographic data compiled.</div>
                )}
              </div>
            </div>
          </div>

          {/* AI Widgets: Hot Leads & High Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Widget 1: Hot Leads */}
            <div className="glass-panel border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">🔥</span> Hot Leads
                </h2>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">High Probability</span>
              </div>
              <div className="space-y-3">
                {data?.hotLeads && data.hotLeads.length > 0 ? (
                  data.hotLeads.map(lead => (
                    <div key={lead._id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5 hover:border-indigo-500/20 transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">{lead.name}</span>
                        <span className="text-[9px] text-gray-500 truncate">{lead.course} • {lead.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-extrabold">
                          {lead.aiScore}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-600 py-6">No high-probability leads recorded.</p>
                )}
              </div>
            </div>

            {/* Widget 2: High Risk Leads */}
            <div className="glass-panel border border-white/5 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className="text-rose-400">⚠️</span> High-Risk Alerts
                </h2>
                <span className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Immediate Attention</span>
              </div>
              <div className="space-y-3">
                {data?.highRiskLeads && data.highRiskLeads.length > 0 ? (
                  data.highRiskLeads.map(lead => (
                    <div key={lead._id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5 hover:border-rose-500/20 transition-colors">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">{lead.name}</span>
                        <span className="text-[9px] text-gray-500 truncate">{lead.course} • {lead.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[10px] font-bold">
                          {lead.aiScore}% Risk
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-600 py-6">No high-risk dropouts detected.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Floating WhatsApp Simulator Mockup */}
        <div className="w-full lg:w-[360px] lg:sticky lg:top-24 flex-shrink-0">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-1.5 pl-3">
            📲 WhatsApp Simulation Hub
          </h2>
          <WhatsAppSimulator />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
