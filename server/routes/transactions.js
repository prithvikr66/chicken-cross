import express from 'express';

const router = express.Router();

// In-memory transaction store (replace with database in production)
const transactions = new Map();

// Create deposit transaction
router.post('/deposit', async (req, res) => {
  try {
    const { publicKey } = req.user;
    const { amount, signature } = req.body;

    if (!amount || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transaction record
    const transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      publicKey,
      amount,
      signature,
      status: 'completed',
      timestamp: new Date().toISOString()
    };

    transactions.set(transaction.id, transaction);

    res.json(transaction);
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

// Create withdrawal transaction
router.post('/withdraw', async (req, res) => {
  try {
    const { publicKey } = req.user;
    const { amount, address } = req.body;

    if (!amount || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transaction record
    const transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      publicKey,
      amount,
      address,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    transactions.set(transaction.id, transaction);

    res.json(transaction);
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get transaction history
router.get('/history', async (req, res) => {
  try {
    const { publicKey } = req.user;
    const userTransactions = Array.from(transactions.values())
      .filter(tx => tx.publicKey === publicKey)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(userTransactions);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

export const transactionRoutes = router;