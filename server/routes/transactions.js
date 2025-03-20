import express from "express";
import { Connection, PublicKey } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { validateTransaction } from "../utils/transactions.js";
const connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");
const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

const transferSessions = new Map();

const processedSignatures = new Set();

const router = express.Router();

router.get("/fetch-transactions", async (req, res) => {
  const { wallet_address } = req.query;

  if (!wallet_address) {
    return res.status(400).json({ error: "wallet_address is required" });
  }

  try {
    // Fetch the latest 20 transactions for the specified wallet address
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_address", wallet_address) // Filter by wallet address
      .order("created_at", { ascending: false }) // Sort by created_at in descending order (newest first)
      .limit(20); // Limit to 20 transactions

    if (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this wallet address" });
    }

    // Return the transactions (latest first, oldest last)
    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error in /fetch-transactions route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/deposits/create-session", async (req, res) => {
  try {
    const { amount, walletAddress } = req.body;

    if (!amount || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create session
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      amount,
      walletAddress,
      createdAt: Date.now(),
      status: "pending",
    };

    transferSessions.set(sessionId, session);
    setTimeout(() => {
      transferSessions.delete(sessionId);
    }, 30 * 60 * 1000);

    res.json({
      sessionId,
      masterWallet: process.env.MASTER_WALLET_ADDRESS,
    });
  } catch (error) {
    console.error("Session creation failed:", error);
    res.status(500).json({ error: "Failed to create transfer session" });
  }
});

router.post("/deposits/verify", async (req, res) => {
  try {
    const { sessionId, signature, amount, walletAddress } = req.body;
    const session = transferSessions.get(sessionId);
    if (
      !session ||
      session.walletAddress !== walletAddress ||
      session.amount !== amount
    ) {
      return res.status(400).json({ error: "Invalid session" });
    }
    if (processedSignatures.has(signature)) {
      return res.status(400).json({ error: "Transaction already processed" });
    }

    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });

    if (!tx) {
      return res.status(400).json({ error: "Transaction not found" });
    }

    const isValid = await validateTransaction(tx, {
      amount,
      senderWallet: walletAddress,
      masterWallet: process.env.MASTER_WALLET_ADDRESS,
    });

    if (!isValid) {
      return res.status(400).json({ error: "Invalid transaction" });
    }

    const txTimestamp = tx.blockTime * 1000;
    if (Date.now() - txTimestamp > 5 * 60 * 1000) {
      return res.status(400).json({ error: "Transaction too old" });
    }

    const { data: txnData, error: txnError } = await supabase
      .from("transactions")
      .insert({
        wallet_address: walletAddress,
        transaction_type: "deposit",
        status: "successful",
        signature: signature,
        amount: amount,
      });

    if (txnError) {
      throw txnError;
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError) {
      throw userError;
    }
    const newBalance = (userData.account_balance || 0) + amount;

    const { error: updateError } = await supabase
      .from("users")
      .update({ account_balance: newBalance })
      .eq("wallet_address", walletAddress);

    if (updateError) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("signature", signature);
      throw updateError;
    }
    processedSignatures.add(signature);
    transferSessions.delete(sessionId);

    res.json({ success: true });
  } catch (error) {
    console.error("Transfer verification failed:", error);
    res.status(500).json({ error: "Failed to verify transfer" });
  }
});

router.post("/withdraw", async (req, res) => {
  const { wallet_address, amount, notes } = req.body;

  if (!wallet_address || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid wallet address or amount" });
  }

  try {
    // Step 1: Check if the user has a pending withdrawal request
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_address", wallet_address)
      .eq("transaction_type", "withdrawal")
      .eq("status", "pending");

    if (pendingError) {
      console.error("Error checking pending withdrawals:", pendingError);
      return res
        .status(500)
        .json({ error: "Failed to check pending withdrawals" });
    }

    // If there are pending withdrawals, return an error
    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return res
        .status(409)
        .json({ error: "You already have a pending withdrawal request" });
    }

    // Step 2: Fetch the user's current balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("wallet_address", wallet_address)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentBalance = userData.account_balance;

    // Step 3: Check if the user has enough balance to withdraw
    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Step 4: Deduct the withdrawal amount from the user's balance
    const newBalance = currentBalance - amount;
    const { error: updateError } = await supabase
      .from("users")
      .update({ account_balance: newBalance })
      .eq("wallet_address", wallet_address);

    if (updateError) {
      console.error("Error updating user balance:", updateError);
      return res.status(500).json({ error: "Failed to update user balance" });
    }

    // Step 5: Create a new withdrawal transaction
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          wallet_address,
          amount: amount,
          transaction_type: "withdrawal",
          status: "pending",
          notes,
        },
      ])
      .select();

    if (transactionError) {
      console.error("Error creating withdrawal transaction:", transactionError);
      return res
        .status(500)
        .json({ error: "Failed to create withdrawal transaction" });
    }

    // Step 6: Return the created transaction
    res.status(201).json({ success: true, transaction });
  } catch (err) {
    console.error("Error in /api/withdraw route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/game-history", async (req, res) => {
  const walletAddress = req.query.wallet_address;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_wag, total_won, total_bets")
      .eq("wallet_address", walletAddress)
      .single();
    if (userError) throw userError;

    const { data: transactions, error: transactionsError } = await supabase
      .from("game_history")
      .select("*")
      .eq("wallet_address", walletAddress)
      .order("created_at", { ascending: false })
      .limit(20);

    if (transactionsError) throw transactionsError;

    const response = {
      user_stats: {
        total_wag: userData.total_wag,
        total_won: userData.total_won,
        total_bets: userData.total_bets,
      },
      transactions: transactions,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const transactionRoutes = router;
