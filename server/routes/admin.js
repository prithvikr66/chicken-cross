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
      // .eq("status", "pending")
      .or("status.eq.pending,status.eq.failed");

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
        return res
          .status(500)
          .json({ error: "Failed to fetch transaction details" });
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
          return res
            .status(500)
            .json({ error: "Failed to fetch user details" });
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
          return res
            .status(500)
            .json({ error: "Failed to update user balance" });
        }
      }

      // Step 3: Update the transaction status
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status, signature, updated_at })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating transaction:", updateError);
        return res
          .status(500)
          .json({ error: "Failed to update transaction status" });
      }
    }

    // Return success response
    res
      .status(200)
      .json({ success: true, message: "Transactions updated successfully" });
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
      return res
        .status(500)
        .json({ error: "Failed to fetch completed withdrawals" });
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
      return res
        .status(500)
        .json({ error: "Failed to fetch total amount wagered" });
    }

    const totalWagered = totalWageredData.reduce(
      (sum, bet) => sum + bet.bet_amount,
      0
    );

    // Step 3: Fetch all bets with payout and bet_amount for calculations
    const { data: allBetsData, error: allBetsError } = await supabase
      .from("game_history")
      .select("bet_amount, payout");

    if (allBetsError) {
      console.error("Error fetching all bets data:", allBetsError);
      return res.status(500).json({ error: "Failed to fetch all bets data" });
    }

    const totalLost = allBetsData.reduce((sum, bet) => {
      if (bet.payout < bet.bet_amount) {
        return sum + (bet.bet_amount - (bet.payout || 0));
      }
      return sum;
    }, 0);

    // Calculate total won by players (when payout > bet_amount)
    const totalWon = allBetsData.reduce((sum, bet) => {
      // If payout is greater than bet_amount, the difference is the win
      if (bet.payout > bet.bet_amount) {
        return sum + (bet.payout - bet.bet_amount);
      }
      return sum;
    }, 0);

    const { data: totalWithdrawnData, error: withdrawnError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("transaction_type", "withdrawal")
      .eq("status", "successful");

    if (withdrawnError) {
      console.error("Error fetching total withdrawn:", withdrawnError);
      return res.status(500).json({ error: "Failed to fetch total withdrawn" });
    }

    const totalWithdrawn = totalWithdrawnData.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    let { count: pendingWithdrawalsCount, error: pendingError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true }) // Fetch only the count
      .eq("transaction_type", "withdrawal")
      .eq("status", "pending");

    if (pendingError) {
      console.error("Error fetching pending withdrawals:", pendingError);
      return res
        .status(500)
        .json({ error: "Failed to fetch pending withdrawals" });
    }
    pendingWithdrawalsCount = pendingWithdrawalsCount || 0;

    const { data: pendingWithdrawalsData, error: pendingSolError } =
      await supabase
        .from("transactions")
        .select("amount")
        .eq("transaction_type", "withdrawal")
        .eq("status", "pending");

    if (pendingSolError) {
      console.error("Error fetching pending withdrawals:", pendingError);
      return res
        .status(500)
        .json({ error: "Failed to fetch pending withdrawals" });
    }

    const pendingWithdrawals = pendingWithdrawalsData.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    const { data, error } = await supabase
      .from("house_balance")
      .select("balance")
      .single();

    // Step 8: Return the dashboard metrics
    res.status(200).json({
      success: true,
      metrics: {
        totalBets,
        totalWagered,
        totalLost,
        totalWon,
        houseBalance: data.balance,
        totalWithdrawn,
        pendingWithdrawals,
        pendingWithdrawalsCount,
      },
    });
  } catch (err) {
    console.error("Error in /api/admin/dashboard-metrics route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/house-balance", async (req, res) => {
  const { newBalance } = req.body;

  // Validate input
  if (typeof newBalance !== "number" || newBalance < 0) {
    return res.status(400).json({ error: "Invalid balance value" });
  }

  try {
    const { data, error } = await supabase
      .from("house_balance")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true)
      .select("balance")
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      newBalance: data.balance,
    });
  } catch (err) {
    console.error("House balance update error:", err);
    res.status(500).json({ error: "Failed to update house balance" });
  }
});

router.get("/history", async (req, res) => {
  try {
    // 1. Fetch both successful and rejected withdrawals
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("transaction_type", "withdrawal")
      .in("status", ["successful", "failed"]) // Include both statuses
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // 2. Group transactions by status, admin, and timestamp
    const grouped = transactions.reduce((groups, tx) => {
      // Create separate groups for approved/rejected
      const statusKey = tx.status === "successful" ? "approved" : "failed";
      const timeKey = Math.floor(
        new Date(tx.updated_at).getTime() / (5 * 60 * 1000)
      );
      const groupKey = `${statusKey}-${tx.signed_by}-${timeKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          status: statusKey, // 'approved' or 'rejected'
          signed_by: tx.signed_by,
          signed_at: tx.updated_at,
          transactions: [],
        };
      }

      groups[groupKey].transactions.push(tx);
      return groups;
    }, {});

    // 3. Convert to array and sort
    const result = Object.values(grouped).sort(
      (a, b) => new Date(b.signed_at) - new Date(a.signed_at)
    );

    res.status(200).json({ groups: result });
  } catch (err) {
    console.error("Failed to fetch withdrawal history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const adminRoutes = router;
