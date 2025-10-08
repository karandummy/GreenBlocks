import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
   const [error, setError] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authService.verifyToken();
          if (response.success) setUser(response.user);
          else localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Wallet connect function
const connectWallet = async () => {
  try {
    if (!window.ethereum) throw new Error('MetaMask not installed');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const walletAddress = accounts[0];

    const message = `Welcome to the Carbon Credit Platform!\n\nWallet: ${walletAddress}\n\nPlease sign this message to verify your ownership.`;
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });

    toast.success('Wallet connected & verified successfully!');
    
    // ✅ Return only the string
    return walletAddress;
  } catch (error) {
    toast.error(error.message || 'Wallet connection failed');
    console.error('Wallet connection error:', error);
    return null;
  }
};


  // ✅ Check if wallet already exists in DB
  const verifyWallet = async (walletAddress) => {
    try {
      const response = await authService.verifyWallet(walletAddress);
      return response;
    } catch (error) {
      console.error('Wallet verification error:', error);
      return { success: false, exists: false };
    }
  };

  // ✅ Register
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // ✅ Login
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    connectWallet,
    verifyWallet,
    loading
  };

  // console.log(user);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
