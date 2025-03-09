import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  UserCircle2,
  Wallet,
  ChevronDown,
  Plus,
  LogOut,
} from "lucide-react";
import GameUI from "../components/GameUI";
import axios from "axios";
import nacl from "tweetnacl";

interface HomeProps {
  onPageChange: (page: "home" | "profile") => void;
}

const API_URL = "http://localhost:3000/api";

export function Home({ onPageChange }: HomeProps) {
  const { publicKey, disconnect } = useWallet();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Game state
  const [clientSeed, setClientSeed] = React.useState("");
  const [serverSeedHash, setServerSeedHash] = React.useState("");
  const [seedPairId, setSeedPairId] = React.useState("");
  const [multipliers, setMultipliers] = React.useState<number[]>([]);
  const [encryptedCrashLane, setEncryptedCrashLane] = React.useState<number>();
  const [nonce, setNonce] = React.useState<string>("");
  const [keyPair, setKeyPair] = React.useState<nacl.BoxKeyPair | null>(null);
  const [gameActive, setGameActive] = React.useState(false);
  const [betAmount, setBetAmount] = React.useState<string>("0");
  const [difficulty, setDifficulty] = React.useState<
    "easy" | "medium" | "hard" | "daredevil"
  >("easy");
  const [showMultipliersState, setShowMultipliersState] = React.useState(true);
  const [error, setError] = React.useState("");
  const [balance, setBalance] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true); // For multiplier fetch

  // Mock data for demonstration
  const wins = [
    { id: 1, rank: 1, amount: 12500, wager: 250, multiplier: 50 },
    { id: 2, rank: 2, amount: 8750, wager: 175, multiplier: 200 },
    { id: 3, rank: 3, amount: 5000, wager: 100, multiplier: 75 },
    { id: 4, rank: 4, amount: 3750, wager: 75, multiplier: 150 },
  ];
  const leaderboardData = [
    {
      id: 1,
      game: "Chicken Cross",
      username: "Hidden",
      time: "2 min ago",
      wager: 100,
      multiplier: 150.0,
      payout: 15000,
    },
    // ... more mock data
  ];

  const [activeFilter, setActiveFilter] = React.useState<"all" | "high" | "lucky" | "my">("all");

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch balance and default multipliers on load
  React.useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      try {
        if (token && publicKey) {
          const balanceResponse = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBalance(balanceResponse.data.account_balance || 0);
        }

        // Fetch multipliers (default to "easy" on load)
        const multipliersResponse = await axios.get(
          `${API_URL}/seeds/multipliers`,
          {
            params: { difficulty: "easy" },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMultipliers(multipliersResponse.data.multipliers);
      } catch (err: any) {
        setError(
          "Failed to load initial data: " +
            (err.response?.data?.error || err.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [publicKey]);

  // Fetch multipliers whenever difficulty changes and game is not active
  React.useEffect(() => {
    if (!gameActive) {
      const fetchMultipliers = async () => {
        setLoading(true);
        try {
          const authToken = localStorage.getItem("authToken");
          if (!authToken) {
            throw new Error("No auth token found");
          }
          const response = await axios.get(`${API_URL}/seeds/multipliers`, {
            params: { difficulty },
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          setMultipliers(response.data.multipliers);
        } catch (err: any) {
          setError(
            "Failed to fetch multipliers: " +
              (err.response?.data?.error || err.message)
          );
        } finally {
          setLoading(false);
        }
      };
      fetchMultipliers();
    }
  }, [difficulty, gameActive]);

  const handleStartGame = async () => {
    // If no wallet is connected
    if (!publicKey) {
      setError("Please connect your wallet.");
      return;
    }

    // Check bet amount
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet < 0) {
      setError("Please enter a valid bet amount.");
      return;
    }
    if (bet > 0 && balance !== null && bet > balance) {
      setError("Insufficient balance.");
      return;
    }

    // Check auth token
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Please log in.");
      return;
    }

    try {
      // 1) Generate client seed and keys first
      const randomBytes = new Uint8Array(16);
      window.crypto.getRandomValues(randomBytes);
      const newClientSeed = `ChickenCross-${Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}-${Date.now()}`;
      setClientSeed(newClientSeed);

      const newKeyPair = nacl.box.keyPair();
      setKeyPair(newKeyPair);
      setError("");

      // 2) Immediately call /seeds/create with the new client seed
      const response = await axios.post(
        `${API_URL}/seeds/create`,
        { clientSeed: newClientSeed, difficulty, betAmount: bet },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3) Store all returned data in state
      setSeedPairId(response.data.seedPairId);
      setServerSeedHash(response.data.serverSeedHash);
      setMultipliers(response.data.multipliers);
      setEncryptedCrashLane(response.data.encryptedCrashLane);
      setNonce(response.data.nonce);

      // 4) Mark the game as active
      setGameActive(true);
      setError("");
    } catch (err: any) {
      setError(
        "Failed to start game: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEndGame = async (cashOutLane?: number) => {
    if (!seedPairId) return;

    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        `${API_URL}/seeds/retire`,
        { seedPairId, betAmount: parseFloat(betAmount), cashOutLane },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(
        "Game ended. Server seed:",
        response.data.serverSeed,
        "Crash lane:",
        response.data.crashLane
      );

      // Update balance if there was a non-zero wager
      if (parseFloat(betAmount) > 0) {
        setBalance((prev) =>
          prev !== null
            ? prev - parseFloat(betAmount) + response.data.payout
            : null
        );
      }

      // Reset states
      setGameActive(false);
      setClientSeed("");
      setSeedPairId("");
      setServerSeedHash("");
      setEncryptedCrashLane(0);
      setNonce("");
      setKeyPair(null);
    } catch (err: any) {
      setError(
        "Failed to end game: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleBetChange = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");
    const formatted =
      parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : "");
    setBetAmount(formatted);
  };

  const handleQuickBet = (multiplier: number) => {
    const currentValue = parseFloat(betAmount) || 0;
    setBetAmount((currentValue * multiplier).toFixed(2));
  };

  return (
    <div className="min-h-screen bg-[#0F1923] text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#1A2C38]/95 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Chicken Cross
            </h1>
            <div className="hidden md:flex items-center space-x-2">
              <div className="bg-[#2A3C48] rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">
                    {balance !== null
                      ? `${balance.toFixed(2)} SOL`
                      : "Loading..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Deposit</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="md:hidden bg-[#2A3C48] rounded-lg px-3 py-2">
                <div className="flex items-center space-x-1">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">
                    {balance !== null ? `${balance} SOL` : "Loading..."}
                  </span>
                </div>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <UserCircle2 className="w-5 h-5 text-gray-400" />
                  <span className="hidden md:inline text-gray-400">
                    {publicKey?.toBase58().slice(0, 4)}...
                    {publicKey?.toBase58().slice(-4)}
                  </span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A2C38] rounded-xl shadow-lg py-1 border border-white/10 z-50">
                    <button
                      onClick={() => {
                        onPageChange("profile");
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
                    >
                      <UserCircle2 className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        window.location.reload();
                        disconnect();
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("walletName");
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/5 border-t border-white/10"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Title / Subheader */}
          <div className="mb-5 text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
              Featured Game
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Chicken Cross
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              🏆 Bet your SOL, cross the lanes, and cash out before you crash!
            </p>
          </div>

          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-2 text-gray-400">Loading game data...</p>
            </div>
          ) : (
            <>
              {/* Game UI */}
              <div className="border border-white rounded-2xl overflow-x-auto">
                <GameUI
                  betAmount={parseFloat(betAmount)}
                  difficulty={difficulty}
                  seedPairId={seedPairId}
                  multipliers={multipliers}
                  encryptedCrashLane={encryptedCrashLane}
                  nonce={nonce}
                  gameActive={gameActive}
                  onGameEnd={handleEndGame}
                />
              </div>

              {/* Betting / Difficulty Controls */}
              <div className="mb-12 bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Start Button (mobile) */}
                  <div className="lg:hidden mb-6">
                    <div className="text-center mb-2">
                      <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                        Betting 0 SOL enters demo mode
                      </span>
                    </div>
                    <button
                      onClick={handleStartGame}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02]"
                      disabled={gameActive}
                    >
                      Start Game
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-2">
                      {parseFloat(betAmount) === 0
                        ? "Demo Mode"
                        : `Playing on ${difficulty} mode`}
                    </p>
                  </div>

                  {/* Bet Amount / Difficulty */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-200">
                        Bet Amount (SOL)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={betAmount}
                          onChange={(e) => handleBetChange(e.target.value)}
                          className="w-full bg-[#2A3C48] border border-white/10 rounded-lg px-4 py-3 text-white"
                          placeholder="Enter bet amount (0 for demo)"
                          disabled={gameActive}
                        />
                        <div className="absolute right-2 top-2 flex space-x-1">
                          <button
                            onClick={() => handleQuickBet(0.5)}
                            className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded"
                          >
                            ½
                          </button>
                          <button
                            onClick={() => handleQuickBet(2)}
                            className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded"
                          >
                            2×
                          </button>
                          <button
                            onClick={() => setBetAmount("0")}
                            className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-purple-200">
                        Difficulty
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["easy", "medium", "hard", "daredevil"] as const).map(
                          (level) => (
                            <button
                              key={level}
                              onClick={() => setDifficulty(level)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${
                                difficulty === level
                                  ? "bg-purple-500 text-white"
                                  : "bg-white/5 text-gray-400 hover:bg-white/10"
                              }`}
                              disabled={gameActive}
                            >
                              {level}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multipliers & Start Button (desktop) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Current Multipliers</h3>
                      <button
                        onClick={() =>
                          setShowMultipliersState(!showMultipliersState)
                        }
                        className="text-sm text-purple-400"
                      >
                        {showMultipliersState ? "Hide" : "Show"}
                      </button>
                    </div>
                    {showMultipliersState && multipliers.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {multipliers.map((multiplier, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-2">
                            <span className="text-yellow-400 font-medium">
                              {multiplier.toFixed(2)}×
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Start Button (desktop) */}
                  <div className="hidden lg:flex flex-col justify-center">
                    <div className="text-center mb-2">
                      <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                        Betting 0 SOL enters demo mode
                      </span>
                    </div>
                    <button
                      onClick={handleStartGame}
                      className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02]"
                      disabled={gameActive}
                    >
                      Start Game
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-4">
                      {parseFloat(betAmount) === 0
                        ? "Demo Mode"
                        : `Playing on ${difficulty} mode`}
                    </p>
                  </div>
                </div>
                {error && (
                  <p className="text-red-400 text-center mt-4">{error}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
