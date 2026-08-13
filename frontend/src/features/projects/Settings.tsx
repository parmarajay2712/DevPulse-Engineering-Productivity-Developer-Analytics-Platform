import { useState } from 'react';
import { Key, Users, Copy, CheckCircle2, ShieldAlert, RefreshCw, FolderGit2, Plus, ArrowRight, Loader2, ScrollText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';

export const Settings = () => {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  
  const queryClient = useQueryClient();
  const { data: currentProject, setProject } = useCurrentProject();

  const { data: projects = [] as any[], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['all-projects'],
    queryFn: async () => await api<any[]>('/projects'),
  });

  const { data: members = [] as any[], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['org-members'],
    queryFn: async () => await api<any[]>('/organizations/members'),
  });

  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => await api<any>('/organizations/audit-logs'),
  });

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleCopy = () => {
    if (!currentProject?.apiKey) return;
    navigator.clipboard.writeText(currentProject.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => await api('/organizations/invite', { method: 'POST', data: { email } }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      setShowInviteForm(false);
      setInviteEmail('');
      alert(`Success! User ${data.user.email} has been added to the organization. They can log in with the default password: password123`);
    },
    onError: (err: any) => {
      alert("Failed to invite member: " + err.message);
    }
  });

  const handleInvite = () => {
    if (inviteEmail) {
      inviteMutation.mutate(inviteEmail);
    }
  };

  const regenerateMutation = useMutation({
    mutationFn: async () => await api(`/projects/${currentProject?._id}/regenerate-key`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowRegenerateConfirm(false);
      alert("API Key regenerated successfully!");
    },
    onError: (err: any) => {
      alert("Failed to regenerate API Key: " + err.message);
    }
  });

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => await api('/projects', { method: 'POST', data: { name, environment: 'production' } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowNewProjectForm(false);
      setNewProjectName('');
      alert("Project created successfully!");
    },
    onError: (err: any) => {
      alert("Failed to create project: " + err.message);
    }
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate(newProjectName);
  };

  const maskKey = (proj: any) => {
    if (!proj) return 'No API Key Available';
    if (proj.apiKey) {
      return `${proj.apiKey.substring(0, 6)}......${proj.apiKey.substring(proj.apiKey.length - 7)}`;
    }
    if (proj.apiKeyPreview) {
      return `${proj.apiKeyPreview}...... (Hidden)`;
    }
    return 'No API Key Available';
  };

  const currentKey = currentProject?.apiKey || 'Hidden for security. Please regenerate to view.';

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your team, projects, and security</p>
      </div>

      {/* Projects Management */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-400/10 text-indigo-400 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Projects</h2>
              <p className="text-sm text-zinc-500">Manage multiple projects and environments in this organization.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-border w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            {showNewProjectForm ? 'Cancel' : 'New Project'}
          </button>
        </div>

        {showNewProjectForm && (
          <div className="mb-6 bg-zinc-900/50 border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Project Name</label>
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Auth Service API"
                className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button 
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending || !newProjectName.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50 w-full sm:w-auto"
            >
              {createProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoadingProjects ? (
            <div className="col-span-full py-8 flex justify-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : projects.length === 0 ? (
            <div className="col-span-full py-8 text-center text-zinc-500">No projects found.</div>
          ) : (
            projects.map((proj: any) => (
              <div 
                key={proj._id} 
                onClick={() => setProject(proj._id)}
                className={`border bg-zinc-900/50 rounded-lg p-4 group cursor-pointer transition-colors relative overflow-hidden ${currentProject?._id === proj._id ? 'border-primary/50' : 'border-border hover:border-zinc-700'}`}
              >
                {currentProject?._id === proj._id && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rotate-45 transform translate-x-6 -translate-y-6 flex items-end justify-center pb-1 border border-primary/20" />
                )}
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${currentProject?._id === proj._id ? 'text-primary' : ''}`}>
                    {proj.name}
                  </h3>
                  <span className="bg-emerald-400/10 text-emerald-400 text-xs px-2 py-0.5 rounded font-medium border border-emerald-400/20 capitalize">
                    {proj.environment || 'Production'}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-4 truncate text-ellipsis">API Key: {maskKey(proj)}</p>
                <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${currentProject?._id === proj._id ? 'text-primary' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                  {currentProject?._id === proj._id ? 'Current Active Project' : 'Switch to Project'} {currentProject?._id !== proj._id && <ArrowRight className="w-3 h-3" />}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Key Section */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Project API Key</h2>
              <p className="text-sm text-zinc-500">Use this key to initialize the DevPulse SDK in your application.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowRegenerateConfirm(!showRegenerateConfirm)}
            disabled={regenerateMutation.isPending}
            className="text-sm font-medium text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors p-2 hover:bg-rose-400/10 rounded-md disabled:opacity-50 w-full sm:w-auto"
          >
            {regenerateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {showRegenerateConfirm ? 'Cancel' : 'Regenerate Key'}
          </button>
        </div>
        
        {showRegenerateConfirm && (
          <div className="mb-4 bg-zinc-900/50 border border-rose-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-rose-400 mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-zinc-400 mb-4">Regenerating your API key will instantly invalidate the old key. Any applications currently using the old key will stop working until updated.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleRegenerate}
                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Yes, Regenerate Key
              </button>
              <button 
                onClick={() => setShowRegenerateConfirm(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4">
          <form className="relative flex-1 w-full" onSubmit={(e) => e.preventDefault()}>
            <input 
              type={showKey ? "text" : "password"}
              readOnly 
              value={showKey ? currentKey : maskKey(currentProject)}
              className="w-full bg-zinc-900 border border-border rounded-md pl-3 pr-20 py-2.5 text-sm font-mono text-zinc-300 focus:outline-none"
            />
            <button 
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {showKey ? 'Hide' : 'Reveal'}
            </button>
          </form>
          <button 
            onClick={handleCopy}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-border w-full sm:w-auto"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        
        <div className="mt-4 bg-amber-400/10 border border-amber-400/20 rounded-md p-3 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Keep this API key secret. Do not expose it in client-side code (like React or Vue) unless you have domain restrictions configured. It should ideally be used in your backend Node.js services.
          </p>
        </div>
      </div>

      {/* Team Management */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Team Members</h2>
              <p className="text-sm text-zinc-500">Manage who has access to this organization.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowInviteForm(!showInviteForm)}
            disabled={inviteMutation.isPending}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (showInviteForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Invite Member</>)}
          </button>
        </div>

        {showInviteForm && (
          <div className="mb-6 bg-zinc-900/50 border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button 
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50 w-full sm:w-auto"
            >
              {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        )}

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-5">User</div>
            <div className="col-span-4">Role</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          <div className="divide-y divide-border">
            {isLoadingMembers ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">No members found.</div>
            ) : (
              members.map((member: any) => (
                <div key={member._id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 p-4 items-start md:items-center">
                  <div className="md:col-span-5 flex items-center gap-3 w-full">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium border border-border shrink-0">
                      {member.name ? member.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="md:col-span-4 w-full flex items-center justify-between md:justify-start">
                    <span className="text-xs text-zinc-500 uppercase md:hidden mr-2">Role</span>
                    <select className="bg-zinc-900 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary" value={member.role || 'Member'} disabled>
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Member">Member</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 text-left md:text-right w-full">
                    <span className="text-sm font-medium text-zinc-500">{member.email === user?.email ? 'Current User' : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Audit Log Viewer */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Audit Log</h2>
            <p className="text-sm text-zinc-500">Track all organization actions and changes.</p>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-3">Resource</div>
            <div className="col-span-4 text-right">Time</div>
          </div>
          <div className="divide-y divide-border">
            {isLoadingAudit ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            ) : !auditData || (auditData as any).logs?.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No audit log entries yet.</div>
            ) : (
              ((auditData as any).logs || []).map((entry: any) => (
                <div key={entry._id} className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 items-start md:items-center text-sm border-b border-border md:border-b-0 last:border-b-0">
                  <div className="md:col-span-3 flex items-center gap-2 w-full">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium border border-border shrink-0">
                      {(entry.userId?.name || 'U').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-zinc-300 truncate font-medium">{entry.userId?.name || entry.userId?.email || 'Unknown'}</span>
                  </div>
                  <div className="md:col-span-2 w-full flex items-center justify-between md:justify-start">
                    <span className="text-xs text-zinc-500 uppercase md:hidden">Action</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      entry.action === 'created' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                      : entry.action === 'deleted' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20'
                      : entry.action === 'registered' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                      : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                    }`}>
                      {entry.action}
                    </span>
                  </div>
                  <div className="md:col-span-3 text-zinc-400 w-full flex items-center justify-between md:justify-start">
                    <span className="text-xs text-zinc-500 uppercase md:hidden">Resource</span>
                    <span className="truncate">
                      {entry.resource}
                      {entry.metadata && (
                        <span className="text-zinc-500 ml-1 text-xs">
                          ({entry.metadata.projectName || entry.metadata.ruleName || entry.metadata.email || ''})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="md:col-span-4 text-left md:text-right text-zinc-500 text-xs w-full flex items-center justify-between md:justify-end mt-1 md:mt-0">
                    <span className="text-xs text-zinc-500 uppercase md:hidden">Time</span>
                    <span>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
