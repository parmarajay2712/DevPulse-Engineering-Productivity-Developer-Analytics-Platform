import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Code, Clock, TerminalSquare, Loader2, Layers, CheckCircle2, EyeOff, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';
import { ErrorDetailsDrawer } from './ErrorDetailsDrawer';

interface ErrorEvent {
  _id: string;
  errorType: string;
  message: string;
  source: string;
  timestamp: string;
  endpoint?: string;
  lastSeen?: string;
  count?: number;
  fingerprint?: string;
  status?: string;
}

export const ErrorFeed = () => {
  const { data: project } = useCurrentProject();
  const { socket } = useSocket(project?._id || '');
  const queryClient = useQueryClient();
  const [selectedError, setSelectedError] = useState<ErrorEvent | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['errors', project?._id, page],
    queryFn: async () => {
      const res: any = await api(`/errors/${project._id}?page=${page}&limit=${limit}`);
      return res;
    },
    enabled: !!project?._id
  });

  const errorGroups = data?.errorGroups;
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const [errors, setErrors] = useState<ErrorEvent[]>([]);

  useEffect(() => {
    if (errorGroups) {
      setErrors(errorGroups);
    }
  }, [errorGroups]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new-error', (payload: any) => {
      // Backend emits { errorEvent, errorGroup }, we display error groups in the list
      const group = payload.errorGroup || payload;
      setErrors((prev) => {
        // If the group already exists, update it in place
        const existingIndex = prev.findIndex((e) => e._id === group._id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = group;
          return updated;
        }
        return [group, ...prev].slice(0, 50);
      });
    });

    return () => {
      socket.off('new-error');
    };
  }, [socket]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ groupId, status, priority }: { groupId: string; status?: string; priority?: string }) => 
      await api(`/errors/${groupId}/status`, { method: 'PATCH', data: { status, priority } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errors', project?._id] });
    }
  });

  const handleStatusChange = (e: React.MouseEvent, groupId: string, status: string) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ groupId, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Error Feed</h1>
          <p className="text-sm text-zinc-500 mt-1">Real-time application exceptions and crashes</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-500">Live</span>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-4">Error / Message</div>
          <div className="col-span-2">Group ID</div>
          <div className="col-span-2">Source / Occurrences</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Time</div>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          ) : (
          <AnimatePresence initial={false}>
            {errors.map((error) => (
              <motion.div
                key={error._id}
                initial={{ opacity: 0, y: -20, backgroundColor: '#3f3f46' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedError(error)}
                className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 items-start md:items-center hover:bg-zinc-800/50 transition-colors group cursor-pointer border-b border-border md:border-b-0"
              >
                <div className="md:col-span-4 w-full">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-rose-400 group-hover:text-rose-300 transition-colors">{error.errorType}</h3>
                      <p className="text-sm text-zinc-300 truncate max-w-[300px] mt-0.5">{error.message}</p>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between w-full md:w-auto">
                   <span className="text-xs text-zinc-500 uppercase md:hidden">Group ID</span>
                   <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-border truncate max-w-[140px]">
                     {error.fingerprint || 'N/A'}
                   </span>
                </div>

                <div className="md:col-span-2 flex items-center gap-3 justify-between w-full md:w-auto md:justify-start">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-zinc-500 uppercase md:hidden">Source</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                    error.source === 'frontend' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {error.source === 'frontend' ? <TerminalSquare className="w-3 h-3 mr-1.5" /> : <Code className="w-3 h-3 mr-1.5" />}
                    {error.source}
                  </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Layers className="w-3.5 h-3.5" />
                    {error.count || 1}
                  </span>
                </div>

                <div className="md:col-span-2 flex items-center justify-between w-full md:w-auto md:justify-start gap-1">
                  <span className="text-xs text-zinc-500 uppercase md:hidden">Status</span>
                  <div className="flex items-center gap-1">
                  {error.status === 'resolved' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  ) : error.status === 'ignored' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-700/50 text-zinc-400 border border-zinc-600">
                      <EyeOff className="w-3 h-3" /> Ignored
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleStatusChange(e, error._id, 'resolved')}
                        className="p-1 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                        title="Resolve"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleStatusChange(e, error._id, 'ignored')}
                        className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                        title="Ignore"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {(error.status === 'resolved' || error.status === 'ignored') && (
                    <button 
                      onClick={(e) => handleStatusChange(e, error._id, 'active')}
                      className="p-1 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded transition-colors"
                      title="Reopen"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  </div>
                </div>

                <div className="md:col-span-2 text-right text-sm text-zinc-500 flex items-center justify-between w-full md:w-auto md:justify-end gap-1.5 mt-2 md:mt-0">
                  <span className="text-xs text-zinc-500 uppercase md:hidden">Time</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(error.lastSeen || error.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
          {!isLoading && errors.length === 0 && (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No errors recorded yet.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-t border-border bg-zinc-900/30 gap-4">
            <span className="text-xs text-zinc-500 text-center sm:text-left">{total} total errors • Page {page} of {totalPages}</span>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ErrorDetailsDrawer 
        error={selectedError} 
        isOpen={!!selectedError} 
        onClose={() => setSelectedError(null)}
        onUpdate={(updates) => {
          if (selectedError) {
            updateStatusMutation.mutate({ groupId: selectedError._id, ...updates });
            setSelectedError({ ...selectedError, ...updates });
          }
        }}
      />
    </div>
  );
};
