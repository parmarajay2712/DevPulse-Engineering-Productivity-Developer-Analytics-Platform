import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Activity, AlertCircle, Server, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrentProject } from '../hooks/useCurrentProject';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: project } = useCurrentProject();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl mx-4 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl"
        >
          <Command className="w-full" label="Global Command Menu">
            <div className="flex items-center px-4 border-b border-zinc-800">
              <Search className="w-5 h-5 text-zinc-500 mr-2" />
              <Command.Input
                placeholder="Search projects, errors, logs..."
                className="w-full h-14 bg-transparent border-none text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
              />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700">
              <Command.Empty className="py-6 text-center text-zinc-500 text-sm">
                No results found.
              </Command.Empty>

              <Command.Group heading="Navigation" className="text-xs text-zinc-500 font-medium px-2 py-2">
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/'))}
                  className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-zinc-300 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-white"
                >
                  <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                  Dashboard Overview
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/logs'))}
                  className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-zinc-300 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-white"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  Logs Explorer
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/alerts'))}
                  className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-zinc-300 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-white"
                >
                  <AlertCircle className="w-4 h-4 text-zinc-400" />
                  Alerts & Rules
                </Command.Item>
              </Command.Group>

              {project && (
                <Command.Group heading={`Actions for ${project.name}`} className="text-xs text-zinc-500 font-medium px-2 py-2 border-t border-zinc-800 mt-2">
                  <Command.Item
                    onSelect={() => runCommand(() => console.log('Create new alert'))}
                    className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-emerald-400 rounded-md cursor-pointer hover:bg-zinc-800"
                  >
                    <Activity className="w-4 h-4" />
                    Create new Alert Rule
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/settings'))}
                    className="flex items-center gap-2 px-2 py-2.5 mt-1 text-sm text-zinc-300 rounded-md cursor-pointer hover:bg-zinc-800 hover:text-white"
                  >
                    <Server className="w-4 h-4 text-zinc-400" />
                    Project Settings
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
