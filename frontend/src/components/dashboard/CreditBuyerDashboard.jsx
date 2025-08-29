import React, { useState, useEffect } from 'react';
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
  Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const CreditBuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPurchased: 0,
    currentBalance: 0,
    offsetEmissions: 0,
    activePurchases: 0
  });
  const [availableCredits, setAvailableCredits] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data
      setStats({
        totalPurchased: 15000,
        currentBalance: 2500,
        offsetEmissions: 12500,
        activePurchases: 5
      });
      
      setAvailableCredits([
        {
          id: 1,
          projectName: 'Solar Farm Maharashtra',
          credits: 1000,
          price: 25,
          vintage: 2024,
          location: 'Maharashtra, India',
          rating: 4.8,
          type: 'renewable_energy'
        },
        {
          id: 2,
          projectName: 'Wind Energy Tamil Nadu',
          credits: 2500,
          price: 28,
          vintage: 2024,
          location: 'Tamil Nadu, India',
          rating: 4.6,
          type: 'renewable_energy'
        },
        {
          id: 3,
          projectName: 'Afforestation Kerala',
          credits: 800,
          price: 22,
          vintage: 2023,
          location: 'Kerala, India',
          rating: 4.9,
          type: 'afforestation'
        }
      ]);

      setPurchaseHistory([
        {
          id: 1,
          projectName: 'Biomass Energy Punjab',
          credits: 500,
          price: 24,
          date: '2024-01-20',
          status: 'completed'
        },
        {
          id: 2,
          projectName: 'Hydropower Himachal',
          credits: 750,
          price: 26,
          date: '2024-01-15',
          status: 'completed'
        }
      ]);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, unit = '' }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}{unit}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const CreditCard = ({ credit, onPurchase }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{credit.projectName}</h3>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin className="h-4 w-4" />
            {credit.location}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{credit.rating}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-2xl font-bold text-green-600">${credit.price}</p>
          <p className="text-gray-500 text-sm">per credit</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">{credit.credits.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">credits available</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="h-4 w-4" />
          Vintage {credit.vintage}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          credit.type === 'renewable_energy' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {credit.type.replace('_', ' ')}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPurchase(credit)}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
      >
        Purchase Credits
      </motion.button>
    </motion.div>
  );

  const handlePurchase = (credit) => {
    toast.success(`Initiated purchase for ${credit.projectName}`);
    // Here you would implement the actual purchase logic
  };

  const filteredCredits = availableCredits.filter(credit => {
    const matchesSearch = credit.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         credit.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || credit.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
          />
          <StatCard
            title="Current Balance"
            value={stats.currentBalance}
            icon={Wallet}
            color="bg-green-500"
            unit=" credits"
          />
          <StatCard
            title="CO₂ Offset"
            value={stats.offsetEmissions}
            icon={TrendingDown}
            color="bg-purple-500"
            unit=" tons"
          />
          <StatCard
            title="Active Purchases"
            value={stats.activePurchases}
            icon={Award}
            color="bg-orange-500"
          />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search projects or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                <option value="renewable_energy">Renewable Energy</option>
                <option value="afforestation">Afforestation</option>
                <option value="energy_efficiency">Energy Efficiency</option>
              </select>
            </div>
          </div>
        </div>

        {/* Available Credits */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Carbon Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredits.map((credit) => (
              <CreditCard
                key={credit.id}
                credit={credit}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Purchases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Project</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Credits</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {purchase.projectName}
                    </td>
                    <td className="py-4 px-4 text-gray-900">
                      {purchase.credits.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-gray-900">
                      ${purchase.price}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {purchase.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditBuyerDashboard;