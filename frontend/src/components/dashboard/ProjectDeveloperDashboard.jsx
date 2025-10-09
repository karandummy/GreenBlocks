import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, FileText, TrendingUp, Award, Upload, Eye, Clock,
  CheckCircle, XCircle, Edit, Send, DollarSign, AlertCircle,
  Calendar, MapPin, ShoppingBag, Package
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProjects } from '../../hooks/useProjects';
import { creditClaimService } from '../../services/creditClaim.service';
import { marketplaceService } from '../../services/marketplace.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const ProjectDeveloperDashboard = () => {
  const { user } = useAuth();
  const { projects, loading, fetchMyProjects } = useProjects();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalClaims: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    creditsIssued: 0,
    creditsListed: 0
  });
  const [myClaims, setMyClaims] = useState([]);
  const [myListings, setMyListings] = useState([]);

  useEffect(() => {
    fetchMyProjects();
    fetchMyClaims();
    fetchMyListings();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      calculateStats();
    }
  }, [projects, myClaims, myListings]);

  const calculateStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => ['approved', 'active'].includes(p.status)).length;
    
    const totalClaims = myClaims.length;
    const pendingClaims = myClaims.filter(c => ['pending', 'under_review', 'inspection_scheduled'].includes(c.status)).length;
    const approvedClaims = myClaims.filter(c => c.status === 'approved').length;
    const creditsIssued = myClaims
      .filter(c => c.status === 'approved')
      .reduce((sum, c) => sum + (c.creditIssuance?.approvedCredits || 0), 0);
    const creditsListed = myListings
      .filter(l => l.status === 'active' || l.status === 'partial')
      .reduce((sum, l) => sum + l.creditsAvailable, 0);
    
    setStats({
      totalProjects,
      activeProjects,
      totalClaims,
      pendingClaims,
      approvedClaims,
      creditsIssued,
      creditsListed
    });
  };

  const fetchMyClaims = async () => {
    try {
      const response = await creditClaimService.getMyClaims();
      if (response.success) {
        setMyClaims(response.claims || []);
      }
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    }
  };

  const fetchMyListings = async () => {
    try {
      const response = await marketplaceService.getMyListings();
      if (response.success) {
        setMyListings(response.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
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
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
      completed: { color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle, text: 'Completed' }
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

  const getClaimStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending Review' },
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your carbon offset projects and track credit claims</p>
        </div>

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
            title="Credits Issued"
            value={stats.creditsIssued}
            icon={Award}
            color="bg-purple-500"
          />
          <StatCard
            title="Credits Listed"
            value={stats.creditsListed}
            icon={ShoppingBag}
            color="bg-orange-500"
          />
        </div>

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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/sell-credits')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ShoppingBag className="h-5 w-5" />
            Sell Credits
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 bg-white border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Package className="h-5 w-5" />
            View Marketplace
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Credit Claims</h2>
              {myClaims.length > 5 && (
                <button className="text-purple-600 hover:text-purple-700 font-medium">
                  View All
                </button>
              )}
            </div>
            
            {myClaims.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No credit claims yet</p>
                <p className="text-sm text-gray-400">
                  Upload MRV data and claim credits from approved projects
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myClaims.slice(0, 5).map((claim) => (
                  <div key={claim._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {claim.project?.name || 'Project'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {formatNumber(claim.claimDetails.creditsRequested)} tCO₂ requested
                        </p>
                      </div>
                      {getClaimStatusBadge(claim.status)}
                    </div>

                    {claim.inspection?.scheduledDate && claim.status === 'inspection_scheduled' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-2">
                        <p className="text-xs text-purple-800">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Inspection: {formatDate(claim.inspection.scheduledDate)}
                        </p>
                      </div>
                    )}

                    {claim.status === 'approved' && claim.creditIssuance?.approvedCredits && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                        <p className="text-xs text-green-800 font-medium">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          {formatNumber(claim.creditIssuance.approvedCredits)} credits issued
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Submitted: {formatDate(claim.createdAt)}</span>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Marketplace Listings</h2>
            
            {myListings.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No active listings</p>
                <button
                  onClick={() => navigate('/sell-credits')}
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  List credits for sale
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.slice(0, 3).map((listing) => (
                  <div key={listing._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{listing.project?.name}</h4>
                        <p className="text-sm text-gray-600">Listing ID: {listing.listingId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                        listing.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Available</p>
                          <p className="text-lg font-bold text-green-600">{listing.creditsAvailable}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Listed</p>
                          <p className="text-lg font-semibold text-gray-900">{listing.creditsListed}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="text-lg font-semibold text-gray-900">{listing.pricePerCredit} ETH</p>
                        </div>
                      </div>
                    </div>

                    {listing.sales && listing.sales.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          {listing.sales.length} sale(s) • {listing.sales.reduce((sum, s) => sum + s.amount, 0)} credits sold
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.approvedClaims}
                </div>
                <p className="text-sm text-gray-600">Approved Claims</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {stats.pendingClaims}
                </div>
                <p className="text-sm text-gray-600">Pending Claims</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.creditsIssued.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Credits Issued</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.creditsListed.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Listed for Sale</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-gray-900">Marketplace Earnings</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {(myListings.reduce((sum, l) => {
                  return sum + (l.sales?.reduce((s, sale) => s + sale.price, 0) || 0);
                }, 0)).toFixed(4)} ETH
              </p>
              <p className="text-xs text-gray-600 mt-1">
                From {myListings.reduce((sum, l) => sum + (l.sales?.length || 0), 0)} transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDeveloperDashboard;