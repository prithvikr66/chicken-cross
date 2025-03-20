import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

router.get("/pending-withdrawals", async (req, res) => {
  try {
    const { data: withdrawals, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_type", "withdrawal")
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending withdrawals:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch pending withdrawals" });
    }

    res.status(200).json({ success: true, withdrawals });
  } catch (err) {
    console.error("Error in /api/admin/pending-withdrawals route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/completed-transactions", async (req, res) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: "Invalid transactions data" });
  }

  try {
    // Update each transaction in the database
    for (const tx of transactions) {
      const { id, signature, status, updated_at } = tx;

      // Step 1: Fetch the transaction details
      const { data: transactionData, error: fetchError } = await supabase
        .from("transactions")
        .select("amount, wallet_address")
        .eq("id", id)
        .single();

      if (fetchError || !transactionData) {
        console.error("Error fetching transaction details:", fetchError);
        return res.status(500).json({ error: "Failed to fetch transaction details" });
      }

      const { amount, wallet_address } = transactionData;

      // Step 2: If status is "failed", add the amount back to the user's account
      if (status === "failed") {
        // Fetch the user's current balance
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("account_balance")
          .eq("wallet_address", wallet_address)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user details:", userError);
          return res.status(500).json({ error: "Failed to fetch user details" });
        }

        const currentBalance = userData.account_balance;
        const newBalance = currentBalance + amount; // Add the amount back

        // Update the user's balance
        const { error: updateBalanceError } = await supabase
          .from("users")
          .update({ account_balance: newBalance })
          .eq("wallet_address", wallet_address);

        if (updateBalanceError) {
          console.error("Error updating user balance:", updateBalanceError);
          return res.status(500).json({ error: "Failed to update user balance" });
        }
      }

      // Step 3: Update the transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status, signature, updated_at })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return res.status(500).json({ error: "Failed to update transaction status" });
      }
    }

    // Return success response
    res.status(200).json({ success: true, message: "Transactions updated successfully" });
  } catch (err) {
    console.error("Error in /api/admin/completed-transactions route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const adminRoutes = router;
