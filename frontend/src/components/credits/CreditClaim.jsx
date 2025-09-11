import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Award, 
  Calendar, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Coins
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectService } from '../../services/project.service';
import { creditService } from '../../services/credit.service';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatNumber } from '../../utils/helpers';

const CreditClaim = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimData, setClaimData] = useState({
    amount: '',
    vintage: new Date().getFullYear(),
    justification: ''
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await projectService.getProjectById(projectId);
      if (response.success) {
        setProject(response.project);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setClaimData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateClaim = () => {
    if (!claimData.amount || parseFloat(claimData.amount) <= 0) {
      toast.error('Please enter a valid credit amount');
      return false;
    }

    if (parseFloat(claimData.amount) > project.projectDetails.expectedCredits) {
      toast.error('Cannot claim more credits than expected for this project');
      return false;
    }

    if (!claimData.vintage || claimData.vintage < 2020 || claimData.vintage > new Date().getFullYear() + 1) {
      toast.error('Please enter a valid vintage year');
      return false;
    }

    if (!claimData.justification.trim()) {
      toast.error('Please provide justification for this credit claim');
      return false;
    }

    return true;
  };

  const handleClaimCredits = async () => {
    if (!validateClaim()) return;

    setClaiming(true);

    try {
      const response = await creditService.claimCredits({
        projectId: project._id,
        amount: parseFloat(claimData.amount),
        vintage: parseInt(claimData.vintage),
        justification: claimData.justification
      });

      if (response.success) {
        toast.success('Carbon credits claimed successfully!');
        navigate('/credits');
      } else {
        toast.error(response.message || 'Failed to claim credits');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to claim credits');
    } finally {
      setClaiming(false);
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

  const canClaim = project.status === 'approved' && project.developer._id === user._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Claim Carbon Credits</h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Project Type</p>
                <p className="font-medium">{project.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Project Duration</p>
                <p className="font-medium">
                  {formatDate(project.projectDetails.startDate)} - {formatDate(project.projectDetails.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Expected Credits</p>
                <p className="font-medium">{formatNumber(project.projectDetails.expectedCredits)} tCO₂</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-green-600">Approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Claim Form */}
        {canClaim ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Claim Credits</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Amount (tCO₂) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={project.projectDetails.expectedCredits}
                    step="0.001"
                    value={claimData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter credit amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {formatNumber(project.projectDetails.expectedCredits)} tCO₂
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vintage Year *
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max={new Date().getFullYear() + 1}
                    value={claimData.vintage}
                    onChange={(e) => handleInputChange('vintage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Year when emission reductions occurred
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification *
                </label>
                <textarea
                  rows={4}
                  value={claimData.justification}
                  onChange={(e) => handleInputChange('justification', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Provide justification for this credit claim, including methodology and evidence..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-blue-900 font-medium mb-1">Credit Claim Requirements</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                      <li>• Project must be approved by regulatory authorities</li>
                      <li>• MRV (Monitoring, Reporting, Verification) data must be submitted</li>
                      <li>• Credits can only be claimed based on verified emission reductions</li>
                      <li>• Each credit represents 1 tonne of CO₂ equivalent</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleClaimCredits}
                  disabled={claiming}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Coins className="h-4 w-4" />
                  )}
                  {claiming ? 'Claiming...' : 'Claim Credits'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Cannot Claim Credits</h3>
            <p className="text-yellow-800">
              {project.status !== 'approved' 
                ? 'Project must be approved before credits can be claimed.'
                : 'Only the project developer can claim credits for this project.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditClaim;