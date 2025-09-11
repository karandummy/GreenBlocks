import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  FileText,
  Calendar,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectService } from '../../services/project.service';
import { formatDate } from '../../utils/helpers';

const MRVDataSubmission = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reportingPeriod: {
      startDate: '',
      endDate: ''
    },
    measurements: [{
      parameter: '',
      value: '',
      unit: '',
      measurementDate: '',
      methodology: '',
      equipment: '',
      accuracy: ''
    }],
    emissionReductions: {
      baseline: '',
      actual: '',
      reduction: '',
      methodology: ''
    },
    documentation: []
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await projectService.getProjectById(projectId);
      if (response.success) {
        setProject(response.project);
        // Initialize reporting period with project dates
        setFormData(prev => ({
          ...prev,
          reportingPeriod: {
            startDate: response.project.projectDetails.startDate.split('T')[0],
            endDate: response.project.projectDetails.endDate.split('T')[0]
          }
        }));
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value, index = null) => {
    setFormData(prev => {
      if (section === 'measurements' && index !== null) {
        const updatedMeasurements = [...prev.measurements];
        updatedMeasurements[index] = {
          ...updatedMeasurements[index],
          [field]: value
        };
        return { ...prev, measurements: updatedMeasurements };
      } else if (section && field) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      } else {
        return { ...prev, [section]: value };
      }
    });
  };

  const addMeasurement = () => {
    setFormData(prev => ({
      ...prev,
      measurements: [
        ...prev.measurements,
        {
          parameter: '',
          value: '',
          unit: '',
          measurementDate: '',
          methodology: '',
          equipment: '',
          accuracy: ''
        }
      ]
    }));
  };

  const removeMeasurement = (index) => {
    setFormData(prev => ({
      ...prev,
      measurements: prev.measurements.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => ({
      ...prev,
      documentation: [...prev.documentation, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      documentation: prev.documentation.filter((_, i) => i !== index)
    }));
  };

  const calculateReduction = () => {
    const baseline = parseFloat(formData.emissionReductions.baseline) || 0;
    const actual = parseFloat(formData.emissionReductions.actual) || 0;
    const reduction = Math.max(0, baseline - actual);
    
    handleInputChange('emissionReductions', 'reduction', reduction.toString());
  };

  const validateForm = () => {
    if (!formData.reportingPeriod.startDate || !formData.reportingPeriod.endDate) {
      toast.error('Please provide reporting period dates');
      return false;
    }

    if (formData.measurements.length === 0) {
      toast.error('At least one measurement is required');
      return false;
    }

    for (let i = 0; i < formData.measurements.length; i++) {
      const measurement = formData.measurements[i];
      if (!measurement.parameter || !measurement.value || !measurement.unit || !measurement.measurementDate) {
        toast.error(`Please fill in all required fields for measurement ${i + 1}`);
        return false;
      }
    }

    if (!formData.emissionReductions.baseline || !formData.emissionReductions.actual || !formData.emissionReductions.methodology) {
      toast.error('Please fill in all emission reduction fields');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const response = await projectService.submitMRVData(projectId, formData);
      if (response.success) {
        toast.success('MRV data submitted successfully!');
        navigate(`/projects/${projectId}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit MRV data');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">Submit MRV Data</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporting Period */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reporting Period</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.reportingPeriod.startDate}
                  onChange={(e) => handleInputChange('reportingPeriod', 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.reportingPeriod.endDate}
                  onChange={(e) => handleInputChange('reportingPeriod', 'endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Measurements</h3>
              </div>
              <button
                type="button"
                onClick={addMeasurement}
                className="flex items-center gap-2 px-3 py-1 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Measurement
              </button>
            </div>

            <div className="space-y-6">
              {formData.measurements.map((measurement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Measurement {index + 1}</h4>
                    {formData.measurements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMeasurement(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parameter *
                      </label>
                      <input
                        type="text"
                        value={measurement.parameter}
                        onChange={(e) => handleInputChange('measurements', 'parameter', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., Energy Generation"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={measurement.value}
                        onChange={(e) => handleInputChange('measurements', 'value', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={measurement.unit}
                        onChange={(e) => handleInputChange('measurements', 'unit', e.target.value, index)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., kWh, tCO2"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Measurement Date *
                      </label>
                      <input
                        type="date"
                        value={measurement.measurementDate}
                        onChange={(e) => handleInputChange('measurements', 'measurementDate', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment (Optional)
                      </label>
                      <input
                        type="text"
                        value={measurement.equipment}
                        onChange={(e) => handleInputChange('measurements', 'equipment', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., Smart Meter Model X"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Methodology (Optional)
                      </label>
                      <input
                        type="text"
                        value={measurement.methodology}
                        onChange={(e) => handleInputChange('measurements', 'methodology', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Measurement methodology"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Accuracy (Optional)
                      </label>
                      <input
                        type="text"
                        value={measurement.accuracy}
                        onChange={(e) => handleInputChange('measurements', 'accuracy', e.target.value, index)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., ±2%"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Emission Reductions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Emission Reductions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Baseline Emissions (tCO₂) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.emissionReductions.baseline}
                  onChange={(e) => {
                    handleInputChange('emissionReductions', 'baseline', e.target.value);
                    setTimeout(calculateReduction, 100);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Emissions (tCO₂) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.emissionReductions.actual}
                  onChange={(e) => {
                    handleInputChange('emissionReductions', 'actual', e.target.value);
                    setTimeout(calculateReduction, 100);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emission Reduction (tCO₂)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.emissionReductions.reduction}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Methodology *
              </label>
              <textarea
                rows={3}
                value={formData.emissionReductions.methodology}
                onChange={(e) => handleInputChange('emissionReductions', 'methodology', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe the methodology used for calculating emission reductions..."
                required
              />
            </div>
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Supporting Documentation</h3>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Upload supporting documents</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
                id="mrv-file-upload"
              />
              <label
                htmlFor="mrv-file-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Select Files
              </label>
            </div>

            {formData.documentation.length > 0 && (
              <div className="space-y-2">
                {formData.documentation.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit MRV Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MRVDataSubmission;