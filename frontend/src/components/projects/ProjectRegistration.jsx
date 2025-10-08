import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  Upload, 
  MapPin, 
  Calendar, 
  FileText,
  AlertCircle,
  Plus,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjects } from '../../hooks/useProjects';
import { validation } from '../../utils/validation';
import { PROJECT_TYPES, COUNTRIES, INDIAN_STATES } from '../../utils/constants';

const ProjectRegistration = () => {
  const navigate = useNavigate();
  const { createProject } = useProjects();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    location: {
      country: 'India',
      state: '',
      address:'',
      coordinates: {
        latitude: '',
        longitude: ''
      }
    },
    projectDetails: {
      startDate: '',
      endDate: '',
      expectedCredits: '',
      methodology: '',
      baseline: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [documents, setDocuments] = useState([]);

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Project name and description' },
    { id: 2, title: 'Project Details', description: 'Technical specifications' },
    { id: 3, title: 'Location', description: 'Geographic information' },
    { id: 4, title: 'Documentation', description: 'Upload supporting files' }
  ];

  const handleInputChange = (field, value) => {
    const fieldPath = field.split('.');
    if (fieldPath.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (fieldPath.length === 2) {
      setFormData(prev => ({
        ...prev,
        [fieldPath[0]]: {
          ...prev[fieldPath[0]],
          [fieldPath[1]]: value
        }
      }));
    } else if (fieldPath.length === 3) {
      setFormData(prev => ({
        ...prev,
        [fieldPath[0]]: {
          ...prev[fieldPath[0]],
          [fieldPath[1]]: {
            ...prev[fieldPath[0]][fieldPath[1]],
            [fieldPath[2]]: value
          }
        }
      }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const stepErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) stepErrors.name = 'Project name is required';
        if (!formData.description.trim()) stepErrors.description = 'Description is required';
        if (!formData.type) stepErrors.type = 'Project type is required';
        break;
        
      case 2:
        if (!formData.projectDetails.startDate) stepErrors['projectDetails.startDate'] = 'Start date is required';
        if (!formData.projectDetails.endDate) stepErrors['projectDetails.endDate'] = 'End date is required';
        if (!formData.projectDetails.expectedCredits) stepErrors['projectDetails.expectedCredits'] = 'Expected credits is required';
        if (!formData.projectDetails.methodology) stepErrors['projectDetails.methodology'] = 'Methodology is required';
        if (!formData.projectDetails.baseline) stepErrors['projectDetails.baseline'] = 'Baseline is required';
        
        // Validate date range
        if (formData.projectDetails.startDate && formData.projectDetails.endDate) {
          if (new Date(formData.projectDetails.startDate) >= new Date(formData.projectDetails.endDate)) {
            stepErrors['projectDetails.endDate'] = 'End date must be after start date';
          }
        }
        break;
        
      case 3:
        if (!formData.location.state) stepErrors['location.state'] = 'State is required';
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    
    try {
      const response = await createProject(formData);
      
      if (response.success) {
        toast.success('Project created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Create project error:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter project name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select project type</option>
                {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your project..."
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.projectDetails.startDate}
                  onChange={(e) => handleInputChange('projectDetails.startDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['projectDetails.startDate'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['projectDetails.startDate'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['projectDetails.startDate']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.projectDetails.endDate}
                  onChange={(e) => handleInputChange('projectDetails.endDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['projectDetails.endDate'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors['projectDetails.endDate'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['projectDetails.endDate']}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Carbon Credits *
              </label>
              <input
                type="number"
                min="1"
                value={formData.projectDetails.expectedCredits}
                onChange={(e) => handleInputChange('projectDetails.expectedCredits', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors['projectDetails.expectedCredits'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter expected credits"
              />
              {errors['projectDetails.expectedCredits'] && (
                <p className="text-red-500 text-sm mt-1">{errors['projectDetails.expectedCredits']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Methodology *
              </label>
              <input
                type="text"
                value={formData.projectDetails.methodology}
                onChange={(e) => handleInputChange('projectDetails.methodology', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors['projectDetails.methodology'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter methodology"
              />
              {errors['projectDetails.methodology'] && (
                <p className="text-red-500 text-sm mt-1">{errors['projectDetails.methodology']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baseline *
              </label>
              <textarea
                rows={3}
                value={formData.projectDetails.baseline}
                onChange={(e) => handleInputChange('projectDetails.baseline', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors['projectDetails.baseline'] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the baseline scenario"
              />
              {errors['projectDetails.baseline'] && (
                <p className="text-red-500 text-sm mt-1">{errors['projectDetails.baseline']}</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  value={formData.location.country}
                  onChange={(e) => handleInputChange('location.country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <select
                  value={formData.location.state}
                  onChange={(e) => handleInputChange('location.state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['location.state'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors['location.state'] && (
                  <p className="text-red-500 text-sm mt-1">{errors['location.state']}</p>
                )}
              </div>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={formData.location.address}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                rows="3"
                placeholder="Enter complete address"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors['location.address'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['location.address'] && (
                <p className="text-red-500 text-sm mt-1">{errors['location.address']}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude 
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.latitude}
                  onChange={(e) => handleInputChange('location.coordinates.latitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 12.9716"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude 
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.location.coordinates.longitude}
                  onChange={(e) => handleInputChange('location.coordinates.longitude', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 77.5946"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Documentation</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Upload project documentation</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Select Files
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, CSV, XLSX (Max 50MB each)
              </p>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Files:</h4>
                {documents.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Progress Steps */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= step.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.id}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 border rounded-lg font-medium ${
                  currentStep === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectRegistration;