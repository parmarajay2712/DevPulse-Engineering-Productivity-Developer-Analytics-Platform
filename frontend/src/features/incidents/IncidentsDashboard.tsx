import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Plus, Loader2, CheckCircle2, Clock, XCircle, Search, RotateCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';

export const IncidentsDashboard = () => {
  const { data: project } = useCurrentProject();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', project?._id],
    queryFn: async () => await api(`/incidents/${project?._id}`),
    enabled: !!project?._id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api('/incidents', { data: { ...data, projectId: project?._id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', project?._id] });
      setShowForm(false);
      setFormData({ title: '', description: '' });
    },
    onError: (error: any) => {
      alert(`Failed: ${error.message}`);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ incidentId, status }: { incidentId: string; status: string }) =>
      await api(`/incidents/${incidentId}/status`, { method: 'PATCH', data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents', project?._id] });
    },
    onError: (error: any) => {
      alert(`Failed to update status: ${error.message}`);
    }
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.description.trim()) return;
    createMutation.mutate(formData);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Investigating':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Resolved':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Closed':
        return 'text-zinc-400 bg-zinc-700/50 border-zinc-600';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Investigating': return <Search className="w-3 h-3" />;
      case 'Resolved': return <CheckCircle2 className="w-3 h-3" />;
      case 'Closed': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getNextStatuses = (current: string): string[] => {
    switch (current) {
      case 'Investigating': return ['Resolved', 'Closed'];
      case 'Resolved': return ['Closed', 'Investigating'];
      case 'Closed': return ['Investigating'];
      default: return [];
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
          <p className="text-sm text-zinc-500 mt-1">Track and manage production incidents</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Report Incident
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
            <h2 className="text-lg font-semibold mb-4">New Incident</h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g., Payment gateway timeout"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Describe what happened and the impact..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !formData.title.trim()}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Incident'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Incident</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (incidents as any[]).length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <ShieldAlert className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-200 mb-1">No incidents</h3>
                <p className="text-sm text-zinc-500">No incidents have been reported yet. Use the button above to report one.</p>
              </div>
            </div>
          ) : (
            (incidents as any[]).map((incident: any, index: number) => (
              <motion.div
                key={incident._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 items-start md:items-center hover:bg-zinc-800/50 transition-colors border-b border-border md:border-b-0"
              >
                <div className="md:col-span-5 w-full">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <ShieldAlert className={`w-4 h-4 ${incident.status === 'Investigating' ? 'text-amber-400' : incident.status === 'Resolved' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{incident.title}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{incident.description}</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between w-full md:w-auto mt-2 md:mt-0">
                  <span className="text-xs text-zinc-500 uppercase md:hidden">Status</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusStyle(incident.status)}`}>
                    {getStatusIcon(incident.status)}
                    {incident.status}
                  </span>
                </div>
                <div className="md:col-span-2 text-sm text-zinc-500 flex items-center justify-between w-full md:w-auto">
                  <span className="text-xs text-zinc-500 uppercase md:hidden">Created</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(incident.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="md:col-span-3 flex flex-wrap items-center justify-start md:justify-end gap-1 w-full md:w-auto mt-2 md:mt-0">
                  {getNextStatuses(incident.status).map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => updateStatusMutation.mutate({ incidentId: incident._id, status: nextStatus })}
                      disabled={updateStatusMutation.isPending}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                        nextStatus === 'Resolved'
                          ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 hover:bg-emerald-400/20'
                          : nextStatus === 'Closed'
                          ? 'text-zinc-400 bg-zinc-700/50 border-zinc-600 hover:bg-zinc-700'
                          : 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/20'
                      } disabled:opacity-50`}
                      title={`Mark as ${nextStatus}`}
                    >
                      {nextStatus === 'Investigating' && <RotateCcw className="w-3 h-3 inline mr-1" />}
                      {nextStatus}
                    </button>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
