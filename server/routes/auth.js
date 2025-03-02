import bs58 from "bs58";
import nacl from "tweetnacl";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import express from "express";

const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

const router = express.Router();

router.post("/nonce", async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress)
    return res.status(400).json({
      error: "Wallet address required",
    });
  const nonce = `Login to Uncrossable - ${Date.now()}\nBy signing this message you accept our Terms and Conditions at https://chicken-cross.vercel.app/terms-and-conditions`;

  const defaultUsername = `user-${walletAddress.slice(0, 4)}`;

  const { data: user, error } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("wallet_address", walletAddress)
    .single();

  if (error || !user) {
    await supabase.from("users").insert({
      wallet_address: walletAddress,
      username: defaultUsername,
      nonce,
    });
  } else {
    await supabase
      .from("users")
      .update({
        nonce,
      })
      .eq("wallet_address", walletAddress);
  }

  res.json({
    nonce,
  });
});

// Verify signature and issue JWT
router.post("/verify", async (req, res) => {
  const { walletAddress, signedMessage } = req.body;

  if (!walletAddress || !signedMessage)
    return res.status(400).json({
      error: "Invalid request",
    });

  // Fetch nonce from Supabase
  const { data, error } = await supabase
    .from("users")
    .select("nonce")
    .eq("wallet_address", walletAddress)
    .single();

  if (error || !data.nonce)
    return res.status(400).json({
      error: "Nonce not found",
    });

  // Verify signature
  const publicKey = new Uint8Array(bs58.decode(walletAddress));
  const message = new TextEncoder().encode(data.nonce);
  const signature = Uint8Array.from(Buffer.from(signedMessage, "base64"));

  if (!nacl.sign.detached.verify(message, signature, publicKey)) {
    return res.status(401).json({
      error: "Signature verification failed",
    });
  }

  // Create JWT token
  const token = jwt.sign(
    {
      walletAddress,
    },
    process.env.JWT_SECRET,
    
  );
  res.json({
    token,
  });
});

export const authRoutes = router;
