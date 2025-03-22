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

router.get("/completed-withdrawals", async (req, res) => {
  try {
    // Fetch all completed withdrawals, ordered by created_at in descending order
    const { data: completedWithdrawals, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_type", "withdrawal")
      .eq("status", "successful")
      .order("created_at", { ascending: false }); // Newest first

    if (error) {
      console.error("Error fetching completed withdrawals:", error);
      return res.status(500).json({ error: "Failed to fetch completed withdrawals" });
    }

    // Return the list of completed withdrawals
    res.status(200).json({ success: true, withdrawals: completedWithdrawals });
  } catch (err) {
    console.error("Error in /api/admin/completed-withdrawals route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard-metrics", async (req, res) => {
  try {
    // Step 1: Fetch total number of bets
    const { count: totalBets, error: betsError } = await supabase
      .from("game_history")
      .select("*", { count: "exact", head: true });

    if (betsError) {
      console.error("Error fetching total bets:", betsError);
      return res.status(500).json({ error: "Failed to fetch total bets" });
    }

    // Step 2: Fetch total amount wagered
    const { data: totalWageredData, error: wageredError } = await supabase
      .from("game_history")
      .select("bet_amount");

    if (wageredError) {
      console.error("Error fetching total amount wagered:", wageredError);
      return res.status(500).json({ error: "Failed to fetch total amount wagered" });
    }

    const totalWagered = totalWageredData.reduce((sum, bet) => sum + bet.bet_amount, 0);

    // Step 3: Fetch total lost by players
    const { data: totalLostData, error: lostError } = await supabase
      .from("game_history")
      .select("bet_amount, cash_out_lane, crash_lane");

    if (lostError) {
      console.error("Error fetching total lost by players:", lostError);
      return res.status(500).json({ error: "Failed to fetch total lost by players" });
    }

    const totalLost = totalLostData
      .filter((bet) => bet.cash_out_lane >= bet.crash_lane) // Lost bets
      .reduce((sum, bet) => sum + bet.bet_amount, 0);

    // Step 4: Fetch total won by players
    const { data: totalWonData, error: wonError } = await supabase
      .from("game_history")
      .select("payout, cash_out_lane, crash_lane");

    if (wonError) {
      console.error("Error fetching total won by players:", wonError);
      return res.status(500).json({ error: "Failed to fetch total won by players" });
    }

    const totalWon = totalWonData
      .filter((bet) => bet.cash_out_lane < bet.crash_lane) // Won bets
      .reduce((sum, bet) => sum + bet.payout, 0);

    // Step 5: Fetch house balance
    // const { data: houseBalanceData, error: houseBalanceError } = await supabase
    //   .from("house_wallet")
    //   .select("balance")
    //   .single();

    // if (houseBalanceError || !houseBalanceData) {
    //   console.error("Error fetching house balance:", houseBalanceError);
    //   return res.status(500).json({ error: "Failed to fetch house balance" });
    // }

    // const houseBalance = houseBalanceData.balance;

    // Step 6: Fetch total withdrawn
    const { data: totalWithdrawnData, error: withdrawnError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("transaction_type", "withdrawal")
      .eq("status", "successful");

    if (withdrawnError) {
      console.error("Error fetching total withdrawn:", withdrawnError);
      return res.status(500).json({ error: "Failed to fetch total withdrawn" });
    }

    const totalWithdrawn = totalWithdrawnData.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const { count: pendingWithdrawalsCount, error: pendingError } = await supabase
  .from("transactions")
  .select("*", { count: "exact", head: true }) // Fetch only the count
  .eq("transaction_type", "withdrawal")
  .eq("status", "pending");

if (pendingError) {
  console.error("Error fetching pending withdrawals:", pendingError);
  return res.status(500).json({ error: "Failed to fetch pending withdrawals" });
}

const pendingWithdrawals = pendingWithdrawalsCount || 0;

    // Step 8: Return the dashboard metrics
    res.status(200).json({
      success: true,
      metrics: {
        totalBets,
        totalWagered,
        totalLost,
        totalWon,
        houseBalance:10,
        totalWithdrawn,
        pendingWithdrawals,
      },
    });
  } catch (err) {
    console.error("Error in /api/admin/dashboard-metrics route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const adminRoutes = router;
