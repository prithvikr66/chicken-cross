import express from "express";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

const router = express.Router();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const publicKeyPath = path.join(__dirname, "../", "public_key.pem");
// const publicKey = fs.readFileSync(publicKeyPath, "utf8");

// function encryptDataWithPublicKey(data) {
//   const buffer = Buffer.from(data.toString(), "utf8");

//   const encrypted = crypto.publicEncrypt(
//     {
//       key: publicKey,
//       padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // ✅ Ensure correct padding
//       oaepHash: "sha256", // ✅ Use SHA-256 for OAEP
//     },
//     buffer
//   );

//   return encrypted.toString("base64"); // ✅ Convert to Base64 for safe transmission
// }

function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

function hashServerSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function generateOutcome(serverSeed, clientSeed, nonce) {
  const message = `${clientSeed}:${nonce}`;
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(message)
    .digest("hex");
  const bytes = hmac.slice(0, 8);
  const decimal = parseInt(bytes, 16);
  const max = Math.pow(2, 32);
  return decimal / max;
}

async function getHouseProfitLossRatio() {
  const { data, error } = await supabase
    .from("game_history")
    .select("bet_amount, payout")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error || !data || data.length === 0) return 0;

  const totalBets = data.reduce((sum, game) => sum + game.bet_amount, 0);
  const totalPayouts = data.reduce((sum, game) => sum + (game.payout || 0), 0);
  const profit = totalBets - totalPayouts;
  return profit / totalBets;
}

async function determineCrashLane(outcome, difficulty) {
  const laneCounts = {
    easy: 6,
    medium: 6,
    hard: 6,
    daredevil: 5,
  };
  const laneCount = laneCounts[difficulty] || 6;
  const baseWeights = {
    easy: [0.25, 0.2, 0.15, 0.1, 0.08, 0.07, 0.05, 0.05, 0.025, 0.025],
    medium: [0.3, 0.22, 0.15, 0.1, 0.08, 0.05, 0.04, 0.03, 0.02, 0.01],
    hard: [0.3, 0.2, 0.15, 0.1, 0.075, 0.05, 0.05, 0.05, 0.025, 0.025],
    daredevil: [0.45, 0.2, 0.1, 0.05, 0.05, 0.05, 0.025, 0.025, 0.025, 0.025],
  };

  let weights = baseWeights[difficulty] || baseWeights.easy;

  const profitLossRatio = await getHouseProfitLossRatio();
  if (profitLossRatio < -0.1) {
    weights = weights.map((w, i) =>
      i < Math.floor(laneCount / 2) ? w * 1.2 : w * 0.8
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map((w) => w / sum);
  }

  let cumulative = 0;
  for (let i = 0; i < laneCount; i++) {
    cumulative += weights[i];
    if (outcome <= cumulative) return i + 1;
  }
  return laneCount;
}

async function getMultipliers(difficulty) {
  const baseMultipliers = {
    easy: [1.0, 1.01, 1.03, 1.06, 1.1, 1.14, 1.18, 1.23, 1.28, 1.34, 1.4, 1.46], // Grows more rapidly with each level
    medium: [
      1.09, 1.15, 1.22, 1.31, 1.41, 1.53, 1.66, 1.81, 1.97, 2.14, 2.32, 2.52,
      2.73, 2.95, 3.19,
    ], // Faster growth than before
    hard: [
      1.2, 1.32, 1.45, 1.6, 1.78, 1.98, 2.22, 2.5, 2.82, 3.18, 3.58, 4.01, 4.47,
      4.97, 5.5, 6.06, 6.86, 8.23,
    ], // More pronounced growth
    daredevil: [
      1.6, 1.92, 2.3, 2.76, 3.31, 3.97, 4.77, 5.72, 6.86, 8.23, 10.02, 12.02,
      14.43, 17.26, 20.52, 24.31, 28.65, 33.64, 39.35, 45.88,
    ], // Highly accelerated multiplier progression
  };

  let multipliers = baseMultipliers[difficulty] || baseMultipliers.easy;

  const profitLossRatio = await getHouseProfitLossRatio();
  if (profitLossRatio < -0.1) {
    multipliers = multipliers.map((m) => m * 0.9);
  }

  return multipliers;
}

// New endpoint to fetch multipliers on load
// New endpoint to fetch all difficulty multipliers
router.get("/multipliers", async (req, res) => {
  try {
    const difficulties = ["easy", "medium", "hard", "daredevil"];
    const allMultipliers = {};

    for (const diff of difficulties) {
      const multipliers = await getMultipliers(diff);
      allMultipliers[diff] = multipliers;
    }

    // Respond with an object like:
    // {
    //    easy: [...],
    //    medium: [...],
    //    hard: [...],
    //    daredevil: [...]
    // }
    res.json(allMultipliers);
  } catch (error) {
    console.error("Fetch multipliers error:", error);
    res.status(500).json({ error: "Failed to fetch multipliers" });
  }
});

router.post("/create", async (req, res) => {
  const { clientSeed, difficulty, betAmount } = req.body; // Added publicKey and betAmount
  const { walletAddress } = req;

  if (!clientSeed || !difficulty) {
    return res
      .status(400)
      .json({ error: "Client seed, difficulty are required" });
  }

  const validDifficulties = ["easy", "medium", "hard", "daredevil"];
  if (!validDifficulties.includes(difficulty)) {
    return res.status(400).json({ error: "Invalid difficulty" });
  }

  try {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const outcome = generateOutcome(serverSeed, clientSeed, 0);
    const crashLane = await determineCrashLane(outcome, difficulty);
    const multipliers = await getMultipliers(difficulty);
    // const encryptedCrashLane = encryptDataWithPublicKey(crashLane);

    if (betAmount > 0) {
      // Skip balance check for demo mode (betAmount = 0)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("wallet_address", walletAddress)
        .single();

      if (userError || !userData) throw new Error("User not found");
      if (userData.account_balance < betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
    }

    await supabase
      .from("seed_pairs")
      .update({ is_active: false, retired_at: new Date().toISOString() })
      .eq("wallet_address", walletAddress)
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("seed_pairs")
      .insert({
        wallet_address: walletAddress,
        server_seed: serverSeed,
        server_seed_hash: serverSeedHash,
        client_seed: clientSeed,
        difficulty,
        crash_lane: crashLane,
        multipliers: multipliers,
        is_active: true,
        nonce: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      seedPairId: data.id,
      serverSeedHash: data.server_seed_hash,
      clientSeed: data.client_seed,
      difficulty: data.difficulty,
      multipliers: data.multipliers,
      encryptedCrashLane: crashLane,
    });
  } catch (error) {
    console.error("Create seed pair error:", error);
    res.status(500).json({ error: "Failed to create seed pair" });
  }
});

router.get("/active", async (req, res) => {
  const { walletAddress } = req;

  try {
    const { data, error } = await supabase
      .from("seed_pairs")
      .select(
        "id, server_seed_hash, client_seed, difficulty, multipliers, nonce"
      )
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "No active seed pair found" });
    }

    res.json({
      seedPairId: data.id,
      serverSeedHash: data.server_seed_hash,
      clientSeed: data.client_seed,
      difficulty: data.difficulty,
      multipliers: data.multipliers,
      nonce: data.nonce,
    });
  } catch (error) {
    console.error("Get active seed pair error:", error);
    res.status(500).json({ error: "Failed to fetch active seed pair" });
  }
});

router.post("/retire", async (req, res) => {
  console.log("retire api called!");
  const { walletAddress } = req;
  const { seedPairId, betAmount, cashOutLane } = req.body;

  if (!seedPairId || betAmount === undefined) {
    return res
      .status(400)
      .json({ error: "Seed pair ID and bet amount are required" });
  }

  try {
    const { data: seedPair, error: fetchError } = await supabase
      .from("seed_pairs")
      .select("nonce, crash_lane, difficulty, multipliers")
      .eq("id", seedPairId)
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .single();

    if (fetchError || !seedPair) {
      return res
        .status(404)
        .json({ error: "Seed pair not found or already retired" });
    }

    let payoutMultiplier =
      cashOutLane && cashOutLane <= seedPair.multipliers.length
        ? seedPair.multipliers[cashOutLane - 1]
        : 0;
    const payout = betAmount * payoutMultiplier;

    if (betAmount > 0) {
      // Only log and update balance if not demo mode
      const { error: logError } = await supabase.from("game_history").insert({
        wallet_address: walletAddress,
        seed_pair_id: seedPairId,
        bet_amount: betAmount,
        payout: payout,
        cash_out_lane: cashOutLane || null,
        crash_lane: seedPair.crash_lane,
        difficulty: seedPair.difficulty,
      });

      if (logError) throw logError;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("account_balance")
        .eq("wallet_address", walletAddress)
        .single();

      if (userError) throw userError;

      const newBalance = (userData.account_balance || 0) + payout;
      const { error: balanceError } = await supabase
        .from("users")
        .update({ account_balance: newBalance })
        .eq("wallet_address", walletAddress);

      if (balanceError) throw balanceError;
    }

    const newNonce = seedPair.nonce + 1;
    const { data, error } = await supabase
      .from("seed_pairs")
      .update({
        is_active: false,
        retired_at: new Date().toISOString(),
        nonce: newNonce,
      })
      .eq("id", seedPairId)
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .select(
        "id, server_seed, server_seed_hash, client_seed, difficulty, crash_lane, multipliers, nonce"
      )
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ error: "Seed pair not found or already retired" });
    }

    res.json({
      seedPairId: data.id,
      serverSeed: data.server_seed,
      serverSeedHash: data.server_seed_hash,
      clientSeed: data.client_seed,
      difficulty: data.difficulty,
      crashLane: data.crash_lane,
      multipliers: data.multipliers,
      finalNonce: data.nonce,
      payout: payout,
      newBalance: newBalance,
    });
  } catch (error) {
    console.error("Retire seed pair error:", error);
    res.status(500).json({ error: "Failed to retire seed pair" });
  }
});

router.post("/gamestart", async (req, res) => {
  const { betAmount } = req.body;
  const { walletAddress } = req;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: "Invalid bet amount" });
  }

  try {
    // Fetch user balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance, total_wag, total_bets")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userData.account_balance < betAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }
    const newBalance = userData.account_balance - betAmount;
    const newTotalWagered = Number(userData.total_wag) + Number(betAmount);
    const newTotalBets = userData.total_bets + 1;

    // Deduct balance
    const { error: updateError } = await supabase
      .from("users")
      .update({
        account_balance: newBalance,
        total_wag: newTotalWagered,
        total_bets: newTotalBets,
      })
      .eq("wallet_address", walletAddress);

    if (updateError) console.log(updateError);

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("Balance deduction error:", error);
    res.status(500).json({ error: "Failed to deduct balance" });
  }
});

router.post("/crash", async (req, res) => { 
  console.log("crash api called")
  const { walletAddress } = req;
  const { seedPairId, betAmount, cashOutLane } = req.body;

  if (!seedPairId || betAmount === undefined) {
    return res
      .status(400)
      .json({ error: "Seed pair ID and bet amount are required" });
  }

  try {
    const { data: seedPair, error: fetchError } = await supabase
      .from("seed_pairs")
      .select("nonce, crash_lane, difficulty, multipliers")
      .eq("id", seedPairId)
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .single();

    if (fetchError || !seedPair) {
      return res
        .status(404)
        .json({ error: "Seed pair not found or already retired" });
    }

    const payout = 0;

    if (betAmount > 0) {
      // Only log and update balance if not demo mode
      const { error: logError } = await supabase.from("game_history").insert({
        wallet_address: walletAddress,
        seed_pair_id: seedPairId,
        bet_amount: betAmount,
        payout: payout,
        cash_out_lane: cashOutLane || null,
        crash_lane: seedPair.crash_lane,
        difficulty: seedPair.difficulty,
      });

      if (logError) throw logError;

    }

    const newNonce = seedPair.nonce + 1;
    const { data, error } = await supabase
      .from("seed_pairs")
      .update({
        is_active: false,
        retired_at: new Date().toISOString(),
        nonce: newNonce,
      })
      .eq("id", seedPairId)
      .eq("wallet_address", walletAddress)
      .eq("is_active", true)
      .select(
        "id, server_seed, server_seed_hash, client_seed, difficulty, crash_lane, multipliers, nonce"
      )
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ error: "Seed pair not found or already retired" });
    }

    res.json({
      seedPairId: data.id,
      serverSeed: data.server_seed,
      serverSeedHash: data.server_seed_hash,
      clientSeed: data.client_seed,
      difficulty: data.difficulty,
      crashLane: data.crash_lane,
      multipliers: data.multipliers,
      finalNonce: data.nonce,
      payout: payout,
    });
  } catch (error) {
    console.error("Retire seed pair error:", error);
    res.status(500).json({ error: "Failed to retire seed pair" });
  }
});

export const seedRoutes = router;
