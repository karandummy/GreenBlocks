import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  ArrowLeft, Wallet, ShoppingBag, Loader
} from 'lucide-react';
import { ethers } from "ethers";
import { BrowserProvider, Contract, formatUnits } from "ethers";

// Mock service - replace with actual import
const marketplaceService = {
  async getMyListings() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/marketplace/my-listings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async listCredits(data) {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/marketplace/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async checkTokenBalance(walletAddress) {
    if (typeof window.ethereum === "undefined") {
      throw new Error("MetaMask not installed");
    }

    const tokenAddress = "0x555ab359988f83854eB2A89B1841E4fA5A6592b2";
    const balanceOfABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];

    const provider = new BrowserProvider(window.ethereum);
    const contract = new Contract(tokenAddress, balanceOfABI, provider);

    try {
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals()
      ]);

      const formattedBalance = parseFloat(formatUnits(balance, decimals));
      return formattedBalance;
    } catch (error) {
      console.error("Error checking token balance:", error);
      throw error;
    }
  },

  async connectWallet() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    return accounts[0];
  }
};

const creditClaimService = {
  async getMyClaims() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/claims/my-claims', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

const SellCreditsPage = () => {
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [listedClaimIds, setListedClaimIds] = useState(new Set());
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [creditsToSell, setCreditsToSell] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      setFetchingData(true);
      await checkWalletConnection();
      await Promise.all([
        fetchApprovedClaims(),
        fetchListedClaims()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      setError('Failed to initialize page');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchListedClaims = async () => {
    try {
      const response = await marketplaceService.getMyListings();
      
      if (response.success) {
        // Get claim IDs that are currently listed (active or partial)
        const listedIds = new Set(
          response.listings
            .filter(listing => ['active', 'partial'].includes(listing.status))
            .map(listing => listing.creditClaim?._id || listing.creditClaim)
        );
        setListedClaimIds(listedIds);
      }
    } catch (error) {
      console.error('Fetch listed claims error:', error);
    }
  };

  const fetchApprovedClaims = async () => {
    try {
      const response = await creditClaimService.getMyClaims();
      
      if (response.success) {
        // Filter only approved claims that have credits issued
        const approved = response.claims.filter(
          claim => claim.status === 'approved' && 
                   claim.creditIssuance?.creditsIssued === true &&
                   claim.creditIssuance?.approvedCredits > 0
        );
        setApprovedClaims(approved);
      }
    } catch (error) {
      console.error('Fetch claims error:', error);
      setError('Failed to fetch approved claims');
    }
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          await fetchTokenBalance(address);
        } else {
          const newAccounts = await marketplaceService.connectWallet();
          setWalletAddress(newAccounts);
          await fetchTokenBalance(newAccounts);
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } catch (error) {
        console.error('Wallet connection error:', error);
        setError('Failed to connect wallet. Please install MetaMask.');
      }
    } else {
      setError('MetaMask not detected. Please install MetaMask to continue.');
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setWalletAddress('');
      setWalletBalance(0);
    } else {
      setWalletAddress(accounts[0]);
      await fetchTokenBalance(accounts[0]);
    }
  };

  const fetchTokenBalance = async (address) => {
    try {
      const balance = await marketplaceService.checkTokenBalance(address);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Balance fetch error:', error);
      setWalletBalance(0);
    }
  };

  const isClaimListed = (claimId) => {
    return listedClaimIds.has(claimId);
  };

  const handleListCredits = async () => {
    setError('');
    setSuccess('');

    if (!selectedClaim) {
      setError('Please select a claim');
      return;
    }

    // Check if already listed
    if (isClaimListed(selectedClaim._id)) {
      setError('These credits are already listed in the marketplace');
      return;
    }

    if (!creditsToSell || parseFloat(creditsToSell) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const creditsAmount = parseFloat(creditsToSell);

    if (creditsAmount > selectedClaim.creditIssuance.approvedCredits) {
      setError(`Cannot sell more than ${selectedClaim.creditIssuance.approvedCredits} credits`);
      return;
    }

    if (creditsAmount > walletBalance) {
      setError(`Insufficient token balance. You have ${walletBalance} credits in your wallet.`);
      return;
    }

    try {
      setLoading(true);
      
      const response = await marketplaceService.listCredits({
        claimId: selectedClaim._id,
        creditsToSell: creditsAmount
      });

      if (response.success) {
        setSuccess(`Successfully listed ${creditsAmount} credits for sale!`);
        setSelectedClaim(null);
        setCreditsToSell('');
        
        // Refresh data
        await Promise.all([
          fetchApprovedClaims(),
          fetchListedClaims(),
          fetchTokenBalance(walletAddress)
        ]);
      } else {
        setError(response.message || 'Failed to list credits');
      }
    } catch (error) {
      console.error('List credits error:', error);
      setError(error.message || 'Failed to list credits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMaxCreditsToSell = () => {
    if (!selectedClaim) return 0;
    return Math.min(
      selectedClaim.creditIssuance.approvedCredits,
      walletBalance
    );
  };

  // Filter out already listed claims for display
  const availableClaims = approvedClaims.filter(claim => !isClaimListed(claim._id));

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.button
          whileHover={{ x: -5 }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </motion.button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sell Carbon Credits</h1>
              <p className="text-gray-600">List your approved credits on the marketplace</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
            >
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-800">{success}</p>
            </motion.div>
          )}

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-gray-900">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Token Balance</p>
                <p className="text-2xl font-bold text-green-600">{walletBalance.toFixed(2)}</p>
                <p className="text-xs text-gray-500">credits available</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Fixed Price: 0.001 ETH per credit</p>
                <p className="text-sm text-blue-700">All credits are sold at this standard rate on Sepolia testnet</p>
              </div>
            </div>
          </div>

          {listedClaimIds.size > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Already Listed Credits</p>
                  <p className="text-sm text-yellow-700">
                    You have {listedClaimIds.size} claim{listedClaimIds.size > 1 ? 's' : ''} currently listed in the marketplace. 
                    These won't appear in the selection below.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Approved Credit Claim
            </label>
            
            {availableClaims.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  {approvedClaims.length === 0 
                    ? 'No approved credits available' 
                    : 'All your approved credits are already listed'}
                </p>
                <p className="text-sm text-gray-500">
                  {approvedClaims.length === 0 
                    ? 'Submit a credit claim and get it approved first'
                    : 'You can manage your listings from the marketplace'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableClaims.map((claim) => (
                  <motion.div
                    key={claim._id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedClaim(claim);
                      const maxCredits = Math.min(
                        claim.creditIssuance.approvedCredits,
                        walletBalance
                      );
                      setCreditsToSell(maxCredits.toString());
                    }}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedClaim?._id === claim._id
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{claim.project?.name || 'Unknown Project'}</h3>
                        <p className="text-sm text-gray-600">Claim ID: {claim.claimId}</p>
                      </div>
                      {selectedClaim?._id === claim._id && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Approved Credits</p>
                        <p className="text-2xl font-bold text-green-600">
                          {claim.creditIssuance.approvedCredits}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Project Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {claim.project?.type?.replace(/_/g, ' ') || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {claim.project?.location?.state || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {selectedClaim && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Credits to Sell (Auto-set to Maximum)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={creditsToSell}
                  readOnly
                  max={getMaxCreditsToSell()}
                  min="1"
                  step="0.01"
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-lg font-semibold text-gray-900 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg">
                  Max
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                All {creditsToSell} credits from this claim will be listed for sale
              </p>
              
              {creditsToSell && parseFloat(creditsToSell) > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Earnings:</span>
                    <span className="text-xl font-bold text-green-600">
                      {(parseFloat(creditsToSell) * 0.001).toFixed(4)} ETH
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleListCredits}
              disabled={!selectedClaim || !creditsToSell || loading || parseFloat(creditsToSell) <= 0}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                !selectedClaim || !creditsToSell || loading || parseFloat(creditsToSell) <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Listing...
                </span>
              ) : (
                'List Credits for Sale'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellCreditsPage;