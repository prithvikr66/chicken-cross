import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Custom hook to handle wallet changes
export const useWalletSync = () => {
  const { publicKey, wallet, disconnect, connected } = useWallet();
  const [lastConnectedWallet, setLastConnectedWallet] = useState(null);
  
  useEffect(() => {
    // Store a reference to the active wallet
    if (connected && wallet) {
        // @ts-ignore
      setLastConnectedWallet(wallet.adapter.name);
    }
    
    // Function to check if wallet has changed in extension
    const checkWalletChange = async () => {
      if (!connected || !wallet) return;
      
      try {
        // For Phantom
        // @ts-ignore
        if (wallet.adapter.name === 'Phantom' && window.phantom?.solana) {
        // @ts-ignore
          const currentPhantomPublicKey = window.phantom.solana.publicKey?.toString();
          if (currentPhantomPublicKey !== publicKey?.toString() && publicKey) {
            console.log('Phantom wallet changed, reconnecting...');
            await disconnect();
          }
        }
        
        // For Solflare
        // @ts-ignore
        if (wallet.adapter.name === 'Solflare' && window.solflare?.publicKey) {
        // @ts-ignore
          const currentSolflarePublicKey = window.solflare.publicKey?.toString();
          if (currentSolflarePublicKey !== publicKey?.toString() && publicKey) {
            console.log('Solflare wallet changed, reconnecting...');
            await disconnect();
          }
        }
      } catch (error) {
        console.error('Error checking wallet change:', error);
      }
    };
    
    // Poll for wallet changes
    const intervalId = setInterval(checkWalletChange, 1000);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
    };
  }, [publicKey, wallet, disconnect, connected]);
  
  return {
    activeWallet: wallet?.adapter.name,
    lastConnectedWallet,
    isWalletChanged: connected && lastConnectedWallet && lastConnectedWallet !== wallet?.adapter.name
  };
};