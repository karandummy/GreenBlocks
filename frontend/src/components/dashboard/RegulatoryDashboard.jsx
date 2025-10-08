import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileCheck, Clock, AlertTriangle, CheckCircle, Eye, Calendar,
  MapPin, User, Award, TrendingUp, XCircle, DollarSign, Database
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { projectService } from '../../services/project.service';
import { creditClaimService } from '../../services/creditClaim.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';
import Modal from '../common/Modal';

const RegulatoryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedProjects: 0,
    rejectedProjects: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    totalInspections: 0
  });
  const [pendingProjects, setPendingProjects] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showCompleteInspectionModal, setShowCompleteInspectionModal] = useState(false);
  const [showIssueCreditsModal, setShowIssueCreditsModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionFindings, setInspectionFindings] = useState('');
  const [inspectionResult, setInspectionResult] = useState('passed');
  const [approvedCredits, setApprovedCredits] = useState('');
  const [issueComments, setIssueComments] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsResponse = await projectService.getAllProjects();
      if (projectsResponse.success) {
        const allProjects = projectsResponse.projects || [];
        
        const pendingReviews = allProjects.filter(p => ['submitted', 'under_review'].includes(p.status)).length;
        const approvedProjectsList = allProjects.filter(p => p.status === 'approved');
        const rejectedProjects = allProjects.filter(p => p.status === 'rejected').length;
        
        setPendingProjects(
          allProjects
            .filter(p => ['submitted', 'under_review'].includes(p.status))
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        );
        
        setApprovedProjects(approvedProjectsList);

        // Fetch claims
        const claimsResponse = await creditClaimService.getAllClaims();
        if (claimsResponse.success) {
          const allClaimsData = claimsResponse.claims || [];
          setAllClaims(allClaimsData);
          
          const pendingClaimsList = allClaimsData.filter(c => 
            ['pending', 'under_review', 'inspection_scheduled', 'inspection_completed'].includes(c.status)
          );
          const approvedClaimsList = allClaimsData.filter(c => c.status === 'approved');
          
          setPendingClaims(pendingClaimsList);
          
          setStats({
            pendingReviews,
            approvedProjects: approvedProjectsList.length,
            rejectedProjects,
            pendingClaims: pendingClaimsList.length,
            approvedClaims: approvedClaimsList.length,
            totalInspections: allClaimsData.filter(c => c.inspection?.completedDate).length
          });
        }
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!inspectionDate) {
      toast.error('Please select an inspection date');
      return;
    }

    try {
      setActionLoading(true);
      const response = await creditClaimService.scheduleInspection(selectedClaim._id, {
        inspectionDate
      });
      
      if (response.success) {
        toast.success('Inspection scheduled successfully!');
        setShowInspectionModal(false);
        setInspectionDate('');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to schedule inspection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteInspection = async () => {
    if (!inspectionFindings) {
      toast.error('Please provide inspection findings');
      return;
    }

    try {
      setActionLoading(true);
      const response = await creditClaimService.completeInspection(selectedClaim._id, {
        findings: inspectionFindings,
        inspectionResult
      });
      
      if (response.success) {
        toast.success('Inspection completed successfully!');
        setShowCompleteInspectionModal(false);
        setInspectionFindings('');
        setInspectionResult('passed');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to complete inspection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCredits = async () => {
    if (!approvedCredits) {
      toast.error('Please enter the number of credits to issue');
      return;
    }

    try {
      setActionLoading(true);
      const response = await creditClaimService.issueCredits(selectedClaim._id, {
        approvedCredits: parseFloat(approvedCredits),
        comments: issueComments,

      });
      
      if (response.success) {
        toast.success('Credits issued successfully!');
        setShowIssueCreditsModal(false);
        setApprovedCredits('');
        setIssueComments('');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to issue credits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewProjectMRV = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const getProjectApprovedClaims = (projectId) => {
    return allClaims.filter(c => c.project?._id === projectId && c.status === 'approved');
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const getClaimStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: Eye, text: 'Under Review' },
      inspection_scheduled: { color: 'bg-purple-100 text-purple-800', icon: Calendar, text: 'Inspection Scheduled' },
      inspection_completed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: 'Inspection Done' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Regulatory Dashboard
          </h1>
          <p className="text-gray-600">Review projects, manage claims, and issue carbon credits</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={Clock}
            color="bg-orange-500"
            onClick={() => navigate('/verification/pending')}
          />
          <StatCard
            title="Approved Projects"
            value={stats.approvedProjects}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Pending Claims"
            value={stats.pendingClaims}
            icon={DollarSign}
            color="bg-purple-500"
          />
          <StatCard
            title="Approved Claims"
            value={stats.approvedClaims}
            icon={Award}
            color="bg-blue-500"
          />
          <StatCard
            title="Inspections"
            value={stats.totalInspections}
            icon={FileCheck}
            color="bg-indigo-500"
          />
          <StatCard
            title="Rejected"
            value={stats.rejectedProjects}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/verification/pending')}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Clock className="h-5 w-5" />
            Review Projects ({stats.pendingReviews})
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <DollarSign className="h-5 w-5" />
            Review Claims ({stats.pendingClaims})
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pending Claims */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Credit Claims</h2>
            </div>
            
            {pendingClaims.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending claims</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClaims.slice(0, 5).map((claim) => (
                  <motion.div
                    key={claim._id}
                    whileHover={{ scale: 1.01 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{claim.project?.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {claim.developer?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {formatNumber(claim.claimDetails.creditsRequested)} tCO₂
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Submitted: {formatDate(claim.createdAt)}
                        </p>
                      </div>
                      {getClaimStatusBadge(claim.status)}
                    </div>

                    {claim.inspection?.scheduledDate && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                        <p className="text-xs text-purple-800">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Inspection: {formatDate(claim.inspection.scheduledDate)}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {claim.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowInspectionModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          <Calendar className="h-3 w-3" />
                          Schedule Inspection
                        </button>
                      )}
                      
                      {claim.status === 'inspection_scheduled' && (
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowCompleteInspectionModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Complete Inspection
                        </button>
                      )}
                      
                      {claim.status === 'inspection_completed' && (
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setApprovedCredits(claim.claimDetails.creditsRequested.toString());
                            setShowIssueCreditsModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-green-600 hover:text-green-700 border border-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
                        >
                          <Award className="h-3 w-3" />
                          Issue Credits
                        </button>
                      )}

                      <button
                        onClick={() => handleViewProjectMRV(claim.project._id)}
                        className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-700 border border-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Database className="h-3 w-3" />
                        View MRV Data
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Projects with Credit Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Approved Projects</h2>
            </div>
            
            {approvedProjects.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No approved projects</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedProjects.slice(0, 5).map((project) => {
                  const projectApprovedClaims = getProjectApprovedClaims(project._id);
                  const hasCredits = projectApprovedClaims.length > 0;
                  const totalCreditsIssued = projectApprovedClaims.reduce((sum, claim) => 
                    sum + (claim.creditIssuance?.approvedCredits || 0), 0
                  );

                  return (
                    <div key={project._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                          <p className="text-sm text-gray-600">
                            {project.developer?.name}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Approved
                        </span>
                      </div>

                      {/* Credits Issued Status */}
                      {hasCredits && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-green-800 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Credits Issued - Project Completed
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {formatNumber(totalCreditsIssued)} tCO₂ issued
                          </p>
                        </div>
                      )}

                      {/* MRV Activity Indicator */}
                      {project.mrvData && project.mrvData.length > 0 && !hasCredits && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-blue-800 font-medium">
                            <Database className="h-3 w-3 inline mr-1" />
                            {project.mrvData.length} MRV submission{project.mrvData.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Latest: {formatDate(project.mrvData[project.mrvData.length - 1]?.uploadedAt)}
                          </p>
                        </div>
                      )}

                      {/* No activity yet */}
                      {(!project.mrvData || project.mrvData.length === 0) && !hasCredits && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-gray-600">
                            Awaiting MRV data submission
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewProjectMRV(project._id)}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.approvedProjects + stats.rejectedProjects > 0 
                  ? Math.round((stats.approvedProjects / (stats.approvedProjects + stats.rejectedProjects)) * 100)
                  : 0}%
              </div>
              <p className="text-gray-600">Project Approval Rate</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.approvedClaims + stats.pendingClaims}
              </div>
              <p className="text-gray-600">Total Claims Processed</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalInspections}
              </div>
              <p className="text-gray-600">Inspections Completed</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.pendingClaims + stats.pendingReviews}
              </div>
              <p className="text-gray-600">Pending Actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Inspection Modal */}
      <Modal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title="Schedule Inspection"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-4">
              Schedule an inspection for <strong>{selectedClaim?.project?.name}</strong>
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-blue-800 text-sm">
                Credits Requested: <strong>{formatNumber(selectedClaim?.claimDetails.creditsRequested)} tCO₂</strong>
              </p>
              <p className="text-blue-800 text-sm">
                Developer: <strong>{selectedClaim?.developer?.name}</strong>
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowInspectionModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleInspection}
              disabled={actionLoading || !inspectionDate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {actionLoading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Complete Inspection Modal */}
      <Modal
        isOpen={showCompleteInspectionModal}
        onClose={() => setShowCompleteInspectionModal(false)}
        title="Complete Inspection"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-purple-800 text-sm font-medium mb-2">
              Project: {selectedClaim?.project?.name}
            </p>
            <p className="text-purple-700 text-sm">
              Scheduled: {formatDate(selectedClaim?.inspection?.scheduledDate)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Result <span className="text-red-500">*</span>
            </label>
            <select
              value={inspectionResult}
              onChange={(e) => setInspectionResult(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="passed">Passed</option>
              <option value="partial">Partial Pass</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Findings <span className="text-red-500">*</span>
            </label>
            <textarea
              value={inspectionFindings}
              onChange={(e) => setInspectionFindings(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter detailed inspection findings..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCompleteInspectionModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteInspection}
              disabled={actionLoading || !inspectionFindings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {actionLoading ? 'Completing...' : 'Complete Inspection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Issue Credits Modal */}
      <Modal
        isOpen={showIssueCreditsModal}
        onClose={() => setShowIssueCreditsModal(false)}
        title="Issue Carbon Credits"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium mb-2">
              Project: {selectedClaim?.project?.name}
            </p>
            <p className="text-green-700 text-sm">
              Inspection Result: <strong className="capitalize">{selectedClaim?.inspection?.inspectionResult}</strong>
            </p>
            <p className="text-green-700 text-sm">
              Credits Requested: <strong>{formatNumber(selectedClaim?.claimDetails.creditsRequested)} tCO₂</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits to Issue (tCO₂) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={approvedCredits}
              onChange={(e) => setApprovedCredits(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter credits to issue"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              value={issueComments}
              onChange={(e) => setIssueComments(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Add any comments about credit issuance..."
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Once credits are issued, this project will be marked as completed.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowIssueCreditsModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleIssueCredits}
              disabled={actionLoading || !approvedCredits}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Award className="h-4 w-4" />
              )}
              {actionLoading ? 'Issuing...' : 'Issue Credits'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegulatoryDashboard;