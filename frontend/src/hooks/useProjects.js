import { useProjectContext } from '../context/ProjectContext';

export const useProjects = () => {
  return useProjectContext();
};