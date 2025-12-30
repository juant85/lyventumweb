// src/pages/admin/RealTimeAnalyticsPage.tsx
import { useIsMobile } from '../../hooks/useIsMobile';
import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEventData } from '../../contexts/EventDataContext';
import Card from '../../components/ui/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import Alert from '../../components/ui/Alert';
import { FunnelIcon, PresentationChartLineIcon, BuildingStorefrontIcon, UsersGroupIcon, ClockIcon } from '../../components/Icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { localeKeys } from '../../i18n/locales';

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm p-3 border border-slate-700 dark:border-slate-600 rounded-lg shadow-lg">
        <p className="label font-bold text-slate-100">{`${label}`}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} style={{ color: p.color || p.payload.fill }} className="intro">{`${p.name} : ${p.value.toLocaleString()}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

// --- New Analytics Components ---
const EventFunnel: React.FC<{ data: { registered: number, checkedIn: number, engaged: number } }> = ({ data }) => {
  const { t } = useLanguage();
  const maxVal = Math.max(data.registered, 1);
  const stages = [
    { label: t(localeKeys.totalRegistered), value: data.registered, color: 'bg-primary-500' },
    { label: t(localeKeys.checkedIn), value: data.checkedIn, color: 'bg-primary-600' },
    { label: t(localeKeys.activelyEngaged), value: data.engaged, color: 'bg-primary-700' },
  ];

  return (
    <Card title={t(localeKeys.eventFunnel)} icon={<FunnelIcon className="w-6 h-6 text-primary-500" />}>
      <div className="space-y-2 pt-4">
        {stages.map((stage, index) => {
          const widthPercentage = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
          const conversionRate = index > 0 && stages[index - 1].value > 0
            ? `(${(stage.value / stages[index - 1].value * 100).toFixed(1)}%)`
            : '';
          return (
            <div key={stage.label}>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{stage.label}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{stage.value.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{conversionRate}</span></span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                <div className={`${stage.color} h-4 rounded-full transition-all duration-500`} style={{ width: `${widthPercentage}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  );
};

const BoothLeaderboard: React.FC<{ data: { name: string, uniqueVisitors: number, totalScans: number }[] }> = ({ data }) => {
  const { t } = useLanguage();
  return (
    <Card title={t(localeKeys.boothLeaderboard)} icon={<BuildingStorefrontIcon className="w-6 h-6 text-green-500" />} bodyClassName="!p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[300px]">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-700 z-10">
            <tr className="border-b border-slate-200 dark:border-slate-600">
              <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Booth</th>
              <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Unique Visitors</th>
              <th className="p-3 text-right font-semibold text-slate-600 dark:text-slate-300">Total Scans</th>
            </tr>
          </thead>
          <tbody>
            {data.map((booth, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{booth.name}</td>
                <td className="p-3 text-right font-semibold text-primary-600 dark:text-primary-400">{booth.uniqueVisitors}</td>
                <td className="p-3 text-right text-slate-500 dark:text-slate-400">{booth.totalScans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const RealTimeAnalyticsPage: React.FC = () => {
  const { scans, sessions, booths, attendees, loadingData, dataError } = useEventData();
  const { currentEvent } = useSelectedEvent();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isMobile = useIsMobile();


  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const barColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const areaColor = theme === 'dark' ? '#22c55e' : '#16a34a';
  const PIE_COLORS = ['#3b82f6', '#16a34a', '#f97316', '#e11d48', '#8b5cf6'];

  const funnelData = useMemo(() => {
    const registered = attendees.length;
    const checkedIn = attendees.filter(a => !!a.checkInTime).length;
    const engaged = new Set(scans.map(s => s.attendeeId)).size;
    return { registered, checkedIn, engaged };
  }, [attendees, scans]);

  const sessionPerformance = useMemo(() => {
    return sessions
      .map(session => ({
        name: session.name.split(' ').slice(0, 3).join(' '),
        attendees: new Set(scans.filter(s => s.sessionId === session.id).map(s => s.attendeeId)).size,
      }))
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 10);
  }, [sessions, scans]);

  const boothLeaderboard = useMemo(() => {
    const boothData = new Map<string, { scans: number; visitors: Set<string> }>();
    scans.forEach(scan => {
      const boothId = scan.boothId ?? '';
      if (!boothData.has(boothId)) {
        boothData.set(boothId, { scans: 0, visitors: new Set() });
      }
      const data = boothData.get(boothId)!;
      data.scans++;
      data.visitors.add(scan.attendeeId);
    });
    return Array.from(boothData.entries()).map(([boothId, data]) => ({
      name: booths.find(b => b.id === boothId)?.companyName || `Booth ${boothId.slice(0, 6)}`,
      uniqueVisitors: data.visitors.size,
      totalScans: data.scans,
    })).sort((a, b) => b.uniqueVisitors - a.uniqueVisitors);
  }, [scans, booths]);

  const activityHeatmap = useMemo(() => {
    if (scans.length === 0) return [];
    const scansByHour = new Map<string, number>();
    scans.forEach(scan => {
      const hour = new Date(scan.timestamp).getHours();
      const hourKey = `${String(hour).padStart(2, '0')}:00`;
      scansByHour.set(hourKey, (scansByHour.get(hourKey) || 0) + 1);
    });
    return Array.from(scansByHour.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, count]) => ({ hour, scans: count }));
  }, [scans]);

  const attendeeEngagement = useMemo(() => {
    const scansPerAttendee = new Map<string, number>();
    scans.forEach(scan => {
      scansPerAttendee.set(scan.attendeeId, (scansPerAttendee.get(scan.attendeeId) || 0) + 1);
    });
    const engagement = { 'Low (1-2)': 0, 'Medium (3-5)': 0, 'High (6-10)': 0, 'Power User (>10)': 0 };
    scansPerAttendee.forEach(count => {
      if (count <= 2) engagement['Low (1-2)']++;
      else if (count <= 5) engagement['Medium (3-5)']++;
      else if (count <= 10) engagement['High (6-10)']++;
      else engagement['Power User (>10)']++;
    });
    return Object.entries(engagement).map(([name, value]) => ({ name, value })).filter(e => e.value > 0);
  }, [scans]);


  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          <div className="lg:col-span-2 h-80 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (dataError || (scans.length === 0 && !loadingData)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">{t(localeKeys.analyticsTitle)}</h1>
        <Card title={t(localeKeys.analyticsUnavailable)}>
          <p className="text-slate-500 dark:text-slate-300">{dataError ? `Error: ${dataError}` : "There is no data for the selected event to generate analytics."}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-montserrat">
          Analytics & Insights
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Discover patterns and trends across your entire event
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><EventFunnel data={funnelData} /></div>
        <div className="lg:col-span-2">
          <Card title={t(localeKeys.sessionPerformance)} icon={<PresentationChartLineIcon className="w-6 h-6 text-blue-500" />}>
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
                  <Bar dataKey="attendees" fill={barColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><BoothLeaderboard data={boothLeaderboard} /></div>
        <div className="lg:col-span-1">
          <Card title={t(localeKeys.attendeeEngagement)} icon={<UsersGroupIcon className="w-6 h-6 text-purple-500" />}>
            <div className="h-72 mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendeeEngagement} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                    {attendeeEngagement.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <Card title={t(localeKeys.eventActivityByHour)} icon={<ClockIcon className="w-6 h-6 text-teal-500" />}>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityHeatmap} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs><linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={areaColor} stopOpacity={0.4} /><stop offset="95%" stopColor={areaColor} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} />
              <Area type="monotone" dataKey="scans" stroke={areaColor} fill="url(#areaColor)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

    </div>
  );
};

export default RealTimeAnalyticsPage;