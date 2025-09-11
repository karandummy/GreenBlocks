import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Award,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { creditService } from '../../services/credit.service';
import { toast } from 'react-hot-toast';
import { formatDate, formatNumber, formatCurrency } from '../../utils/helpers';

const CreditHistory = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('credits');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchCreditHistory();
  }, []);

  const fetchCreditHistory = async () => {
    try {
      setLoading(true);
      const response = await creditService.getMyCredits();
      if (response.success) {
        const userCredits = response.credits || [];
        setCredits(userCredits);
        
        // Extract transactions from credits
        const allTransactions = [];
        userCredits.forEach(credit => {
          // Add issuance transaction
          allTransactions.push({
            id: `issue_${credit._id}`,
            type: 'issued',
            credit: credit,
            amount: credit.amount,
            date: credit.createdAt,
            description: `${formatNumber(credit.amount)} credits issued from ${credit.project?.name}`,
            price: null
          });

          // Add transfer transactions
          if (credit.transfers) {
            credit.transfers.forEach((transfer, index) => {
              allTransactions.push({
                id: `transfer_${credit._id}_${index}`,
                type: transfer.to === user._id ? 'received' : 'sent',
                credit: credit,
                amount: transfer.amount,
                date: transfer.timestamp,
                description: `${formatNumber(transfer.amount)} credits ${transfer.to === user._id ? 'purchased' : 'sold'}`,
                price: transfer.price
              });
            });
          }

          // Add retirement transaction if retired
          if (credit.status === 'retired') {
            allTransactions.push({
              id: `retire_${credit._id}`,
              type: 'retired',
              credit: credit,
              amount: credit.amount,
              date: credit.updatedAt,
              description: `${formatNumber(credit.amount)} credits retired for offsetting`,
              price: null
            });
          }
        });

        setTransactions(allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (error) {
      console.error('Credit history fetch error:', error);
      toast.error('Failed to load credit history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      issued: { color: 'bg-green-100 text-green-800', text: 'Active' },
      listed: { color: 'bg-blue-100 text-blue-800', text: 'Listed' },
      sold: { color: 'bg-purple-100 text-purple-800', text: 'Sold' },
      retired: { color: 'bg-gray-100 text-gray-800', text: 'Retired' }
    };

    const config = statusConfig[status] || statusConfig.issued;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'issued':
        return <Award className="h-4 w-4 text-green-600" />;
      case 'received':
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case 'sent':
        return <ArrowUpRight className="h-4 w-4 text-orange-600" />;
      case 'retired':
        return <RotateCcw className="h-4 w-4 text-gray-600" />;
      default:
        return <Award className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'issued':
        return 'border-l-green-500 bg-green-50';
      case 'received':
        return 'border-l-blue-500 bg-blue-50';
      case 'sent':
        return 'border-l-orange-500 bg-orange-50';
      case 'retired':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const filteredCredits = credits.filter(credit => {
    const matchesSearch = !searchTerm || 
      credit.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.creditId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.credit.creditId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
  const activeCredits = credits.filter(c => c.status === 'issued').reduce((sum, credit) => sum + credit.amount, 0);
  const retiredCredits = credits.filter(c => c.status === 'retired').reduce((sum, credit) => sum + credit.amount, 0);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Credit History</h1>
          <p className="text-gray-600">View your carbon credit portfolio and transaction history</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-gray-600 text-sm">Total Credits</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(totalCredits)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-gray-600 text-sm">Active Credits</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(activeCredits)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-gray-600 text-sm">Retired Credits</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(retiredCredits)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('credits')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'credits'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Credits ({credits.length})
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'transactions'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Transaction History ({transactions.length})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              {activeTab === 'credits' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Status</option>
                  <option value="issued">Active</option>
                  <option value="listed">Listed</option>
                  <option value="sold">Sold</option>
                  <option value="retired">Retired</option>
                </select>
              )}

              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'credits' ? (
          // Credits Tab
          <div className="bg-white rounded-lg shadow-md">
            {filteredCredits.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No credits found</h3>
                <p className="text-gray-600">
                  {credits.length === 0 
                    ? "You don't have any credits yet."
                    : "No credits match your current filters."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Credit ID</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Project</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Vintage</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCredits.map((credit) => (
                      <tr key={credit._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm">{credit.creditId}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{credit.project?.name}</p>
                            <p className="text-sm text-gray-600">{credit.project?.type?.replace('_', ' ')}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold">
                          {formatNumber(credit.amount)} tCO₂
                        </td>
                        <td className="py-4 px-6">{credit.vintage}</td>
                        <td className="py-4 px-6">{getStatusBadge(credit.status)}</td>
                        <td className="py-4 px-6 text-gray-600">
                          {formatDate(credit.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <Link
                            to={`/credits/${credit._id}`}
                            className="text-blue-600 hover:text-blue-700 mr-3"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Transactions Tab
          <div className="bg-white rounded-lg shadow-md">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">No transaction history available.</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-l-4 rounded-lg p-4 ${getTransactionColor(transaction.type)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              Credit ID: {transaction.credit.creditId}
                              {transaction.price && (
                                <span className="ml-2">• Price: {formatCurrency(transaction.price)} per credit</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatNumber(transaction.amount)} tCO₂</p>
                          <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditHistory;