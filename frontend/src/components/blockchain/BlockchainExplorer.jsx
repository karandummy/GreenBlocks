import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Hash, 
  Layers, 
  Clock, 
  Eye,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { blockchainService } from '../../services/blockchain.service';
import { toast } from 'react-hot-toast';
import { formatDate, copyToClipboard } from '../../utils/helpers';

const BlockchainExplorer = () => {
  const [searchType, setSearchType] = useState('transaction');
  const [searchValue, setSearchValue] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setLoading(true);
    setSearchResult(null);

    try {
      let result;
      if (searchType === 'transaction') {
        result = await blockchainService.getTransactionByHash(searchValue);
      } else if (searchType === 'block') {
        result = await blockchainService.getBlockInfo(parseInt(searchValue));
      }

      if (result.success) {
        setSearchResult(result);
      } else {
        toast.error('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, type) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
      toast.success('Copied to clipboard');
    }
  };

  const CopyButton = ({ text, type, label }) => (
    <button
      onClick={() => handleCopy(text, type)}
      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      title={`Copy ${label}`}
    >
      {copied === type ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Explorer</h1>
          <p className="text-gray-600">Search and explore blockchain transactions and blocks</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="transaction">Transaction Hash</option>
              <option value="block">Block Number</option>
            </select>
            
            <div className="flex-1">
              <input
                type="text"
                placeholder={searchType === 'transaction' ? 'Enter transaction hash (0x...)' : 'Enter block number'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {searchType === 'transaction' ? 'Transaction Details' : 'Block Details'}
            </h2>

            {searchType === 'transaction' && searchResult.transaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Hash</label>
                    <div className="flex items-center">
                      <span className="font-mono text-sm bg-gray-100 p-2 rounded flex-1">
                        {searchResult.transaction.hash}
                      </span>
                      <CopyButton text={searchResult.transaction.hash} type="hash" label="hash" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block Number</label>
                    <span className="text-sm">{searchResult.transaction.blockNumber}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      searchResult.transaction.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {searchResult.transaction.status === 'success' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {searchResult.transaction.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gas Used</label>
                    <span className="text-sm">{searchResult.transaction.gasUsed?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {searchType === 'block' && searchResult.block && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Block Number</label>
                    <span className="font-mono text-sm">{searchResult.block.number}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <span className="text-sm">{formatDate(new Date(searchResult.block.timestamp * 1000))}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Count</label>
                    <span className="text-sm">{searchResult.block.transactions?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Network Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-gray-600 text-sm">Latest Block</p>
                <p className="text-2xl font-bold text-gray-900">12,345,678</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-gray-600 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">1,234,567</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-gray-600 text-sm">Avg Block Time</p>
                <p className="text-2xl font-bold text-gray-900">15s</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;