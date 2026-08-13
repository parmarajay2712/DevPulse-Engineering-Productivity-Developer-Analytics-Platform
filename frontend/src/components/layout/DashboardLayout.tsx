import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, LayoutDashboard, Settings, Box, Bell, List, Rocket, LogOut, ShieldAlert, ChevronDown, Menu, X } from 'lucide-react';
import { removeAuthToken } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';
import { useSocket } from '../../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Errors', path: '/errors', icon: AlertTriangle },
    { name: 'Logs', path: '/logs', icon: List },
    { name: 'Deployments', path: '/deployments', icon: Rocket },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'User', email: '' };
  const { data: currentProject, projects, setProject } = useCurrentProject();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed md:sticky top-0 left-0 z-50 flex flex-col h-full bg-surface border-r border-border min-h-screen w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Box className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">DevPulse</span>
          </NavLink>
          <button 
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Project Switcher */}
      {projects.length > 0 && (
        <div className="relative mb-6 px-4 pt-4">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-zinc-900 border border-border rounded-lg text-sm hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="truncate font-medium text-zinc-200">{currentProject?.name || 'Select Project'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showProjectDropdown && (
            <div className="absolute z-50 top-full left-4 right-4 mt-1 bg-zinc-900 border border-border rounded-lg shadow-xl overflow-hidden">
              {projects.map((proj: any) => (
                <button
                  key={proj._id}
                  onClick={() => {
                    setProject(proj._id);
                    setShowProjectDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2 ${
                    currentProject?._id === proj._id ? 'text-primary bg-primary/5' : 'text-zinc-300'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentProject?._id === proj._id ? 'bg-primary' : 'bg-zinc-600'}`} />
                  <span className="truncate">{proj.name}</span>
                  <span className="ml-auto text-xs text-zinc-500 capitalize flex-shrink-0">{proj.environment}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 py-4 px-4 space-y-4 overflow-y-auto">

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-foreground'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      </div>

      <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium border border-border">
            {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user.name}</span>
            <span className="text-xs text-zinc-500 mt-1 truncate max-w-[100px]">{user.email}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
    </>
  );
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: project } = useCurrentProject();
  const { socket, isConnected } = useSocket(project?._id || '');

  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [lastEventLabel, setLastEventLabel] = useState('No events yet');

  const { data: statsData } = useQuery({
    queryKey: ['stats', project?._id, '24h'],
    queryFn: async () => await api(`/stats/${project?._id}?range=24h`),
    enabled: !!project?._id,
  });

  useEffect(() => {
    if (statsData && (statsData as any).lastEventTime) {
      setLastEventTime(new Date((statsData as any).lastEventTime));
    }
  }, [statsData]);

  useEffect(() => {
    if (!socket) return;
    const handleNewEvent = () => setLastEventTime(new Date());
    socket.on('new-error', handleNewEvent);
    socket.on('new-metric', handleNewEvent);
    return () => {
      socket.off('new-error', handleNewEvent);
      socket.off('new-metric', handleNewEvent);
    };
  }, [socket]);

  // Update the label every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastEventTime) {
        setLastEventLabel(formatTimeAgo(lastEventTime));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastEventTime]);

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <main className="flex-1 h-screen overflow-auto flex flex-col">
        <header className="h-14 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between md:justify-end">
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-zinc-500 font-mono">Last event: {lastEventLabel}</span>
            <div className="h-4 w-px bg-border"></div>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-full border ${isConnected ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
              <span className="relative flex h-2 w-2">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span>
              </span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
