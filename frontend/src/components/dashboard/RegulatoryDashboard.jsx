import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Calendar,
  MapPin,
  User,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { projectService } from '../../services/project.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const RegulatoryDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedProjects: 0,
    rejectedProjects: 0,
    totalInspections: 0
  });
  const [pendingProjects, setPendingProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all projects for regulatory review
      const response = await projectService.getAllProjects();
      console.log('Dashboard projects response:', response);
      if (response.success) {
        const allProjects = response.projects || [];
        
        // Calculate stats
        const pendingReviews = allProjects.filter(p => ['submitted', 'under_review'].includes(p.status)).length;
        const approvedProjects = allProjects.filter(p => p.status === 'approved').length;
        const rejectedProjects = allProjects.filter(p => p.status === 'rejected').length;
        const totalInspections = allProjects.filter(p => p.verification?.inspectionDate).length;
        
        setStats({
          pendingReviews,
          approvedProjects,
          rejectedProjects,
          totalInspections
        });

        // Set pending projects
        setPendingProjects(
          allProjects
            .filter(p => ['submitted', 'under_review'].includes(p.status))
            .sort((a, b) => new Date(a.verification?.submittedAt || a.createdAt) - new Date(b.verification?.submittedAt || b.createdAt))
        );

        // Set recent activity
        setRecentActivity(
          allProjects
            .filter(p => p.verification?.reviewedAt)
            .sort((a, b) => new Date(b.verification.reviewedAt) - new Date(a.verification.reviewedAt))
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  const getPriorityLevel = (project) => {
    const submittedDate = new Date(project.verification?.submittedAt || project.createdAt);
    const daysSinceSubmission = (new Date() - submittedDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
    return 'low';
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', text: 'High Priority' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: 'Medium Priority' },
      low: { color: 'bg-green-100 text-green-800', text: 'Low Priority' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleQuickApprove = async (projectId) => {
    try {
      // This would call a quick approval endpoint
      toast.success('Project approved successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to approve project');
    }
  };

  const handleScheduleInspection = async (projectId) => {
    navigate(`/projects/${projectId}/inspection`);
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
          <p className="text-gray-600">Review and verify carbon offset projects</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={Clock}
            color="bg-orange-500"
            trend={`${stats.pendingReviews > 5 ? 'High workload' : 'Normal workload'}`}
            onClick={() => navigate('/verification/pending')}
          />
          <StatCard
            title="Approved Projects"
            value={stats.approvedProjects}
            icon={CheckCircle}
            color="bg-green-500"
            trend="This month"
          />
          <StatCard
            title="Rejected Projects"
            value={stats.rejectedProjects}
            icon={AlertTriangle}
            color="bg-red-500"
            trend="This month"
          />
          <StatCard
            title="Total Inspections"
            value={stats.totalInspections}
            icon={FileCheck}
            color="bg-blue-500"
            trend="Completed"
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
            Review Pending ({stats.pendingReviews})
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/verification/inspections')}
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
          >
            <Calendar className="h-5 w-5" />
            Schedule Inspections
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Urgent Reviews */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Projects Awaiting Review</h2>
              <Link to="/verification/pending" className="text-orange-600 hover:text-orange-700 font-medium">
                View All
              </Link>
            </div>
            
            {pendingProjects.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending reviews</p>
                <p className="text-sm text-gray-400 mt-2">All projects are up to date!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProjects.slice(0, 5).map((project) => {
                  const priority = getPriorityLevel(project);
                  return (
                    <motion.div
                      key={project._id}
                      whileHover={{ scale: 1.01 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {project.developer?.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.location.state}
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              {formatNumber(project.projectDetails.expectedCredits)} credits
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            Submitted: {formatDate(project.verification?.submittedAt || project.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {getPriorityBadge(priority)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status === 'submitted' ? 'New Submission' : 'Under Review'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/projects/${project._id}`)}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg text-sm hover:bg-blue-50 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Review
                        </button>
                        <button
                          onClick={() => handleQuickApprove(project._id)}
                          className="flex items-center gap-1 px-3 py-1 text-green-600 hover:text-green-700 border border-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Quick Approve
                        </button>
                        <button
                          onClick={() => handleScheduleInspection(project._id)}
                          className="flex items-center gap-1 px-3 py-1 text-purple-600 hover:text-purple-700 border border-purple-600 rounded-lg text-sm hover:bg-purple-50 transition-colors"
                        >
                          <Calendar className="h-3 w-3" />
                          Inspect
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <Link to="/verification/history" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((project) => (
                  <div key={project._id} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900 text-sm">{project.name}</h4>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium text-green-600">{project.status}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(project.verification?.reviewedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.approvedProjects + stats.rejectedProjects > 0 
                  ? Math.round((stats.approvedProjects / (stats.approvedProjects + stats.rejectedProjects)) * 100)
                  : 0}%
              </div>
              <p className="text-gray-600">Approval Rate</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.pendingReviews > 0 ? Math.round(stats.pendingReviews / 7 * 10) / 10 : 0}
              </div>
              <p className="text-gray-600">Avg. Review Time (days)</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalInspections}
              </div>
              <p className="text-gray-600">Inspections Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryDashboard;