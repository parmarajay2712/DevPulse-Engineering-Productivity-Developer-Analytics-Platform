import { useState } from 'react';
import { Bell, Plus, Trash2, Clock, Activity, Loader2, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';

const ALERT_TEMPLATES = [
  { name: 'API Error Rate Spikes', condition: 'percentage', threshold: 5, timeWindow: 5, action: 'email', icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
  { name: 'Slow API Endpoints', condition: 'latency', threshold: 1000, timeWindow: 5, action: 'slack', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { name: 'Deployment Regression', condition: 'count', threshold: 20, timeWindow: 5, action: 'email', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { name: 'High Request Volume', condition: 'throughput', threshold: 10000, timeWindow: 1, action: 'log', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
];

export const AlertsDashboard = () => {
  const { data: project } = useCurrentProject();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', condition: 'count', threshold: '', timeWindow: '5', action: 'log' });

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts', project?._id],
    queryFn: async () => await api(`/alerts/${project?._id}`),
    enabled: !!project?._id,
  });
  
  const alerts = (alertsData as any)?.alerts || [];

  const createAlertMutation = useMutation({
    mutationFn: async (newAlert: any) => await api('/alerts', { data: { ...newAlert, projectId: project?._id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', project?._id] });
      setShowForm(false);
      setFormData({ name: '', condition: 'count', threshold: '', timeWindow: '5', action: 'log' });
      alert('Alert Rule created successfully!');
    },
    onError: (error: any) => {
      alert(`Failed to create rule: ${error.message}`);
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => await api(`/alerts/${alertId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', project?._id] });
    },
    onError: (error: any) => {
      alert(`Failed to delete rule: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!formData.name || !formData.threshold) return;
    createAlertMutation.mutate({
      name: formData.name,
      condition: formData.condition,
      threshold: Number(formData.threshold),
      timeWindow: Number(formData.timeWindow),
      action: formData.action
    });
  };

  const applyTemplate = (template: any) => {
    setFormData({
      name: template.name,
      condition: template.condition,
      threshold: template.threshold.toString(),
      timeWindow: template.timeWindow.toString(),
      action: template.action
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alert Rules</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure automated notifications for anomalies</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }} 
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="bg-surface border border-border p-6 rounded-xl"
          >
            <h2 className="text-lg font-semibold mb-4">New Alert Rule</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="sm:col-span-2 md:col-span-2">
                <label className="block text-sm font-medium text-zinc-400 mb-1">Rule Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" 
                  placeholder="e.g., Auth API Spike" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Condition</label>
                <select 
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="count">Error Count &gt;</option>
                  <option value="percentage">Error Percentage &gt;</option>
                  <option value="latency">Avg Latency (ms) &gt;</option>
                  <option value="throughput">Throughput &gt;</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Threshold</label>
                <input 
                  type="number" 
                  value={formData.threshold}
                  onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" 
                  placeholder="10" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Time (Minutes)</label>
                <input 
                  type="number" 
                  value={formData.timeWindow}
                  onChange={(e) => setFormData({...formData, timeWindow: e.target.value})}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary" 
                  placeholder="5" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white">Cancel</button>
              <button 
                onClick={handleCreate} 
                disabled={createAlertMutation.isPending}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50"
              >
                {createAlertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Rule'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Rule Name</div>
          <div className="col-span-4">Condition</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-1 text-right"></div>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Bell className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-200 mb-1">Create Alert</h3>
                <p className="text-sm text-zinc-500 mb-8">Start by choosing a template or creating a custom rule to get notified when things go wrong.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {ALERT_TEMPLATES.map((template, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => applyTemplate(template)}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-zinc-900/30 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all text-left group"
                    >
                      <div className={`p-2 rounded-lg border ${template.bg}`}>
                        <template.icon className={`w-5 h-5 ${template.color}`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{template.name}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          IF {template.condition} &gt; {template.threshold} within {template.timeWindow}m
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert._id || alert.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 items-start md:items-center hover:bg-zinc-800/50 transition-colors border-b border-border md:border-b-0 relative">
                <div className="md:col-span-5 flex items-center gap-3 pr-10 md:pr-0 w-full">
                  <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate">{alert.name}</span>
                </div>
                <div className="md:col-span-4 flex items-center flex-wrap gap-2 text-sm text-zinc-300 w-full mt-1 md:mt-0">
                  <Activity className="w-4 h-4 text-zinc-500 hidden md:block" />
                  <span className="md:hidden text-xs text-zinc-500 uppercase mr-1">Cond</span>
                  <span>If {alert.condition} &gt; {alert.threshold} in</span>
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-400 flex items-center gap-1 border border-border">
                    <Clock className="w-3 h-3" /> {alert.timeWindow}m
                  </span>
                </div>
                <div className="md:col-span-2 flex items-center w-full mt-2 md:mt-0">
                  <span className="md:hidden text-xs text-zinc-500 uppercase mr-3">Action</span>
                  <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold">
                    {alert.action}
                  </span>
                </div>
                <div className="md:col-span-1 absolute top-4 right-4 md:static md:text-right">
                  <button 
                    onClick={() => deleteAlertMutation.mutate(alert._id || alert.id)}
                    className="text-zinc-500 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg"
                    disabled={deleteAlertMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
