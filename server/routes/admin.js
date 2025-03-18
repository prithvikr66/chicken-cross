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

      const { error } = await supabase
        .from("transactions")
        .update({ status, signature, updated_at })
        .eq("id", id);

      if (error) {
        console.error("Error updating transaction:", error);
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
