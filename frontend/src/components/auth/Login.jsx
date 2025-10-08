import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// const navigate = useNavigate();

const Login = () => {
  const { user, login, connectWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleConnectAndLogin = async () => {
    setLoading(true);

    try {
      // Step 1: Connect wallet and get signature
      const address = await connectWallet();
      setWalletAddress(address);

      // Step 2: Login with wallet address
      const result = await login({ walletAddress: address });

      
      if (result.success) {
        toast.success('Login successful!');
      }
 else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error); 
      
      if (error.message.includes('MetaMask')) {
        toast.error('Please install MetaMask to continue');
      } else if (error.message.includes('rejected')) {
        toast.error('Connection request rejected');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4"
          >
            <LogIn className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Connect your wallet to access GreenBlocks</p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Secure Wallet Authentication
            </h3>
            <p className="text-sm text-blue-700">
              Click the button below to connect your MetaMask wallet and sign a message for authentication. No password required!
            </p>
          </div>

          {/* Wallet Address Display */}
          {walletAddress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-green-800">Wallet Connected</p>
                  <p className="text-xs text-green-600 font-mono">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Connect & Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnectAndLogin}
            disabled={loading}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Connect Wallet & Sign In
              </>
            )}
          </motion.button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Role Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Platform Roles:</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span><strong>Project Developer:</strong> Register and manage projects</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span><strong>Credit Buyer:</strong> Browse and purchase credits</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span><strong>Regulatory Body:</strong> Approve and verify projects</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;