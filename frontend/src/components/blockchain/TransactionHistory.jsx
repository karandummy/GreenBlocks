import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar,
  Hash,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { blockchainService } from '../../services/blockchain.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber } from '../../utils/helpers';

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await blockchainService.getTransactions({
        address: user?.walletAddress
      });
      
      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error('Transaction fetch error:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'mint':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'transfer':
        return <ArrowUpRight className="h-5 w-5 text-blue-600" />;
      case 'burn':
        return <Zap className="h-5 w-5 text-red-600" />;
      default:
        return <Hash className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'mint':
        return 'bg-green-50 border-green-200';
      case 'transfer':
        return 'bg-blue-50 border-blue-200';
      case 'burn':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchTerm || 
      tx.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View all blockchain transactions for your account</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by transaction hash or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              <option value="mint">Mint</option>
              <option value="transfer">Transfer</option>
              <option value="burn">Burn</option>
              <option value="approve">Approve</option>
            </select>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Hash className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">No blockchain transactions match your search criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <motion.div
                  key={tx._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg border ${getTransactionColor(tx.type)}`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 capitalize">{tx.type}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'success' ? 'bg-green-100 text-green-800' :
                            tx.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Hash: <span className="font-mono">{tx.transactionHash}</span></p>
                          {tx.from && <p>From: <span className="font-mono">{tx.from}</span></p>}
                          {tx.to && <p>To: <span className="font-mono">{tx.to}</span></p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatNumber(tx.amount)} Credits
                      </p>
                      <p className="text-sm text-gray-600">Token #{tx.tokenId}</p>
                      <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                      
                      <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        View on Explorer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;