import express from 'express';
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_PROJECT_KEY,
  process.env.SUPABASE_ANON_KEY
);

// Start a new game
router.get("/waggers", async (req, res) => {
  try {
    // Fetch the last 30 games, ordered by created_at in descending order
    const { data: games, error } = await supabase
      .from("game_history")
      .select("*")
      .order("created_at", { ascending: false }) // Newest games first
      .limit(30); // Limit to 30 games

    if (error) {
      console.error("Error fetching games:", error);
      return res.status(500).json({ error: "Failed to fetch games" });
    }

    if (!games || games.length === 0) {
      return res.status(404).json({ message: "No games found" });
    }

    // Return the games as a JSON response
    res.status(200).json({ games });
  } catch (err) {
    console.error("Error in /api/games/last-30 route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const gameRoutes = router;