import { Rocket, CheckCircle2, AlertTriangle, GitBranch, Loader2, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrentProject } from '../../hooks/useCurrentProject';

export const DeploymentsTimeline = () => {
  const { data: project } = useCurrentProject();
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [deploymentVersion, setDeploymentVersion] = useState('');
  const [deploymentEnvironment, setDeploymentEnvironment] = useState('production');
  
  const { data: deploymentsData, isLoading } = useQuery({
    queryKey: ['deployments', project?._id],
    queryFn: async () => await api(`/deployments/${project?._id}`),
    enabled: !!project?._id,
  });

  const queryClient = useQueryClient();

  const createDeploymentMutation = useMutation({
    mutationFn: async (version: string) => await api(`/deployments/${project?._id}`, {
      method: 'POST',
      data: { version, environment: deploymentEnvironment }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments', project?._id] });
      setShowDeploymentForm(false);
      setDeploymentVersion('');
    }
  });

  const handleRegisterDeployment = () => {
    if (deploymentVersion) {
      createDeploymentMutation.mutate(deploymentVersion);
    }
  };
  
  const deployments = (deploymentsData as any)?.deployments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
          <p className="text-sm text-zinc-500 mt-1">Track version history and post-deployment health</p>
        </div>
        <button 
          onClick={() => setShowDeploymentForm(!showDeploymentForm)}
          disabled={createDeploymentMutation.isPending}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 w-full sm:w-auto"
        >
          {showDeploymentForm ? 'Cancel' : <><Rocket className="w-4 h-4" /> Register Deployment</>}
        </button>
      </div>

      {showDeploymentForm && (
        <div className="mb-6 bg-zinc-900/50 border border-border rounded-lg p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-end ml-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Deployment Version</label>
            <input 
              type="text" 
              value={deploymentVersion}
              onChange={(e) => setDeploymentVersion(e.target.value)}
              placeholder="e.g., v1.0.2"
              className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Environment</label>
            <select 
              value={deploymentEnvironment}
              onChange={(e) => setDeploymentEnvironment(e.target.value)}
              className="w-full bg-zinc-900 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          <button 
            onClick={handleRegisterDeployment}
            disabled={createDeploymentMutation.isPending || !deploymentVersion.trim()}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50"
          >
            {createDeploymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
          </button>
        </div>
      )}

      <div className="relative border-l border-border ml-4 space-y-8 pl-8 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="text-zinc-500 py-8">No deployments registered yet.</div>
        ) : (
          deployments.map((deployment: any, index: number) => {
            const isRegression = deployment.healthScore < 90;
            const previousDeployment = deployments[index + 1];
            
            const beforeErrors = deployment.beforeErrors || 0;
            const afterErrors = deployment.afterErrors || 0;
            const regressionPercentage = beforeErrors > 0 ? ((afterErrors - beforeErrors) / beforeErrors * 100).toFixed(0) : 0;
            
            return (
            <motion.div 
              key={deployment._id || deployment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">{deployment.version}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                      deployment.status === 'success' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-rose-400 bg-rose-400/10 border-rose-400/20'
                    }`}>
                      {deployment.status === 'success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {deployment.status}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">{new Date(deployment.createdAt || deployment.date).toLocaleDateString()}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 rounded-lg p-3 border border-border">
                    <div className="text-xs text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      Health Score
                    </div>
                    <div className={`text-xl font-bold ${isRegression ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {deployment.healthScore}%
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-3 border border-border flex flex-col justify-center">
                    <div className="text-xs text-zinc-500 font-medium mb-2 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      Environment
                    </div>
                    <div className="text-sm font-medium capitalize text-zinc-300">
                      {deployment.environment}
                    </div>
                  </div>
                </div>

                {previousDeployment && (
                  <div className="mt-4 bg-zinc-900/30 rounded-lg p-4 border border-border">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Deployment Comparison</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Before ({previousDeployment.version})</div>
                        <div className="text-sm font-medium">Errors: <span className="font-mono text-zinc-300">{beforeErrors}</span></div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">After ({deployment.version})</div>
                        <div className="text-sm font-medium">Errors: <span className="font-mono text-zinc-300">{afterErrors}</span></div>
                      </div>
                      <div className="border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                        <div className="text-xs text-zinc-500 mb-1">Regression</div>
                        <div className={`text-sm font-bold flex items-center gap-1 ${Number(regressionPercentage) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {Number(regressionPercentage) > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4" />
                              +{regressionPercentage}%
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4" />
                              {regressionPercentage}%
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )})
        )}
      </div>
    </div>
  );
};
