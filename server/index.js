import express from "express";
import cors from "cors";
import { userRoutes } from "./routes/users.js";
import { gameRoutes } from "./routes/games.js";
import { transactionRoutes } from "./routes/transactions.js";
import { authRoutes } from "./routes/auth.js";
import { seedRoutes } from "./routes/seeds.js";
import jwt from "jsonwebtoken";
import { adminRoutes } from "./routes/admin.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
  credentials: true, 
}));
app.use(express.json());


// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.walletAddress = decoded.walletAddress;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Routes
app.use("/api/user", authenticateUser, userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seeds", authenticateUser, seedRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
