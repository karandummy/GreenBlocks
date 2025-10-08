import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Eye,
  Calendar,
  MapPin,
  User,
  Award,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { verificationService } from '../../services/verification.service';
import { formatDate, formatNumber } from '../../utils/helpers';
import Modal from '../common/Modal';

const PendingVerificationsPage = () => {
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, priority, name
  
  // Modal states
  const [showQuickApproveModal, setShowQuickApproveModal] = useState(false);
  const [showQuickRejectModal, setShowQuickRejectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingProjects();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [projects, searchTerm, filterStatus, filterPriority, sortBy]);

  const fetchPendingProjects = async () => {
    try {
      setLoading(true);
      const response = await verificationService.getPendingVerifications();
      
      if (response.success) {
        setProjects(response.projects || []);
      } else {
        toast.error('Failed to load pending projects');
      }
    } catch (error) {
      console.error('Fetch pending projects error:', error);
      toast.error('Failed to load pending projects');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLevel = (project) => {
    const submittedDate = new Date(project.verification?.submittedAt || project.createdAt);
    const daysSinceSubmission = (new Date() - submittedDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
    return 'low';
  };

  const applyFiltersAndSort = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.developer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(project => getPriorityLevel(project) === filterPriority);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.verification?.submittedAt || a.createdAt) - 
                 new Date(b.verification?.submittedAt || b.createdAt);
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[getPriorityLevel(a)] - priorityOrder[getPriorityLevel(b)];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', text: 'High Priority', icon: AlertTriangle },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium Priority', icon: Clock },
      low: { color: 'bg-green-100 text-green-800', text: 'Low Priority', icon: CheckCircle }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const handleQuickApprove = (project) => {
    setSelectedProject(project);
    setApprovalComments('');
    setShowQuickApproveModal(true);
  };

  const handleQuickReject = (project) => {
    setSelectedProject(project);
    setRejectionReason('');
    setShowQuickRejectModal(true);
  };

  const confirmQuickApprove = async () => {
    if (!selectedProject) return;
    
    try {
      setActionLoading(true);
      
      const response = await verificationService.approveProject(selectedProject._id, {
        comments: approvalComments || 'Quick approval from pending verifications page'
      });
      
      if (response.success) {
        toast.success('Project approved successfully!');
        setShowQuickApproveModal(false);
        fetchPendingProjects();
      } else {
        throw new Error(response.message || 'Failed to approve project');
      }
    } catch (error) {
      console.error('Quick approve error:', error);
      toast.error(error.message || 'Failed to approve project');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmQuickReject = async () => {
    if (!selectedProject || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await verificationService.rejectProject(selectedProject._id, {
        reason: rejectionReason
      });
      
      if (response.success) {
        toast.success('Project rejected successfully');
        setShowQuickRejectModal(false);
        fetchPendingProjects();
      } else {
        throw new Error(response.message || 'Failed to reject project');
      }
    } catch (error) {
      console.error('Quick reject error:', error);
      toast.error(error.message || 'Failed to reject project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInspection = (projectId) => {
    navigate(`/projects/${projectId}/inspection`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pending Verifications
              </h1>
              <p className="text-gray-600">
                Review and verify projects awaiting approval
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-600">
                {filteredProjects.length}
              </div>
              <div className="text-sm text-gray-600">Total Pending</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, developers, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">New Submission</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ArrowUpDown className="h-4 w-4" />
              <span>Sort by:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'priority'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Priority
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'name'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Name
              </button>
            </div>
          </div>
        </div>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Pending Projects
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'No projects match your filters. Try adjusting your search criteria.'
                : 'All projects are up to date! Check back later for new submissions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const priority = getPriorityLevel(project);
              return (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Project Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {project.name}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{project.developer?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{project.location?.city}, {project.location?.state}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              <span>{formatNumber(project.projectDetails?.expectedCredits || 0)} credits</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Submitted: {formatDate(project.verification?.submittedAt || project.createdAt)}</span>
                            </div>
                          </div>

                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          {/* Project Type and Methodology */}
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {project.type}
                            </span>
                            {project.methodology && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {project.methodology}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[200px]">
                      <div className="flex flex-col gap-2 items-end">
                        {getPriorityBadge(priority)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'submitted' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status === 'submitted' ? 'New Submission' : 'Under Review'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors w-full"
                        >
                          <Eye className="h-4 w-4" />
                          Review Details
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleQuickApprove(project)}
                            className="flex items-center justify-center gap-1 px-3 py-2 text-green-600 hover:text-green-700 border border-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleQuickReject(project)}
                            className="flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 border border-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                        
                        {/* <button
                          onClick={() => handleScheduleInspection(project._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors w-full"
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule Inspection
                        </button> */}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Approve Modal */}
      <Modal
        isOpen={showQuickApproveModal}
        onClose={() => setShowQuickApproveModal(false)}
        title="Quick Approve Project"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to approve the project <strong>"{selectedProject?.name}"</strong>?
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                This action will immediately approve the project and make it eligible for carbon credit generation.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Comments (Optional)
            </label>
            <textarea
              value={approvalComments}
              onChange={(e) => setApprovalComments(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="3"
              placeholder="Add any comments about the approval..."
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowQuickApproveModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmQuickApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {actionLoading ? 'Approving...' : 'Approve Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Reject Modal */}
      <Modal
        isOpen={showQuickRejectModal}
        onClose={() => setShowQuickRejectModal(false)}
        title="Quick Reject Project"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to reject the project <strong>"{selectedProject?.name}"</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">
                This action will reject the project. The developer will be notified and can resubmit after addressing the issues.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows="4"
              placeholder="Please provide a detailed reason for rejection..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be sent to the project developer.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowQuickRejectModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmQuickReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {actionLoading ? 'Rejecting...' : 'Reject Project'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingVerificationsPage;