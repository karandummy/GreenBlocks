import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Wallet, 
  TrendingDown, 
  Award,
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  Plus,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { creditService } from '../../services/credit.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber, formatCurrency } from '../../utils/helpers';

const CreditBuyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalPurchased: 0,
    currentBalance: 0,
    offsetEmissions: 0,
    activePurchases: 0
  });
  const [availableCredits, setAvailableCredits] = useState([]);
  const [myCredits, setMyCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch marketplace credits
      const marketplaceResponse = await creditService.getMarketplaceCredits();
      if (marketplaceResponse.success) {
        setAvailableCredits(marketplaceResponse.credits || []);
      }

      // Fetch my credits
      const myCreditsResponse = await creditService.getMyCredits();
      if (myCreditsResponse.success) {
        const credits = myCreditsResponse.credits || [];
        setMyCredits(credits);
        
        // Calculate stats from real data
        const totalPurchased = credits.reduce((sum, credit) => sum + credit.amount, 0);
        const currentBalance = credits.filter(c => c.status === 'issued' || c.status === 'listed').reduce((sum, credit) => sum + credit.amount, 0);
        const offsetEmissions = credits.filter(c => c.status === 'retired').reduce((sum, credit) => sum + credit.amount, 0);
        
        setStats({
          totalPurchased,
          currentBalance,
          offsetEmissions,
          activePurchases: credits.filter(c => ['listed', 'sold'].includes(c.status)).length
        });
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, unit = '', onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-white rounded-xl shadow-lg p-6 border border-gray-100 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? formatNumber(value) : value}{unit}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const handlePurchase = async (creditId, amount = null) => {
    try {
      const response = await creditService.purchaseCredits({
        creditId,
        amount: amount || 1
      });

      if (response.success) {
        toast.success('Purchase initiated successfully!');
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(response.message || 'Purchase failed');
      }
    } catch (error) {
      toast.error(error.message || 'Purchase failed');
    }
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
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Purchase carbon credits to offset your emissions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Purchased"
            value={stats.totalPurchased}
            icon={ShoppingCart}
            color="bg-blue-500"
            unit=" credits"
            onClick={() => navigate('/credits/history')}
          />
          <StatCard
            title="Current Balance"
            value={stats.currentBalance}
            icon={Wallet}
            color="bg-green-500"
            unit=" credits"
            onClick={() => navigate('/credits')}
          />
          <StatCard
            title="CO₂ Offset"
            value={stats.offsetEmissions}
            icon={TrendingDown}
            color="bg-purple-500"
            unit=" tons"
          />
          <StatCard
            title="Active Holdings"
            value={stats.activePurchases}
            icon={Award}
            color="bg-orange-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse Marketplace
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/credits/retire')}
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200"
          >
            <TrendingDown className="h-5 w-5" />
            Retire Credits
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Credits */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Featured Credits</h2>
              <Link to="/marketplace" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            
            {availableCredits.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No credits available right now</p>
                <p className="text-sm text-gray-400 mt-2">Check back later for new listings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableCredits.slice(0, 3).map((credit) => (
                  <motion.div
                    key={credit._id}
                    whileHover={{ y: -2 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{credit.project?.name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {credit.project?.location?.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(credit.price?.amount || 25)}
                        </p>
                        <p className="text-xs text-gray-500">per credit</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{formatNumber(credit.amount)} credits</span>
                        <span className="text-xs text-gray-500">Vintage {credit.vintage}</span>
                      </div>
                      <button
                        onClick={() => handlePurchase(credit._id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Buy Now
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* My Credits */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Credits Portfolio</h2>
              <Link to="/credits" className="text-green-600 hover:text-green-700 font-medium">
                View All
              </Link>
            </div>
            
            {myCredits.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No credits in your portfolio yet</p>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Purchase your first credits
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myCredits.slice(0, 5).map((credit) => (
                  <div key={credit._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{credit.project?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {formatNumber(credit.amount)} credits • Vintage {credit.vintage}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        credit.status === 'issued' ? 'bg-green-100 text-green-800' :
                        credit.status === 'retired' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {credit.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(credit.createdAt)}</p>
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

export default CreditBuyerDashboard;