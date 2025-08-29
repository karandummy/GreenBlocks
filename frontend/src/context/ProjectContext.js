import React, { createContext, useContext, useState } from 'react';
import { projectService } from '../services/project.service';

const ProjectContext = createContext();

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async (params = {}) => {
    try {
      setLoading(true);
      const response = await projectService.getAllProjects(params);
      setProjects(response.projects || []);
      return response;
    } catch (error) {
      console.error('Fetch projects error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getMyProjects();
      setProjects(response.projects || []);
      return response;
    } catch (error) {
      console.error('Fetch my projects error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData) => {
    try {
      const response = await projectService.createProject(projectData);
      if (response.success) {
        setProjects(prev => [response.project, ...prev]);
      }
      return response;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      const response = await projectService.updateProject(id, projectData);
      if (response.success) {
        setProjects(prev => 
          prev.map(project => 
            project._id === id ? response.project : project
          )
        );
      }
      return response;
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      const response = await projectService.deleteProject(id);
      if (response.success) {
        setProjects(prev => prev.filter(project => project._id !== id));
      }
      return response;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  };

  const value = {
    projects,
    loading,
    fetchProjects,
    fetchMyProjects,
    createProject,
    updateProject,
    deleteProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};