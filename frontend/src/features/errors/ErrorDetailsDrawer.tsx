import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Globe, Laptop, Server, User, FileJson, AlertCircle, Code } from 'lucide-react';

interface ErrorDetailsDrawerProps {
  error: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updates: { status?: string, priority?: string }) => void;
}

export const ErrorDetailsDrawer = ({ error, isOpen, onClose, onUpdate }: ErrorDetailsDrawerProps) => {
  if (!error) return null;

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
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {error.fingerprint || 'N/A'}
                  </span>
                  <span className="text-xs text-zinc-500">Group ID</span>
                </div>
                <h2 className="text-xl font-bold text-rose-400">{error.errorType}</h2>
              </div>
              <div className="flex items-center gap-4">
                {onUpdate && (
                  <>
                    <select
                      value={error.status || 'open'}
                      onChange={(e) => onUpdate({ status: e.target.value })}
                      className="bg-zinc-900 border border-border rounded text-sm px-2 py-1 text-zinc-300"
                    >
                      <option value="open">Open</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="resolved">Resolved</option>
                      <option value="ignored">Ignored</option>
                    </select>
                    <select
                      value={error.priority || 'medium'}
                      onChange={(e) => onUpdate({ priority: e.target.value })}
                      className="bg-zinc-900 border border-border rounded text-sm px-2 py-1 text-zinc-300"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Message */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2">Message</h3>
                <div className="bg-zinc-900/50 p-4 rounded-lg font-mono text-sm border border-border">
                  {error.message}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Occurrences</span>
                  </div>
                  <div className="text-xl font-semibold">{error.count || 1}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">First Seen</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{error.firstSeen ? new Date(error.firstSeen).toLocaleString() : error.createdAt ? new Date(error.createdAt).toLocaleString() : 'Unknown'}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Last Seen</span>
                  </div>
                  <div className="text-sm font-medium mt-1">{error.lastSeen ? new Date(error.lastSeen).toLocaleString() : 'Unknown'}</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Server className="w-4 h-4" />
                    <span className="text-xs font-medium">Environment</span>
                  </div>
                  <div className="text-sm font-medium mt-1 capitalize">{error.environment || error.metadata?.environment || 'Unknown'}</div>
                </div>
              </div>

              {/* Context */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                  <FileJson className="w-4 h-4" /> Context
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-lg border border-border">
                    <Globe className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500">Browser</div>
                      <div className="text-sm">{error.metadata?.browser || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-lg border border-border">
                    <Laptop className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500">OS</div>
                      <div className="text-sm">{error.metadata?.os || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-lg border border-border">
                    <User className="w-4 h-4 text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500">User</div>
                      <div className="text-sm truncate w-24">{error.user || error.metadata?.user || 'anonymous'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stack Trace */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Stack Trace
                </h3>
                <div className="bg-[#0d1117] p-4 rounded-lg border border-border overflow-x-auto">
                  <pre className="text-xs font-mono leading-relaxed text-zinc-300">
                    <code>
                      {error.stackTrace || 'No stack trace available for this error.'}
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

