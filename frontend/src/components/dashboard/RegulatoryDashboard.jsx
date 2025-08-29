import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  Download,
  Search,
  Filter,
  Calendar,
  MapPin,
  User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const RegulatoryDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedProjects: 0,
    rejectedProjects: 0,
    totalInspections: 0
  });
  const [pendingProjects, setPendingProjects] = useState([]);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data
      setStats({
        pendingReviews: 8,
        approvedProjects: 45,
        rejectedProjects: 3,
        totalInspections: 28
      });
      
      setPendingProjects([
        {
          id: 1,
          name: 'Solar Farm Maharashtra',
          developer: 'GreenTech Solutions',
          type: 'renewable_energy',
          submittedDate: '2024-01-20',
          location: 'Maharashtra, India',
          expectedCredits: 5000,
          priority: 'high'
        },
        {
          id: 2,
          name: 'Wind Energy Tamil Nadu',
          developer: 'WindPower Inc',
          type: 'renewable_energy',
          submittedDate: '2024-01-18',
          location: 'Tamil Nadu, India',
          expectedCredits: 8000,
          priority: 'medium'
        },
        {
          id: 3,
          name: 'Afforestation Kerala',
          developer: 'EcoForest Ltd',
          type: 'afforestation',
          submittedDate: '2024-01-15',
          location: 'Kerala, India',
          expectedCredits: 3000,
          priority: 'low'
        }
      ]);

      setRecentVerifications([
        {
          id: 1,
          projectName: 'Biomass Energy Punjab',
          action: 'Approved',
          date: '2024-01-22',
          inspector: 'Dr. Rajesh Kumar'
        },
        {
          id: 2,
          projectName: 'Hydropower Himachal',
          action: 'Inspection Scheduled',
          date: '2024-01-21',
          inspector: 'Ms. Priya Sharma'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
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

  const getProjectTypeBadge = (type) => {
    const typeConfig = {
      renewable_energy: { color: 'bg-blue-100 text-blue-800', text: 'Renewable Energy' },
      afforestation: { color: 'bg-green-100 text-green-800', text: 'Afforestation' },
      energy_efficiency: { color: 'bg-purple-100 text-purple-800', text: 'Energy Efficiency' }
    };

    const config = typeConfig[type] || typeConfig.renewable_energy;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleApprove = (projectId) => {
    toast.success('Project approved successfully');
    // Implement approval logic
  };

  const handleReject = (projectId) => {
    toast.error('Project rejected');
    // Implement rejection logic
  };

  const handleScheduleInspection = (projectId) => {
    toast.success('Inspection scheduled');
    // Implement inspection scheduling
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
            trend="2 urgent"
          />
          <StatCard
            title="Approved Projects"
            value={stats.approvedProjects}
            icon={CheckCircle}
            color="bg-green-500"
            trend="This month: 12"
          />
          <StatCard
            title="Rejected Projects"
            value={stats.rejectedProjects}
            icon={AlertTriangle}
            color="bg-red-500"
            trend="This month: 1"
          />
          <StatCard
            title="Total Inspections"
            value={stats.totalInspections}
            icon={FileCheck}
            color="bg-blue-500"
            trend="Completed"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'pending', label: 'Pending Reviews', count: stats.pendingReviews },
                { key: 'approved', label: 'Approved Projects', count: stats.approvedProjects },
                { key: 'inspections', label: 'Inspections', count: stats.totalInspections }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    selectedTab === tab.key
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'pending' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Projects Pending Review
                </h3>
                <div className="space-y-4">
                  {pendingProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.01 }}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {project.developer}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {project.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(project.submittedDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            {getProjectTypeBadge(project.type)}
                            {getPriorityBadge(project.priority)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {project.expectedCredits.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Expected Credits</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprove(project.id)}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(project.id)}
                          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Reject
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleScheduleInspection(project.id)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule Inspection
                        </motion.button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'approved' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approved Projects
                </h3>
                <p className="text-gray-600">List of approved projects would be displayed here.</p>
              </div>
            )}

            {selectedTab === 'inspections' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Inspection Schedule
                </h3>
                <p className="text-gray-600">Inspection schedule and reports would be displayed here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Verification Activity</h2>
          <div className="space-y-4">
            {recentVerifications.map((verification) => (
              <div key={verification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{verification.projectName}</h4>
                  <p className="text-sm text-gray-600">Inspector: {verification.inspector}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    verification.action === 'Approved' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {verification.action}
                  </p>
                  <p className="text-sm text-gray-600">{new Date(verification.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatoryDashboard;