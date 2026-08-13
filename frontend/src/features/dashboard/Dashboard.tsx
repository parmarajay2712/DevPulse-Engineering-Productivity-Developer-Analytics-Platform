import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';
import { useSocket } from '../../hooks/useSocket';

const StatCard = ({ title, value, icon: Icon, delay, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-surface border border-border p-5 rounded-xl shadow-sm flex flex-col hover:border-primary/50 transition-colors"
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-zinc-400">{title}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-border ${color || 'bg-zinc-800/50 text-primary'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
        className="text-2xl font-bold tracking-tight"
      >
        {value}
      </motion.span>
    </div>
  </motion.div>
);


export const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { data: project } = useCurrentProject();

  useSocket(project?._id || '');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['stats', project?._id, timeRange],
    queryFn: async () => await api(`/stats/${project?._id}?range=${timeRange}`),
    enabled: !!project?._id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = (statsData as any)?.stats;
  const errorTrend = (statsData as any)?.errorTrend || [];
  const requestVolume = (statsData as any)?.requestVolume || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Application health and performance metrics</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            className="bg-surface border border-border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Errors" 
          value={stats?.errors || '0'} 
          icon={AlertCircle} 
          color="bg-rose-500/10 text-rose-400"
          delay={0.1} 
        />
        <StatCard 
          title="API Success Rate" 
          value={stats?.successRate || '100%'} 
          icon={CheckCircle2} 
          color="bg-emerald-500/10 text-emerald-400"
          delay={0.2} 
        />
        <StatCard 
          title="Avg Response Time" 
          value={stats?.avgResponseTime || '0ms'} 
          icon={Clock} 
          color="bg-blue-500/10 text-blue-400"
          delay={0.3} 
        />
        <StatCard 
          title="Active Issues" 
          value={stats?.activeIssues || '0'} 
          icon={AlertTriangle} 
          color="bg-amber-500/10 text-amber-400"
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-surface border border-border rounded-xl p-6"
        >
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-semibold">Error Trend</h2>
              <p className="text-sm text-zinc-500">Exceptions recorded over time</p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 self-start sm:self-auto">
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            {errorTrend.length > 0 && errorTrend.some((t: any) => t.errors > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#262626' }}
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', color: '#ededed' }}
                  />
                  <Bar dataKey="errors" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                No error data yet. Send events using the DevPulse SDK.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-surface border border-border rounded-xl p-6"
        >
          <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-base font-semibold">Request Volume</h2>
              <p className="text-sm text-zinc-500">Total API hits and events</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 self-start sm:self-auto">
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            {requestVolume.length > 0 && requestVolume.some((t: any) => t.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestVolume}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="time" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px', color: '#ededed' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                No request data yet. Send API metrics using the DevPulse SDK.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

