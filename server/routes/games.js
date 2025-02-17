import express from 'express';

const router = express.Router();

// In-memory game store (replace with database in production)
const games = new Map();

// Start a new game
router.post('/start', async (req, res) => {
  try {
    const { publicKey } = req.user;
    const { betAmount, difficulty } = req.body;

    if (!betAmount || !difficulty) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate bet amount
    if (betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Create new game
    const game = {
      id: Date.now().toString(),
      publicKey,
      betAmount,
      difficulty,
      status: 'active',
      startedAt: new Date().toISOString()
    };

    games.set(game.id, game);

    res.json(game);
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// End game
router.post('/:gameId/end', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { multiplier } = req.body;
    const game = games.get(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game already ended' });
    }

    // Calculate winnings
    const winnings = game.betAmount * multiplier;

    // Update game status
    game.status = 'completed';
    game.endedAt = new Date().toISOString();
    game.multiplier = multiplier;
    game.winnings = winnings;

    games.set(gameId, game);

    res.json(game);
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Get user's game history
router.get('/history', async (req, res) => {
  try {
    const { publicKey } = req.user;
    const userGames = Array.from(games.values())
      .filter(game => game.publicKey === publicKey)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    res.json(userGames);
  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({ error: 'Failed to get game history' });
  }
});

export const gameRoutes = router;