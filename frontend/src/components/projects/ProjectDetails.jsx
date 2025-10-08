import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Calendar, Award, FileText, Download,
  Edit, Send, CheckCircle, XCircle, Clock, Upload,
  Database, Eye, X, DollarSign, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectService } from '../../services/project.service';
import { creditClaimService } from '../../services/creditClaim.service';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatNumber } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectClaims, setProjectClaims] = useState([]);
  
  // Claim form state
  const [claimForm, setClaimForm] = useState({
    creditsRequested: '',
    reportingPeriod: {
      startDate: '',
      endDate: ''
    }
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchProjectClaims();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await projectService.getProjectById(id);
      if (response.success) {
        setProject(response.project);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    } catch (error) {
      console.error('Fetch project error:', error);
      toast.error('Failed to load project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectClaims = async () => {
    try {
      const response = await creditClaimService.getMyClaims();
      if (response.success) {
        const claims = response.claims.filter(claim => claim.project._id === id);
        setProjectClaims(claims);
      }
    } catch (error) {
      console.error('Fetch claims error:', error);
    }
  };

  const handleSubmitForVerification = async () => {
    try {
      setSubmitting(true);
      const response = await projectService.updateProject(id, { status: 'submitted' });
      if (response.success) {
        setProject(response.project);
        setShowSubmitModal(false);
        toast.success('Project submitted for verification successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaimCredits = async () => {
    try {
      if (!claimForm.creditsRequested || !claimForm.reportingPeriod.startDate || !claimForm.reportingPeriod.endDate) {
        toast.error('Please fill all required fields');
        return;
      }

      const creditsRequested = parseFloat(claimForm.creditsRequested);
      if (creditsRequested <= 0) {
        toast.error('Credits requested must be greater than zero');
        return;
      }

      if (creditsRequested > project.projectDetails.expectedCredits) {
        toast.error('Credits requested cannot exceed expected credits');
        return;
      }

      setSubmitting(true);
      
      // Get MRV data references
      const mrvDataRefs = project.mrvData?.map(mrv => mrv.ipfsHash).filter(Boolean) || [];
      
      const claimData = {
        projectId: id,
        creditsRequested,
        reportingPeriod: claimForm.reportingPeriod,
        mrvDataRefs
      };

      const response = await creditClaimService.createClaim(claimData);
      
      if (response.success) {
        toast.success('Credit claim submitted successfully!');
        setShowClaimModal(false);
        setClaimForm({
          creditsRequested: '',
          reportingPeriod: { startDate: '', endDate: '' }
        });
        // Refresh claims
        fetchProjectClaims();
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit credit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMRVData = (mrvData) => {
    if (!mrvData || !mrvData.files || mrvData.files.length === 0) {
      alert("No files available for this MRV submission.");
      return;
    }

    const ipfsGateway = "https://ipfs.io/ipfs/";
    mrvData.files.forEach((fileCid) => {
      const fileUrl = `${ipfsGateway}${fileCid}`;
      window.open(fileUrl, "_blank");
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, text: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Send, text: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
      active: { color: 'bg-purple-100 text-purple-800', icon: Award, text: 'Active' },
      completed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.text}
      </div>
    );
  };

  const getTypeDisplay = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if there's an approved claim
  const hasApprovedClaim = projectClaims.some(claim => claim.status === 'approved');
  
  // Check if there's a pending claim
  const hasPendingClaim = projectClaims.some(claim => 
    ['pending', 'under_review', 'inspection_scheduled', 'inspection_completed'].includes(claim.status)
  );

  if (loading) {
    return <LoadingSpinner text="Loading project details..." />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  const userId = user?._id;
  const developerId = project?.developer?._id;
  const isOwner = userId === developerId;

  const canEdit = isOwner && project.status === 'draft';
  const canSubmit = isOwner && project.status === 'draft';
  const canUploadMRV = isOwner && project.status === 'approved' && !hasApprovedClaim;
  const canClaimCredits = isOwner && project.status === 'approved' && project.mrvData?.length > 0 && !hasPendingClaim && !hasApprovedClaim;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div className="flex gap-3">
            {canEdit && (
              <button
                onClick={() => navigate(`/projects/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            
            {canSubmit && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                Submit for Verification
              </button>
            )}

            {canUploadMRV && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/projects/${id}/mrv-data`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Database className="h-4 w-4" />
                Upload MRV Data
              </motion.button>
            )}

            {canClaimCredits && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowClaimModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <DollarSign className="h-4 w-4" />
                Claim Credits
              </motion.button>
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600">{getTypeDisplay(project.type)}</p>
            </div>
            {getStatusBadge(project.status)}
          </div>

          {/* Show approved claim completion message */}
          {hasApprovedClaim && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Credits Claimed Successfully!</p>
                  <p className="text-green-700 text-sm">
                    Your credit claim has been approved and credits have been issued. This project is now completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show pending claim message */}
          {hasPendingClaim && !hasApprovedClaim && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Credit Claim In Progress</p>
                  <p className="text-yellow-700 text-sm">
                    Your credit claim is being processed. You cannot submit another claim until this one is completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show approved status message */}
          {project.status === 'approved' && !hasApprovedClaim && !hasPendingClaim && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Project Approved!</p>
                  <p className="text-green-700 text-sm">
                    Your project has been approved. Upload MRV data and claim credits when ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show MRV data requirement for claiming */}
          {project.status === 'approved' && (!project.mrvData || project.mrvData.length === 0) && !hasApprovedClaim && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-medium">MRV Data Required</p>
                  <p className="text-blue-700 text-sm">
                    Upload MRV data before claiming credits.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-700 mb-6">{project.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{project.location.address}</p>
                <p className="font-medium">{project.location.state}, {project.location.country}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
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
          </div>
        </div>

        {/* Claims History Section */}
        {projectClaims.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Claims History</h3>
            <div className="space-y-3">
              {projectClaims.map((claim, index) => (
                <div
                  key={claim._id}
                  className={`p-4 rounded-lg border ${
                    claim.status === 'approved' ? 'bg-green-50 border-green-200' :
                    claim.status === 'rejected' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        Claim #{claim.claimId}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(claim.claimDetails.creditsRequested)} tCO₂ requested
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                      claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {claim.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  {claim.status === 'approved' && claim.creditIssuance?.approvedCredits && (
                    <div className="bg-green-100 border border-green-200 rounded p-2 mt-2">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ {formatNumber(claim.creditIssuance.approvedCredits)} credits issued
                      </p>
                      <p className="text-xs text-green-700">
                        Issued on: {formatDate(claim.creditIssuance.issuedAt)}
                      </p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted: {formatDate(claim.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Methodology</p>
                <p className="text-gray-900">{project.projectDetails.methodology}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Baseline</p>
                <p className="text-gray-900">{project.projectDetails.baseline}</p>
              </div>
              {project.location.coordinates?.latitude && project.location.coordinates?.longitude && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                  <p className="text-gray-900">
                    {project.location.coordinates.latitude}, {project.location.coordinates.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Project ID</p>
                <p className="text-gray-900 font-mono">{project.projectId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Developer</p>
                <p className="text-gray-900">{project.developer.name}</p>
                <p className="text-sm text-gray-600">{project.developer.organization}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-gray-900">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-gray-900">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* MRV Data Section */}
        {project.status === 'approved' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">MRV Data</h3>
            </div>

            {project.mrvData && project.mrvData.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Recent MRV submissions:</p>

                {project.mrvData.slice(0, 5).map((mrv, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {mrv.reportName || `Report ${index + 1}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          Uploaded on {formatDate(mrv.uploadedAt)}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-2">
                        {mrv.description || "No description provided."}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Files:</p>
                          <p className="text-blue-700 font-medium">
                            {mrv.files?.length > 0
                              ? `${mrv.files.length} file${mrv.files.length > 1 ? "s" : ""}`
                              : "No files"}
                          </p>
                        </div>
                      </div>

                      {mrv.ipfsHash && (
                        <p className="text-xs text-gray-500 mt-2">
                          IPFS Metadata:{" "}
                          <a
                            href={`https://ipfs.io/ipfs/${mrv.ipfsHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {mrv.ipfsHash.slice(0, 15)}...
                          </a>
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleViewMRVData(mrv)}
                      className="ml-4 flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                ))}

                {project.mrvData.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => navigate(`/projects/${id}/mrv-data`)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {project.mrvData.length} MRV submissions →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No MRV data uploaded yet</p>
                {canUploadMRV && (
                  <button
                    onClick={() => navigate(`/projects/${id}/mrv-data`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Database className="h-4 w-4" />
                    Upload MRV Data
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verification Status */}
        {project.verification && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-4">
              {project.verification.submittedAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submitted for Verification</p>
                  <p className="text-gray-900">{formatDate(project.verification.submittedAt)}</p>
                </div>
              )}
              
              {project.verification.reviewedBy && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reviewed by</p>
                  <p className="text-gray-900">{project.verification.reviewedBy.name}</p>
                  <p className="text-sm text-gray-600">{project.verification.reviewedBy.organization}</p>
                </div>
              )}
              
              {project.verification.reviewedAt && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Review Date</p>
                  <p className="text-gray-900">{formatDate(project.verification.reviewedAt)}</p>
                </div>
              )}
              
              {project.verification.comments && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Comments</p>
                  <div className={`p-3 rounded-lg ${
                    project.status === 'rejected' ? 'bg-red-50 border border-red-200' : 
                    project.status === 'approved' ? 'bg-green-50 border border-green-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={
                      project.status === 'rejected' ? 'text-red-800' : 
                      project.status === 'approved' ? 'text-green-800' :
                      'text-blue-800'
                    }>
                      {project.verification.comments}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Project for Verification"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to submit this project for verification? Once submitted, you won't be able to edit the project details.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• Regulatory bodies will review your project</li>
              <li>• You'll receive updates via email</li>
              <li>• The review process typically takes 5-10 business days</li>
            </ul>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitForVerification}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Claim Credits Modal */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Claim Carbon Credits"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-800 text-sm font-medium">
              Submit a claim for carbon credits based on your MRV data
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits Requested (tCO₂) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={claimForm.creditsRequested}
              onChange={(e) => setClaimForm({ ...claimForm, creditsRequested: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter credits to claim"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expected credits: {formatNumber(project.projectDetails.expectedCredits)} tCO₂
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Period Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={claimForm.reportingPeriod.startDate}
                onChange={(e) => setClaimForm({ 
                  ...claimForm, 
                  reportingPeriod: { ...claimForm.reportingPeriod, startDate: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Period End <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={claimForm.reportingPeriod.endDate}
                onChange={(e) => setClaimForm({ 
                  ...claimForm, 
                  reportingPeriod: { ...claimForm.reportingPeriod, endDate: e.target.value }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>MRV Data:</strong> {project.mrvData?.length || 0} submissions will be included with this claim
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Once submitted, your claim will be reviewed by regulatory bodies. 
              An inspection may be scheduled before credits are issued.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClaimModal(false)}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClaimCredits}
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetails;