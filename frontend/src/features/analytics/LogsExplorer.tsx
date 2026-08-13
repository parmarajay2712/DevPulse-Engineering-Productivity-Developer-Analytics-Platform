import { useState } from 'react';
import { Search, Filter, Clock, Calendar, Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';
import { LogDetailsDrawer } from './LogDetailsDrawer';

export const LogsExplorer = () => {
  const { data: project } = useCurrentProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState('All Environments');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', project?._id, statusFilter, searchTerm, environmentFilter, page],
    queryFn: async () => {
      let query = `?page=${page}&limit=${limit}&`;
      if (statusFilter !== 'ALL') query += `status=${statusFilter}&`;
      if (searchTerm) query += `search=${encodeURIComponent(searchTerm)}&`;
      if (environmentFilter !== 'All Environments') query += `environment=${environmentFilter.toLowerCase()}&`;
      return await api(`/logs/api/${project?._id}${query}`);
    },
    enabled: !!project?._id,
  });

  const logs = (logsData as any)?.logs || [];
  const total = (logsData as any)?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusColor = (status: number) => {
    if (status >= 500) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (status >= 400) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (status >= 200) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    return 'text-zinc-400 bg-zinc-800 border-zinc-700';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-emerald-400';
      case 'PUT': return 'text-amber-400';
      case 'DELETE': return 'text-rose-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs Explorer</h1>
          <p className="text-sm text-zinc-500 mt-1">Search and drill down into API request logs</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center"
      >
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search by endpoint, user ID, or trace..."
            className="w-full bg-zinc-900 border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <select 
            className="bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary w-full md:w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Statuses</option>
            <option value="200">2xx Success</option>
            <option value="400">4xx Client Errors</option>
            <option value="500">5xx Server Errors</option>
          </select>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary w-full md:w-auto"
            value={environmentFilter}
            onChange={(e) => { setEnvironmentFilter(e.target.value); setPage(1); }}
          >
            <option>All Environments</option>
            <option>Production</option>
            <option>Development</option>
            <option>Staging</option>
          </select>
        </div>
      </motion.div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-border text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Method & Endpoint</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-500" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-medium text-zinc-200 mb-1">
                        {searchTerm || statusFilter !== 'ALL' || environmentFilter !== 'All Environments' 
                          ? 'No logs found matching your filters' 
                          : '📄 No logs yet'}
                      </h3>
                      <p className="text-sm text-zinc-500 max-w-sm">
                        {searchTerm || statusFilter !== 'ALL' || environmentFilter !== 'All Environments' 
                          ? 'Try adjusting your search term, status, or environment filter to see more results.' 
                          : 'Connect your application using DevPulse SDK to start receiving events.'}
                      </p>
                      {!(searchTerm || statusFilter !== 'ALL' || environmentFilter !== 'All Environments') && (
                        <button 
                          onClick={() => window.open('https://github.com/devpulse', '_blank')}
                          className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          View Documentation
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr 
                    key={log._id || log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold text-xs ${getMethodColor(log.method)}`}>{log.method}</span>
                        <span className="font-mono text-zinc-300 group-hover:text-white transition-colors">{log.endpoint}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(log.statusCode || log.status)}`}>
                        {log.statusCode || log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {log.responseTime || log.duration}ms
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">
                      {log.user || 'anonymous'}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-right text-xs flex items-center justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-400 text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <LogDetailsDrawer 
        log={selectedLog} 
        isOpen={!!selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />
    </div>
  );
};
