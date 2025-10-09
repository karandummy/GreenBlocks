import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Search, Filter, MapPin, Award, 
  User, Wallet, CheckCircle, X, Loader, AlertCircle
} from 'lucide-react';
import { ethers } from 'ethers';

const API_BASE_URL = 'http://localhost:5000/api';

const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [paymentTxHash, setPaymentTxHash] = useState('');

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    await checkWalletConnection();
    await fetchListings();
  };

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          await updateWalletBalance(accounts[0]);
        } else {
          const newAccounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          setWalletAddress(newAccounts[0]);
          await updateWalletBalance(newAccounts[0]);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
      }
    }
  };

  const updateWalletBalance = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(address);
      setWalletBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Balance fetch error:', err);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/marketplace/listings?status=active`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error('Fetch listings error:', err);
      setError('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || listing.project?.type === filterType;
    return matchesSearch && matchesFilter && 
           (listing.status === 'active' || listing.status === 'partial');
  });

  const handlePurchaseClick = (listing) => {
    if (!walletAddress) {
      alert('Please connect your MetaMask wallet first');
      return;
    }
    setSelectedListing(listing);
    setPurchaseAmount('');
    setPaymentTxHash('');
    setError('');
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    const amount = parseFloat(purchaseAmount);
    
    // Validation
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > selectedListing.creditsAvailable) {
      setError(`Maximum available credits: ${selectedListing.creditsAvailable}`);
      return;
    }

    if (!walletAddress) {
      setError('Please connect your MetaMask wallet');
      return;
    }

    if (!selectedListing.seller?.walletAddress) {
      setError('Seller wallet address not found');
      return;
    }

    const totalCost = amount * selectedListing.pricePerCredit;

    try {
      setPurchasing(true);
      setError('');

      console.log('=== Starting Purchase Process ===');
      console.log('Credits to buy:', amount);
      console.log('Price per credit:', selectedListing.pricePerCredit, 'ETH');
      console.log('Total cost:', totalCost, 'ETH');
      console.log('Buyer:', walletAddress);
      console.log('Seller:', selectedListing.seller.walletAddress);

      // Step 1: Initialize provider and check network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString());

      // Step 2: Check wallet balance
      console.log('\n💰 Checking wallet balance...');
      const balance = await provider.getBalance(walletAddress);
      const balanceInEth = parseFloat(ethers.formatEther(balance));
      
      console.log('Current balance:', balanceInEth, 'ETH');
      console.log('Required amount:', totalCost, 'ETH');
      console.log('Estimated gas:', '~0.001-0.01 ETH');

      // Check if sufficient balance (with buffer for gas)
      const requiredWithBuffer = totalCost + 0.01;
      if (balanceInEth < requiredWithBuffer) {
        const shortage = requiredWithBuffer - balanceInEth;
        setError(
          `Insufficient funds!\n\n` +
          `Your balance: ${balanceInEth.toFixed(6)} ETH\n` +
          `Required: ${totalCost.toFixed(6)} ETH + gas (~0.01 ETH)\n` +
          `Short by: ${shortage.toFixed(6)} ETH\n\n` +
          `Please add more ETH to your wallet.`
        );
        setPurchasing(false);
        return;
      }

      // Step 3: Validate seller address
      if (!ethers.isAddress(selectedListing.seller.walletAddress)) {
        setError('Invalid seller wallet address');
        setPurchasing(false);
        return;
      }

      // Step 4: Get signer and estimate gas
      console.log('\n⛽ Estimating gas...');
      const signer = await provider.getSigner();
      
      const transactionRequest = {
        to: selectedListing.seller.walletAddress,
        value: ethers.parseEther(totalCost.toFixed(18))
      };

      let estimatedGas;
      try {
        estimatedGas = await provider.estimateGas(transactionRequest);
        console.log('Estimated gas:', estimatedGas.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        setError(
          'Transaction simulation failed. This could mean:\n' +
          '1. Insufficient funds for gas\n' +
          '2. Network congestion\n' +
          '3. Invalid recipient address\n\n' +
          'Error: ' + (gasError.shortMessage || gasError.message)
        );
        setPurchasing(false);
        return;
      }

      // Step 5: Send ETH payment to seller
      console.log('\n💳 Sending ETH payment to seller...');
      console.log('Transaction details:', {
        to: selectedListing.seller.walletAddress,
        value: totalCost + ' ETH',
        gasLimit: (estimatedGas * 120n / 100n).toString() + ' (120% of estimate)'
      });

      let tx;
      try {
        tx = await signer.sendTransaction({
          to: selectedListing.seller.walletAddress,
          value: ethers.parseEther(totalCost.toFixed(18)),
          gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
        });
        
        console.log('✅ Transaction sent!');
        console.log('Transaction hash:', tx.hash);
      } catch (txError) {
        console.error('Transaction failed:', txError);
        
        let errorMessage = 'Transaction failed: ';
        if (txError.code === 'ACTION_REJECTED') {
          errorMessage = 'Transaction rejected by user';
        } else if (txError.code === 'INSUFFICIENT_FUNDS') {
          errorMessage = 'Insufficient funds for transaction + gas fees';
        } else if (txError.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage += txError.shortMessage || txError.message;
        }
        
        setError(errorMessage);
        setPurchasing(false);
        return;
      }

      // Step 6: Wait for confirmation
      console.log('\n⏳ Waiting for blockchain confirmation...');
      let receipt;
      try {
        receipt = await tx.wait();
        console.log('✅ Payment confirmed!');
        console.log('Block number:', receipt.blockNumber);
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('Transaction hash:', receipt.hash);
      } catch (waitError) {
        console.error('Transaction confirmation failed:', waitError);
        setError('Transaction sent but confirmation failed. Check your wallet for status.');
        setPurchasing(false);
        return;
      }

      setPaymentTxHash(receipt.hash);

      // Step 7: Call backend to transfer carbon credit tokens
      console.log('\n🔄 Processing carbon credit token transfer...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setPurchasing(false);
        return;
      }

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/marketplace/buy`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            listingId: selectedListing._id,
            creditsToBuy: amount,
            transactionHash: receipt.hash
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (data.success) {
          console.log('✅ Purchase completed successfully!');
          console.log('Token transfer hash:', data.tokenTransferHash);
          
          alert(
            `✅ Purchase Successful!\n\n` +
            `Credits Purchased: ${amount}\n` +
            `Total Cost: ${totalCost} ETH\n\n` +
            `Payment Transaction:\n${receipt.hash}\n\n` +
            `Token Transfer:\n${data.tokenTransferHash || 'Processing...'}\n\n` +
            `Carbon credits have been transferred to your wallet!`
          );
          
          setShowPurchaseModal(false);
          setPurchaseAmount('');
          setPaymentTxHash('');
          await fetchListings();
          await updateWalletBalance(walletAddress);
        } else {
          throw new Error(data.message || 'Backend purchase processing failed');
        }
      } catch (backendError) {
        console.error('Backend API error:', backendError);
        setError(
          `⚠️ Payment sent but token transfer failed!\n\n` +
          `Your payment of ${totalCost} ETH was successful.\n` +
          `Transaction: ${receipt.hash}\n\n` +
          `However, the carbon credit token transfer failed.\n` +
          `Error: ${backendError.message}\n\n` +
          `Please contact support with your transaction hash.`
        );
        setPurchasing(false);
        return;
      }

      console.log('=== Purchase Process Completed ===');

    } catch (err) {
      console.error('=== Purchase Error ===');
      console.error('Error type:', err.name);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      let userMessage = 'Transaction failed. ';
      
      if (err.code === 'INSUFFICIENT_FUNDS') {
        userMessage = 'Insufficient funds for transaction and gas fees.';
      } else if (err.code === 'ACTION_REJECTED') {
        userMessage = 'Transaction was rejected.';
      } else if (err.code === 'NETWORK_ERROR') {
        userMessage = 'Network connection error. Please try again.';
      } else if (err.code === 'TIMEOUT') {
        userMessage = 'Transaction timeout. Please check your wallet.';
      } else if (err.message) {
        userMessage += err.message;
      } else {
        userMessage += 'An unexpected error occurred.';
      }
      
      setError(userMessage);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Carbon Credit Marketplace</h1>
          <p className="text-gray-600">Buy verified carbon credits from certified projects</p>
        </div>

        {walletAddress && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected Wallet</p>
              <p className="font-mono text-sm font-medium text-gray-900">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Balance: {parseFloat(walletBalance).toFixed(4)} ETH
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateWalletBalance(walletAddress)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Refresh
              </button>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects or sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="all">All Types</option>
              <option value="renewable_energy">Renewable Energy</option>
              <option value="afforestation">Afforestation</option>
              <option value="energy_efficiency">Energy Efficiency</option>
              <option value="waste_management">Waste Management</option>
            </select>
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              {filteredListings.length} Active Listings
            </span>
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              All Credits Verified
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Blockchain Secured
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <motion.div
              key={listing._id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{listing.project?.name || 'Unknown Project'}</h3>
                    <p className="text-green-100 text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.project?.location?.state || 'N/A'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    {listing.project?.type?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-green-100 text-sm">Available Credits</p>
                    <p className="text-3xl font-bold">{listing.creditsAvailable.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-100 text-sm">Price per Credit</p>
                    <p className="text-2xl font-bold">{listing.pricePerCredit} ETH</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">SELLER INFORMATION</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <p className="font-semibold text-gray-900">{listing.seller?.name || 'Unknown'}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{listing.seller?.organization || 'N/A'}</p>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3 w-3 text-gray-400" />
                      <p className="font-mono text-xs text-gray-500">
                        {listing.seller?.walletAddress 
                          ? `${listing.seller.walletAddress.slice(0, 6)}...${listing.seller.walletAddress.slice(-4)}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <span>ID: {listing.listingId}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {listing.status === 'active' ? 'Active' : 'Partial'}
                  </span>
                </div>

                <button
                  onClick={() => handlePurchaseClick(listing)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Purchase Credits
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">No listings found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {showPurchaseModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Purchase Credits</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                disabled={purchasing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Project</p>
              <p className="font-semibold text-gray-900">{selectedListing.project?.name}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Available Credits</p>
              <p className="text-2xl font-bold text-green-600">{selectedListing.creditsAvailable}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Credits to Purchase
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  max={selectedListing.creditsAvailable}
                  min="1"
                  disabled={purchasing}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={() => setPurchaseAmount(selectedListing.creditsAvailable.toString())}
                  disabled={purchasing}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 disabled:opacity-50"
                >
                  Max
                </button>
              </div>
            </div>

            {purchaseAmount && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Credits:</span>
                  <span className="font-semibold">{parseFloat(purchaseAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Price per Credit:</span>
                  <span className="font-semibold">{selectedListing.pricePerCredit} ETH</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Cost:</span>
                  <span className="text-xl font-bold text-green-600">
                    {(parseFloat(purchaseAmount) * selectedListing.pricePerCredit).toFixed(6)} ETH
                  </span>
                </div>
              </div>
            )}

            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This will initiate a MetaMask transaction to send ETH to the seller. 
                After confirmation, carbon credit tokens will be transferred to your wallet.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                disabled={purchasing}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={!purchaseAmount || purchasing}
                className={`flex-1 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
                  !purchaseAmount || purchasing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg'
                }`}
              >
                {purchasing ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;