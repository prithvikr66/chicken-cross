import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export const useHandleDeposits = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleDeposits = async (amount: number) => {
    if (!publicKey) return;
    setLoading(true);

    try {
      // Convert amount from SOL to lamports
      const lamports = BigInt(Math.round(amount * 1_000_000_000)); 

      // 1. Get transfer session from backend
      const sessionResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/transactions/deposits/create-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            walletAddress: publicKey.toString(),
          }),
        }
      );

      const { sessionId, masterWallet } = await sessionResponse.json();
  
      // Create a transaction to transfer lamports
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(masterWallet),
          lamports,
        })
      );


      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight }
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, { minContextSlot });
      const confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }

      // Verify the transaction with the backend
      const verifyResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/transactions/deposits/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            signature,
            amount,
            walletAddress: publicKey.toString(),
          }),
        }
      );

      const result = await verifyResponse.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error("Transfer failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { handleDeposits, loading };
};