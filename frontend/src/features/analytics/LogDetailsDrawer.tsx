import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, Code, FileJson, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface LogDetailsDrawerProps {
  log: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LogDetailsDrawer = ({ log, isOpen, onClose }: LogDetailsDrawerProps) => {
  if (!log) return null;

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
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-surface border-l border-border z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface/80 backdrop-blur-md z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`font-mono font-bold text-sm ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(log.statusCode || log.status)}`}>
                    {log.statusCode || log.status}
                  </span>
                </div>
                <h2 className="text-xl font-mono text-zinc-100 break-all">{log.endpoint}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Duration</span>
                  </div>
                  <div className="text-lg font-mono font-semibold">{log.responseTime || log.duration}ms</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Timestamp</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{new Date(log.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border col-span-2">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Code className="w-4 h-4" />
                    <span className="text-xs font-medium">IP Address / User</span>
                  </div>
                  <div className="text-sm font-mono mt-1">{log.ip || '127.0.0.1'} • {log.user || 'anonymous'}</div>
                </div>
              </div>

              {/* Request Headers */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4" /> Request Headers
                </h3>
                <div className="bg-[#0d1117] p-4 rounded-lg border border-border overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed text-zinc-300">
                    <code>
{log.headers ? JSON.stringify(log.headers, null, 2) : 'No headers captured'}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Request Body */}
              {log.method !== 'GET' && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                    <FileJson className="w-4 h-4" /> Request Body
                  </h3>
                  <div className="bg-[#0d1117] p-4 rounded-lg border border-border overflow-x-auto">
                    <pre className="text-xs font-mono leading-relaxed text-zinc-300">
                      <code>
{log.body ? JSON.stringify(log.body, null, 2) : 'No request body captured'}
                      </code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Body */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                  <ArrowDownToLine className="w-4 h-4" /> Response Body
                </h3>
                <div className="bg-[#0d1117] p-4 rounded-lg border border-border overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed text-zinc-300">
                    <code>
{log.response ? JSON.stringify(log.response, null, 2) : 'No response body captured'}
                    </code>
                  </pre>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
