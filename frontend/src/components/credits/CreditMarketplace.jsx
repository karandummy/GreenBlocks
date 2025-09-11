import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Calendar,
  Award,
  ShoppingCart,
  TrendingUp,
  Leaf,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { creditService } from '../../services/credit.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber, formatCurrency } from '../../utils/helpers';

const CreditMarketplace = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    vintage: 'all',
    rating: 'all'
  });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchMarketplaceCredits();
  }, []);

  const fetchMarketplaceCredits = async () => {
    try {
      setLoading(true);
      const response = await creditService.getMarketplaceCredits();
      if (response.success) {
        setCredits(response.credits || []);
      } else {
        toast.error('Failed to load marketplace credits');
      }
    } catch (error) {
      console.error('Marketplace fetch error:', error);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (creditId) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }

    if (user.role !== 'credit_buyer') {
      toast.error('Only credit buyers can purchase credits');
      return;
    }

    try {
      const response = await creditService.purchaseCredits({
        creditId,
        amount: 1 // Default to purchasing 1 credit
      });

      if (response.success) {
        toast.success('Credit purchased successfully!');
        fetchMarketplaceCredits(); // Refresh the marketplace
      } else {
        toast.error(response.message || 'Purchase failed');
      }
    } catch (error) {
      toast.error(error.message || 'Purchase failed');
    }
  };

  const getProjectTypeDisplay = (type) => {
    return type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const getProjectTypeColor = (type) => {
    const colors = {
      renewable_energy: 'bg-blue-100 text-blue-800',
      afforestation: 'bg-green-100 text-green-800',
      energy_efficiency: 'bg-purple-100 text-purple-800',
      waste_management: 'bg-orange-100 text-orange-800',
      transportation: 'bg-indigo-100 text-indigo-800',
      industrial: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredAndSortedCredits = credits
    .filter(credit => {
      const matchesSearch = !searchTerm || 
        credit.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.project?.location?.state.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filters.type === 'all' || credit.project?.type === filters.type;
      const matchesVintage = filters.vintage === 'all' || credit.vintage.toString() === filters.vintage;
      
      return matchesSearch && matchesType && matchesVintage;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price?.amount || 0) - (b.price?.amount || 0);
        case 'price-high':
          return (b.price?.amount || 0) - (a.price?.amount || 0);
        case 'credits-high':
          return b.amount - a.amount;
        case 'credits-low':
          return a.amount - b.amount;
        case 'vintage-new':
          return b.vintage - a.vintage;
        case 'vintage-old':
          return a.vintage - b.vintage;
        default: // newest
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Credit Marketplace</h1>
          <p className="text-gray-600">Browse and purchase verified carbon credits from sustainable projects</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search projects or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="renewable_energy">Renewable Energy</option>
              <option value="afforestation">Afforestation</option>
              <option value="energy_efficiency">Energy Efficiency</option>
              <option value="waste_management">Waste Management</option>
            </select>

            <select
              value={filters.vintage}
              onChange={(e) => setFilters({...filters, vintage: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Vintages</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="credits-high">Most Credits</option>
              <option value="vintage-new">Newest Vintage</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredAndSortedCredits.length} of {credits.length} credits
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total Available: {formatNumber(credits.reduce((sum, c) => sum + c.amount, 0))} tCO₂</span>
            </div>
          </div>
        </div>

        {/* Credits Grid */}
        {filteredAndSortedCredits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credits available</h3>
            <p className="text-gray-600">
              {credits.length === 0 
                ? "There are no credits listed in the marketplace yet."
                : "No credits match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCredits.map((credit) => (
              <motion.div
                key={credit._id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {credit.project?.name || 'Unknown Project'}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(credit.project?.type)}`}>
                        {getProjectTypeDisplay(credit.project?.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="h-4 w-4" />
                      {credit.project?.location?.state}, {credit.project?.location?.country}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar className="h-4 w-4" />
                      Vintage {credit.vintage}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Award className="h-4 w-4" />
                      {formatNumber(credit.amount)} credits available
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(credit.price?.amount || 25)}
                      </p>
                      <p className="text-gray-500 text-sm">per credit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency((credit.price?.amount || 25) * credit.amount)}
                      </p>
                      <p className="text-gray-500 text-sm">total value</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {user?.role === 'credit_buyer' ? (
                      <button
                        onClick={() => handlePurchase(credit._id)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Purchase
                      </button>
                    ) : (
                      <div className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium text-center">
                        {user?.role === 'project_developer' ? 'Developers cannot purchase' : 
                         user?.role === 'regulatory_body' ? 'Regulators cannot purchase' : 
                         'Login to purchase'}
                      </div>
                    )}
                    
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Details
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Listed {formatDate(credit.marketplace?.listedAt || credit.createdAt)}</span>
                    <div className="flex items-center gap-1">
                      <Leaf className="h-3 w-3 text-green-500" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Market Statistics */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Market Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {credits.length}
              </div>
              <p className="text-gray-600 text-sm">Listed Projects</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatNumber(credits.reduce((sum, c) => sum + c.amount, 0))}
              </div>
              <p className="text-gray-600 text-sm">Total Credits (tCO₂)</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {credits.length > 0 ? formatCurrency(credits.reduce((sum, c) => sum + (c.price?.amount || 25), 0) / credits.length) : '$0'}
              </div>
              <p className="text-gray-600 text-sm">Avg. Price per Credit</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {new Set(credits.map(c => c.project?.type)).size}
              </div>
              <p className="text-gray-600 text-sm">Project Types</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditMarketplace;