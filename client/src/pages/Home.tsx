import React, { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserCircle2, Wallet, ChevronDown, Plus, LogOut } from "lucide-react";
import axios from "axios";
import nacl from "tweetnacl";
import GameUI from "../components/GameUI";

interface HomeProps {
  onPageChange: (page: "home" | "profile") => void;
  navigateToProfileWithModal:any
}

const API_URL = import.meta.env.VITE_BACKEND_URI;

export function Home({ onPageChange,navigateToProfileWithModal }: HomeProps) {
  const { publicKey, disconnect } = useWallet();
  const menuRef = useRef<HTMLDivElement>(null);

  // Menu toggle
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------ States for the game logic ------------------
  const [allMultipliers, setAllMultipliers] = useState<{
    [key: string]: number[];
  } | null>(null);

  const [seedPairId, setSeedPairId] = useState("");
  const [serverSeedHash, setServerSeedHash] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [multipliers, setMultipliers] = useState<number[]>([]);
  const [encryptedCrashLane, setEncryptedCrashLane] = useState<
    number | undefined
  >(undefined);
  const [nonce, setNonce] = useState<string>("");

  // The game only becomes “active” after user clicks “Start Game”
  const [gameActive, setGameActive] = useState(false);

  // ephemeral key pair
  const [keyPair, setKeyPair] = useState<nacl.BoxKeyPair | null>(null);
    const [currentLane, setCurrentLane] = useState<number>(0);
  

  // Betting
  const [betAmount, setBetAmount] = useState<string>("0");
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "daredevil"
  >("easy");

  // Error / loading
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  // Show an initial loading spinner for user data
  const [initialLoading, setInitialLoading] = useState(true);

  // NEW state => track if we’re currently calling /create so we can disable "Start Game"
  const [isCreating, setIsCreating] = useState(false);

  // -------------------------------------------------------------------------
  // (A) On mount (or wallet change), fetch user balance & global multipliers
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      const token = localStorage.getItem("authToken");

      try {
        if (token && publicKey) {
          const balanceResponse = await axios.get(
            `${API_URL}/api/user/profile`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setBalance(balanceResponse.data.account_balance || 0);
        }

        // Fetch "all difficulties" multipliers if you want them
        const allResponse = await axios.get(
          `${API_URL}/api/seeds/multipliers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAllMultipliers(allResponse.data);
        // By default, set multipliers to our current difficulty
        setMultipliers(allResponse.data[difficulty]);
      } catch (err: any) {
        setError(
          "Failed to load data: " + (err.response?.data?.error || err.message)
        );
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [publicKey]);

  // If difficulty changes & game not active, set local multipliers from allMultipliers
  useEffect(() => {
    if (!gameActive && allMultipliers) {
      setMultipliers(allMultipliers[difficulty]);
    }
  }, [difficulty, allMultipliers, gameActive]);

  // -------------------------------------------------------------------------
  // (B) Debounce: On betAmount or difficulty changes => call /seeds/create
  // but do NOT activate the game until user presses "Start Game"
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!publicKey) return; // need wallet
    const token = localStorage.getItem("authToken");
    if (!token) return; // need auth

    // parse bet
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet < 0) {
      setError("Please enter a valid bet amount.");
      return;
    }
    if (balance !== null && bet > balance) {
      setError("Insufficient balance.");
      return;
    }

    // We'll create a seed pair in “idle” mode, not setting gameActive yet
    const timer = setTimeout(async () => {
      setIsCreating(true); // disable Start Game while we fetch
      try {
        const randomBytes = new Uint8Array(16);
        window.crypto.getRandomValues(randomBytes);
        const newClientSeed = `ChickenCross-${Array.from(randomBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}-${Date.now()}`;
        setClientSeed(newClientSeed);

        const newKeyPair = nacl.box.keyPair();
        setKeyPair(newKeyPair);

        const response = await axios.post(
          `${API_URL}/api/seeds/create`,
          { clientSeed: newClientSeed, difficulty, betAmount: bet },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSeedPairId(response.data.seedPairId);
        setServerSeedHash(response.data.serverSeedHash);
        setEncryptedCrashLane(response.data.encryptedCrashLane);
        // setEncryptedCrashLane(5);
        setNonce(response.data.nonce);
        setError("");
      } catch (err: any) {
        setError(
          "Failed to create seed pair: " +
            (err.response?.data?.error || err.message)
        );
      } finally {
        setIsCreating(false); // re-enable Start Game
      }
    }, 300); // or 600ms debounce

    return () => clearTimeout(timer);
  }, [betAmount, difficulty, publicKey, balance]);

  // -------------------------------------------------------------------------
  // (C) Start Game => only do this once we have a valid seed pair
  // -------------------------------------------------------------------------
  const handleStartGame = async() => {
    if (!seedPairId) {
      setError("No seed pair available. Please adjust bet/difficulty first.");
      return;
    }
    setGameActive(true);
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const response = await axios.post(
      `${API_URL}/api/seeds/gamestart`,
      { betAmount: betAmount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setBalance(response.data.newBalance)
    setError("");
  };

  // -------------------------------------------------------------------------
  // (D) End Game => calls /seeds/retire
  // -------------------------------------------------------------------------
  const handleEndGame = async (cashOutLane?: number) => {
    if (!seedPairId) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/seeds/retire`,
        { seedPairId, betAmount: parseFloat(betAmount), cashOutLane },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // update balance if bet > 0
      if (parseFloat(betAmount) > 0) {
        const endgame = await axios.post(
          `${API_URL}/api/seeds/game-complete`,
          {winnings:(parseFloat(betAmount) * multipliers[currentLane - 1]).toFixed(2) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(endgame.data)
        setBalance(endgame.data.newBalance)
      }

      // reset
      setGameActive(false);
      setClientSeed("");
      setSeedPairId("");
      setServerSeedHash("");
      setEncryptedCrashLane(undefined);
      setNonce("");
      setKeyPair(null);
      window.location.reload();

    } catch (err: any) {
      setError(
        "Failed to end game: " + (err.response?.data?.error || err.message)
      );
    }
  };

  // (E) Input handlers
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
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-1" onClick={navigateToProfileWithModal}>
                <Plus className="w-4 h-4" />
                <span>Deposit</span>
              </button>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="md:hidden bg-[#2A3C48] rounded-lg px-3 py-2">
                <div className="flex items-center space-x-1">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">
                    {balance !== null ? `${balance.toFixed(2)} SOL` : "Loading..."}
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

      {/* Main content */}
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {initialLoading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-2 text-gray-400">Loading initial data...</p>
            </div>
          ) : (
            <>
              {/* The actual game UI */}
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
                  currentLane={currentLane}
                  setCurrentLane={setCurrentLane}
                />
              </div>

              {/* Bet & Difficulty */}
              <div className="mb-6 bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Bet */}
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
                        disabled={gameActive} // once started, lock bet
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

                  {/* Difficulty */}
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

                  {/* Start Button (desktop) */}
                  <div className="hidden lg:flex flex-col justify-center mt-4">
                    <div className="text-center mb-2">
                      <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                        Betting 0 SOL enters demo mode
                      </span>
                    </div>
                    <button
                      onClick={handleStartGame}
                      // disable if game is active OR we're still fetching /create
                      disabled={gameActive || isCreating}
                      className={`w-full font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02]
                        ${
                          gameActive || isCreating
                            ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black"
                        }`}
                    >
                      {isCreating ? "Start Game" : "Start Game"}
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-4">
                      {parseFloat(betAmount) === 0
                        ? "Demo Mode"
                        : `Playing on ${difficulty} mode`}
                    </p>
                  </div>
                </div>
                {/* Mobile Start Button */}
                <div className="lg:hidden mt-6">
                  <div className="text-center mb-2">
                    <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                      Betting 0 SOL enters demo mode
                    </span>
                  </div>
                  <button
                    onClick={handleStartGame}
                    disabled={gameActive || isCreating}
                    className={`w-full font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02]
                      ${
                        gameActive || isCreating
                          ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black"
                      }`}
                  >
                    {isCreating ? "Start Game" : "Start Game"}
                  </button>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {parseFloat(betAmount) === 0
                      ? "Demo Mode"
                      : `Playing on ${difficulty} mode`}
                  </p>
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
