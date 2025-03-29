import express from "express";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { multipliers } from "../utils/multipliers.js";
import { fileURLToPath } from "url";
const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

const router = express.Router();
const Xprecentage = 10;

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

const getMultipliers = () => {
  const difficulties = ["easy", "medium", "hard", "daredevil"];

  const transformedMultipliers = {
    demo: {},
    original: {}
  };

  difficulties.forEach((difficulty) => {
    transformedMultipliers.demo[difficulty] = multipliers.demo[difficulty].data.map(({ multiplier }) => multiplier);
    transformedMultipliers.original[difficulty] = multipliers.original[difficulty].data.map(({ multiplier }) => multiplier);
  });
  return transformedMultipliers;
}



export async function determineCrashLane(outcome, betAmount, difficulty) {
  const { data, error } = await supabase
    .from("house_balance")
    .select("balance")
    .single();

  if (error || !data) {
    throw new Error("Failed to fetch house balance");
  }

  const houseBalance = data.balance;
  
  const parsedBetAmount = parseFloat(betAmount) || 0;
  const isDemo = parsedBetAmount <= 0;

  const mode = isDemo ? "demo" : "original";
  const difficultyData = multipliers[mode][difficulty].data;

  let cumulativeProbability = 0;
  let selectedIndex = difficultyData.length - 1;

  // 1. Step: Probabilistically select crash lane index using the outcome
  for (let i = 0; i < difficultyData.length; i++) {
    cumulativeProbability += difficultyData[i].crashOccurenceRatio;

    if (outcome <= cumulativeProbability) {
      selectedIndex = i;
      break;
    }
  }

  // 2. Step: If real mode, ensure payout <= X% of houseBalance
  if (!isDemo) {
    const maxPayout = (Xprecentage / 100) * houseBalance;
    const maxAllowedMultiplier = maxPayout / parsedBetAmount;

    const selectedMultiplier = difficultyData[selectedIndex].multiplier;

    if (selectedMultiplier * parsedBetAmount > maxPayout) {
      // Find the highest index where multiplier * betAmount is within allowed range
      const fallbackIndex = difficultyData.findIndex(
        ({ multiplier }) => multiplier * parsedBetAmount <= maxPayout
      );

      selectedIndex = fallbackIndex !== -1 ? fallbackIndex : 0;
    }
  }

  return selectedIndex+1;
}


router.get("/multipliers", async (req, res) => {
  try {
    const transformedMultipliers = getMultipliers();
    res.status(200).json(transformedMultipliers);
  } catch (error) {
    console.error("Error fetching multipliers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/create", async (req, res) => {
  const { clientSeed, difficulty, betAmount, isGameActive } = req.body;
  const { walletAddress } = req;
  const parsedBetAmount = parseFloat(betAmount) || 0;
  const isDemo = parsedBetAmount <= 0;

  const mode = isDemo ? "demo" : "original";
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
    const crashLane = await determineCrashLane(outcome, betAmount, difficulty);

    if (betAmount > 0) {
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
        multipliers: multipliers[mode][difficulty].data,
        crash_lane: crashLane,
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
  const { walletAddress } = req;
  const { seedPairId, betAmount, cashOutLane, difficulty } = req.body;
  const parsedBetAmount = parseFloat(betAmount) || 0;
  const isDemo = parsedBetAmount <= 0;

  const mode = isDemo ? "demo" : "original";
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
    let payoutMultiplier = multipliers.original[difficulty].data[cashOutLane].multiplier;
      
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

      const { data: houseData, error: houseFetchError } = await supabase
        .from("house_balance")
        .select("balance")
        .single();

      if (houseFetchError || !houseData) {
        return res.status(500).json({ error: "Failed to fetch house balance" });
      }

      const newHouseBalance = Number(houseData.balance) - Number(payout);

      const { error: houseUpdateError } = await supabase
        .from("house_balance")
        .update({
          balance: newHouseBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true)
        .select("balance")
        .single();

      if (houseUpdateError) {
        console.log("house update error", houseUpdateError);
        return res.status(500).json({ error: "Failed to update house balance" });
      }
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

    // Deduct balance from user
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        account_balance: newBalance,
        total_wag: newTotalWagered,
        total_bets: newTotalBets,
      })
      .eq("wallet_address", walletAddress);

    if (updateUserError) {
      console.log("error while updaing user ", updateUserError);
      return res.status(500).json({ error: "Failed to update user balance" });
    }

    // Increment house balance
    const { data: houseData, error: houseFetchError } = await supabase
      .from("house_balance")
      .select("balance")
      .single();

    if (houseFetchError || !houseData) {
      return res.status(500).json({ error: "Failed to fetch house balance" });
    }

    const newHouseBalance = Number(houseData.balance) + Number(betAmount);

    const { error: houseUpdateError } = await supabase
      .from("house_balance")
      .update({
        balance: newHouseBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true)
      .select("balance")
      .single();

    if (houseUpdateError) {
      console.log("house update error", houseUpdateError);
      return res.status(500).json({ error: "Failed to update house balance" });
    }

    res.json({ success: true, newBalance });
  } catch (error) {
    console.error("Balance deduction error:", error);
    res.status(500).json({ error: "Failed to deduct balance" });
  }
});


router.post("/crash", async (req, res) => {
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
