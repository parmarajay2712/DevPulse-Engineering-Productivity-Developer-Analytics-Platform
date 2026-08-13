import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAuthToken } from '../services/api';
import { useCallback } from 'react';

const SELECTED_PROJECT_KEY = 'devpulse_selected_project_id';

export const useCurrentProject = () => {
  const token = getAuthToken();
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const projects: any[] = await api('/projects');
      return projects;
    },
    enabled: !!token
  });

  const selectedProjectIdQuery = useQuery({
    queryKey: ['selectedProjectId'],
    queryFn: () => localStorage.getItem(SELECTED_PROJECT_KEY),
    initialData: () => localStorage.getItem(SELECTED_PROJECT_KEY),
  });

  const projects = projectsQuery.data || [];
  const savedId = selectedProjectIdQuery.data;
  
  let currentProject = null;
  if (projects.length > 0) {
    currentProject = projects.find((p: any) => p._id === savedId) || projects[0];
    
    // Auto-save if falling back to the first project
    if (!savedId && currentProject) {
      localStorage.setItem(SELECTED_PROJECT_KEY, currentProject._id);
      setTimeout(() => {
        queryClient.setQueryData(['selectedProjectId'], currentProject._id);
      }, 0);
    }
  }

  const setProject = useCallback((projectId: string) => {
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    queryClient.setQueryData(['selectedProjectId'], projectId);
  }, [queryClient]);

  return {
    data: currentProject,
    projects,
    setProject,
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
  };
};
