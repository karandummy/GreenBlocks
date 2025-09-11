import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Plus, 
  Send, 
  Trash2, 
  Eye,
  Award,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBlockchain } from '../../hooks/useBlockchain';
import { blockchainService } from '../../services/blockchain.service';
import { toast } from 'react-hot-toast';
import { formatNumber } from '../../utils/helpers';
import Modal from '../common/Modal';

const TokenManager = () => {
  const { user } = useAuth();
  const { account, connected, connectWallet } = useBlockchain();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [mintForm, setMintForm] = useState({
    to: '',
    tokenId: '',
    amount: '',
    metadata: ''
  });

  useEffect(() => {
    if (connected) {
      fetchTokens();
    }
  }, [connected]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      // Mock token data for demonstration
      setTokens([
        {
          tokenId: 1,
          name: 'Solar Farm Credit',
          balance: 1000,
          totalSupply: 5000,
          metadata: { project: 'Solar Farm Maharashtra', vintage: 2024 }
        },
        {
          tokenId: 2,
          name: 'Wind Energy Credit',
          balance: 500,
          totalSupply: 2000,
          metadata: { project: 'Wind Energy Tamil Nadu', vintage: 2024 }
        }
      ]);
    } catch (error) {
      console.error('Token fetch error:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    try {
      const response = await blockchainService.mintTokens({
        to: mintForm.to,
        tokenId: parseInt(mintForm.tokenId),
        amount: parseInt(mintForm.amount),
        metadata: JSON.parse(mintForm.metadata || '{}')
      });

      if (response.success) {
        toast.success('Tokens minted successfully!');
        setShowMintModal(false);
        setMintForm({ to: '', tokenId: '', amount: '', metadata: '' });
        fetchTokens();
      }
    } catch (error) {
      toast.error(error.message || 'Minting failed');
    }
  };

  const handleTransfer = async (transferData) => {
    try {
      const response = await blockchainService.transferTokens(transferData);
      if (response.success) {
        toast.success('Transfer successful!');
        setShowTransferModal(false);
        fetchTokens();
      }
    } catch (error) {
      toast.error(error.message || 'Transfer failed');
    }
  };

  const handleBurn = async (burnData) => {
    try {
      const response = await blockchainService.burnTokens(burnData);
      if (response.success) {
        toast.success('Tokens burned successfully!');
        setShowBurnModal(false);
        fetchTokens();
      }
    } catch (error) {
      toast.error(error.message || 'Burn failed');
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
          <Coins className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to manage tokens</p>
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Manager</h1>
          <p className="text-gray-600">Manage your carbon credit tokens on the blockchain</p>
        </div>

        {/* Wallet Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Connected Wallet</h2>
              <p className="text-gray-600 font-mono">{account}</p>
            </div>
            
            {user?.role === 'regulatory_body' && (
              <button
                onClick={() => setShowMintModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Mint Tokens
              </button>
            )}
          </div>
        </div>

        {/* Token List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Tokens</h2>
          </div>

          {tokens.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
              <p className="text-gray-600">You don't have any tokens yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tokens.map((token) => (
                <motion.div
                  key={token.tokenId}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{token.name}</h3>
                        <p className="text-sm text-gray-600">Token ID: {token.tokenId}</p>
                        <p className="text-xs text-gray-500">{token.metadata.project} • Vintage {token.metadata.vintage}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatNumber(token.balance)}</p>
                        <p className="text-sm text-gray-600">Your Balance</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatNumber(token.totalSupply)}</p>
                        <p className="text-sm text-gray-600">Total Supply</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTransferModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Transfer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedToken(token);
                            setShowBurnModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Burn"
                        >
                          <Zap className="h-4 w-4" />
                        </button>
                        
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mint Modal */}
        <Modal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
          title="Mint New Tokens"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
              <input
                type="text"
                value={mintForm.to}
                onChange={(e) => setMintForm({...mintForm, to: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0x..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Token ID</label>
              <input
                type="number"
                value={mintForm.tokenId}
                onChange={(e) => setMintForm({...mintForm, tokenId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={mintForm.amount}
                onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (JSON)</label>
              <textarea
                rows={3}
                value={mintForm.metadata}
                onChange={(e) => setMintForm({...mintForm, metadata: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder='{"project": "Solar Farm", "vintage": 2024}'
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowMintModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mint Tokens
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TokenManager;