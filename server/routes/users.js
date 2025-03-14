import express from 'express';
import multer from "multer";
import {
  createClient
} from "@supabase/supabase-js";
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

router.get("/profile", async (req, res) => {
  const {
    walletAddress
  } = req;
  const {
    data,
    error
  } = await supabase
    .from("users")
    .select()
    .eq("wallet_address", walletAddress)
    .single();

  if (error) return res.status(500).json({
    error: error.message
  });

  res.json(data);
});

const storage = multer({
  storage: multer.memoryStorage()
});
const upload = storage.single("profilePic");

router.put("/update-profile", upload, async (req, res) => {
  const { walletAddress } = req;
  const { username } = req.body;
  let profilePicUrl = null;

  // Validate input
  if (!username && !req.file) {
    return res.status(400).json({
      error: "No changes provided"
    });
  }

  try {
    if (req.file) {
      const fileName = `${walletAddress}-${Date.now()}.jpg`;

      const { data, error: uploadError } = await supabase.storage
        .from("profile_pics")
        .upload(fileName, req.file.buffer, {
          contentType: "image/jpeg",
          upsert: true 
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("profile_pics")
        .getPublicUrl(fileName);

      profilePicUrl = { publicUrl };
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (profilePicUrl) updateData.profile_pic = profilePicUrl.publicUrl;

    // Update user profile in database
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("wallet_address", walletAddress)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      message: "Profile updated successfully",
      username: data.username,
      profilePicUrl: profilePicUrl
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      error: error.message
    });
  }
});


export const userRoutes = router;