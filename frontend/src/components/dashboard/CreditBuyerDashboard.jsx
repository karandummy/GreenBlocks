import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Wallet, TrendingDown, DollarSign,
  Calendar, MapPin, User, Package, ArrowDownRight,
  Loader, AlertCircle, RefreshCw
} from 'lucide-react';
import { ethers } from 'ethers';

const API_BASE_URL = 'http://localhost:5000/api';

const CreditBuyerDashboard = () => {
  const [stats, setStats] = useState({
    totalPurchased: 0,
    currentBalance: 0,
    offsetEmissions: 0,
    totalSpent: 0
  });

  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      await checkWalletConnection();
      await Promise.all([
        fetchStats(),
        fetchHoldings(),
        fetchTransactions()
      ]);
    } catch (err) {
      console.error('Dashboard initialization error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await fetchWalletBalance(accounts[0]);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
      }
    }
  };

  const fetchWalletBalance = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const tokenAddress = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2";
      const balanceOfABI = [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const contract = new ethers.Contract(tokenAddress, balanceOfABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals()
      ]);
      
      const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
      setWalletBalance(formattedBalance);
    } catch (err) {
      console.error('Balance fetch error:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/buyer/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchHoldings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/buyer/holdings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setHoldings(data.holdings);
      }
    } catch (err) {
      console.error('Fetch holdings error:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/buyer/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
    }
  };

  const handleRefresh = () => {
    initializeDashboard();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Carbon Credits Portfolio
            </h1>
            <p className="text-gray-600">Manage your carbon credit holdings and offset your emissions</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </motion.button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {walletAddress && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm font-medium text-gray-900">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">{walletBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-500">carbon credits</p>
              </div>
            </div>
          </div>
        )}

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
            value={stats.currentBalance.toFixed(2)}
            icon={Wallet}
            color="bg-green-500"
            unit=" credits"
          />
          <StatCard
            title="CO₂ Offset"
            value={stats.offsetEmissions.toFixed(2)}
            icon={TrendingDown}
            color="bg-purple-500"
            unit=" tons"
          />
          <StatCard
            title="Total Invested"
            value={stats.totalSpent}
            icon={DollarSign}
            color="bg-orange-500"
            unit=" ETH"
          />
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/marketplace'}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl"
          >
            <ShoppingCart className="h-5 w-5" />
            Browse Marketplace
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Credit Holdings</h2>
              <span className="text-sm text-gray-600">{holdings.length} purchases</span>
            </div>

            {holdings.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No credits in your portfolio</p>
                <button 
                  onClick={() => window.location.href = '/marketplace'}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Purchase Credits
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {holdings.map((holding) => (
                  <motion.div
                    key={holding._id}
                    whileHover={{ x: 5 }}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {holding.project?.name || 'Unknown Project'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {holding.project?.location?.state || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {holding.seller?.name || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(holding.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Holdings</p>
                          <p className="text-2xl font-bold text-green-600">{holding.creditsOwned}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Purchase Price</p>
                          <p className="text-lg font-semibold text-gray-900">{holding.totalCost.toFixed(4)} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Per Credit</p>
                          <p className="text-lg font-semibold text-gray-900">{holding.purchasePrice.toFixed(4)} ETH</p>
                        </div>
                      </div>

                      {holding.blockchain?.tokenTransferTxHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${holding.blockchain.tokenTransferTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          View on Explorer
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 10).map((tx) => (
                  <div key={tx._id} className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Purchase</span>
                      </div>
                      <span className="text-xs text-gray-500">{tx.date}</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-1">{tx.project}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">{tx.amount} credits</p>
                      <p className="text-xs font-semibold text-gray-900">{tx.price.toFixed(4)} ETH</p>
                    </div>
                    {tx.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <p className="text-sm text-blue-600 font-medium mb-2">Average Price Paid</p>
              <p className="text-3xl font-bold text-blue-900">
                {stats.totalPurchased > 0 
                  ? (stats.totalSpent / stats.totalPurchased).toFixed(6)
                  : '0.000000'
                } ETH
              </p>
              <p className="text-xs text-blue-600 mt-1">per credit</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <p className="text-sm text-green-600 font-medium mb-2">Carbon Offset Rate</p>
              <p className="text-3xl font-bold text-green-900">100%</p>
              <p className="text-xs text-green-600 mt-1">1 credit = 1 ton CO₂</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <p className="text-sm text-purple-600 font-medium mb-2">Portfolio Value</p>
              <p className="text-3xl font-bold text-purple-900">
                {(stats.currentBalance * 0.001).toFixed(4)} ETH
              </p>
              <p className="text-xs text-purple-600 mt-1">at current market rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditBuyerDashboard;