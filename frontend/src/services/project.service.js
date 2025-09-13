import api from './api';

export const projectService = {
  async getAllProjects(params = {}) {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
  },

  async getMyProjects() {
    try {
      const response = await api.get('/projects/my-projects');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your projects');
    }
  },

  async getProjectById(id) {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch project details');
    }
  },

  async createProject(projectData) {
    try {
      const response = await api.post('/projects', projectData);
      console.log('Create project response:', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create project');
    }
  },

  async updateProject(id, projectData) {
    try {
      console.log('Updating project with ID:', id, projectData);
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update project');
    }
  },

  async deleteProject(id) {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete project');
    }
  },

  async uploadDocuments(projectId, files) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });

      const response = await api.post(`/projects/${projectId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload documents');
    }
  },

  async submitMRVData(projectId, mrvData) {
    try {
      const response = await api.post(`/projects/${projectId}/mrv-data`, mrvData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit MRV data');
    }
  }
};