import React, { useState, useEffect } from 'react';
import { stats } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const response = await stats.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to load analytics details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#05070F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Compiling Analytical Records...</span>
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

  const courseData = data?.courseDistribution || [];
  const countryData = data?.countryBreakdown || [];

  // Funnel logic calculations
  const funnelSteps = [
    { name: '1. Inbound Leads', value: kpis.totalLeads, percent: 100, color: '#6366F1' },
    { name: '2. Contacted Queries', value: kpis.contactedLeads + kpis.convertedLeads, percent: kpis.totalLeads > 0 ? Math.round(((kpis.contactedLeads + kpis.convertedLeads) / kpis.totalLeads) * 100) : 0, color: '#F59E0B' },
    { name: '3. Enrolled Students', value: kpis.convertedLeads, percent: kpis.totalLeads > 0 ? Math.round((kpis.convertedLeads / kpis.totalLeads) * 100) : 0, color: '#10B981' }
  ];

  const PIE_COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Admissions Funnel Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Deep-dive business intelligence, conversion ratios, and demographic spreads.</p>
      </div>

      {/* Funnel Visual Progress Deck */}
      <div className="glass-panel border border-white/5 p-6 rounded-3xl mb-8">
        <h2 className="text-base font-bold text-white mb-6">Interactive Conversion Funnel</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {funnelSteps.map((step, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl border border-white/5 bg-white/2 relative flex flex-col items-center text-center justify-center overflow-hidden"
              style={{ borderLeft: `4px solid ${step.color}` }}
            >
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{step.name}</span>
              <span className="text-3xl font-extrabold text-white mt-2">{step.value}</span>
              <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 max-w-[80%] overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ width: `${step.percent}%`, backgroundColor: step.color }}
                ></div>
              </div>
              <span className="text-[10px] font-bold mt-2" style={{ color: step.color }}>
                {step.percent}% Onboarding Ratio
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analytical Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Chart 1: Course Demands */}
        <div className="glass-panel border border-white/5 p-6 rounded-3xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
            🎓 Program Demand Matrix
          </h2>
          <div className="w-full h-72">
            {courseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis type="number" stroke="#6B7280" style={{ fontSize: 9 }} />
                  <YAxis dataKey="name" type="category" stroke="#6B7280" style={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: 11 }} />
                  <Bar dataKey="count" fill="#818CF8" name="Inquiries" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs">No active course registrations.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Regional Demographics */}
        <div className="glass-panel border border-white/5 p-6 rounded-3xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-1.5">
            🌎 Regional Geographic Spread
          </h2>
          <div className="w-full h-72 flex flex-col sm:flex-row items-center justify-center gap-6">
            {countryData.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {countryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {countryData.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span className="text-xs text-gray-300 font-semibold">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-xs">No geographic spread data.</div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Insights Panel */}
      <div className="glass-panel border border-white/5 p-6 rounded-3xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Admissions Funnel Health Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Conversion Health</span>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              Your overall conversion rate is at <b className="text-emerald-400">{kpis.conversionRate}%</b>. Top tier educational consulting companies target between 15% and 25%. Maintain proactive WhatsApp welcome notifications to sustain high enrollment momentum.
            </p>
          </div>

          <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Auto Follow-up Efficiency</span>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              Admissions reports show there are currently <b className="text-amber-400">{kpis.pendingFollowups}</b> leads due for follow-ups today. Trigger the Cron simulation on the reports tab to transmit automated catch-up WhatsApp messages to these leads instantly.
            </p>
          </div>

          <div className="p-4 bg-white/2 rounded-2xl border border-white/5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AI Integration Impact</span>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              Leads analyzed and assessed by your AI model have an average score of <b className="text-indigo-400">{kpis.averageScore}/100</b>. Focus marketing efforts on demographics returning high scores (like India and Canada CS programs) to maximize ROI.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
