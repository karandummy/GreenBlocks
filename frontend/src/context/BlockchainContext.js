import React, { createContext, useContext, useState, useEffect } from 'react';

const BlockchainContext = createContext();

export const useBlockchainContext = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchainContext must be used within a BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Mock blockchain connection for development
  useEffect(() => {
    // Initialize mock blockchain connection
    const mockConnection = {
      isConnected: false,
      account: null,
      balance: 0
    };
    
    setConnected(false);
    console.log('Blockchain context initialized (mock mode)');
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Mock wallet connection
      const mockAccount = '0x742d35Cc6634C0532925a3b8D46644C7d3EF8E7b';
      setAccount(mockAccount);
      setConnected(true);
      
      return { success: true, account: mockAccount };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setConnected(false);
    setWeb3(null);
    setContract(null);
  };

  const getBalance = async (address) => {
    try {
      // Mock balance
      return '1000.0';
    } catch (error) {
      console.error('Get balance error:', error);
      return '0';
    }
  };

  const sendTransaction = async (transactionData) => {
    try {
      setLoading(true);
      
      // Mock transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      return {
        success: true,
        transactionHash: mockTxHash,
        blockNumber: 12345
      };
    } catch (error) {
      console.error('Send transaction error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    web3,
    account,
    contract,
    connected,
    loading,
    connectWallet,
    disconnectWallet,
    getBalance,
    sendTransaction
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};