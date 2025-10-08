import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Award, 
  Upload,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Send
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { creditService } from '../../services/credit.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const ProjectDeveloperDashboard = () => {
  const { user } = useAuth();
  const { projects, loading, fetchMyProjects } = useProjects();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalCredits: 0,
    pendingVerification: 0
  });
  const [myCredits, setMyCredits] = useState([]);

  useEffect(() => {
    fetchMyProjects();
    fetchMyCredits();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      calculateStats();
    }
  }, [projects]);

  const calculateStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => ['approved', 'active'].includes(p.status)).length;
    const pendingVerification = projects.filter(p => ['submitted', 'under_review'].includes(p.status)).length;
    
    setStats({
      totalProjects,
      activeProjects,
      totalCredits: myCredits.length,
      pendingVerification
    });
  };

  const fetchMyCredits = async () => {
    try {
      const response = await creditService.getMyCredits();
      if (response.success) {
        setMyCredits(response.credits || []);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, text: 'Draft' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Send, text: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  if (loading && projects.length === 0) {
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
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your carbon offset projects and track performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={FileText}
            color="bg-blue-500"
            onClick={() => navigate('/projects')}
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={TrendingUp}
            color="bg-green-500"
          />
          <StatCard
            title="Carbon Credits"
            value={stats.totalCredits}
            icon={Award}
            color="bg-purple-500"
            onClick={() => navigate('/credits')}
          />
          <StatCard
            title="Pending Verification"
            value={stats.pendingVerification}
            icon={Clock}
            color="bg-orange-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
            New Project
          </motion.button>
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const approvedProjects = projects.filter(p => p.status === 'approved');
              if (approvedProjects.length > 0) {
                navigate(`/projects/${approvedProjects[0]._id}/mrv-data`);
              } else {
                toast.error('No approved projects available for MRV data submission');
              }
            }}
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
          >
            <Upload className="h-5 w-5" />
            Upload MRV Data
          </motion.button> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
              <Link to="/projects" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No projects yet</p>
                <Link
                  to="/projects/new"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Create your first project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{project.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatNumber(project.projectDetails.expectedCredits)} credits • {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(project.status)}
                      <Link
                        to={`/projects/${project._id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Credits */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Carbon Credits</h2>
              <Link to="/credits" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            
            {myCredits.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No credits claimed yet</p>
                <p className="text-sm text-gray-400">
                  Complete and get your projects approved to claim credits
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myCredits.slice(0, 5).map((credit) => (
                  <div key={credit._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{credit.project?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatNumber(credit.amount)} credits • Vintage {credit.vintage}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{credit.status}</p>
                      <p className="text-sm text-gray-500">{formatDate(credit.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDeveloperDashboard;