import React, { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserCircle2, Wallet, ChevronDown, Plus, LogOut } from "lucide-react";
import axios from "axios";
import nacl from "tweetnacl";
import GameUI from "../components/GameUI";
import GameHistory from "../components/GameHistory";

interface HomeProps {
  onPageChange: (page: "home" | "profile") => void;
}

const API_URL = import.meta.env.VITE_BACKEND_URI;

export function Home({ onPageChange }: HomeProps) {
  const { publicKey, disconnect } = useWallet();
  const menuRef = useRef<HTMLDivElement>(null);

  // Menu toggle for the profile dropdown
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

  // Game logic states
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

  const [gameActive, setGameActive] = useState(false);
  const [keyPair, setKeyPair] = useState<nacl.BoxKeyPair | null>(null);

  // Betting
  const [betAmount, setBetAmount] = useState<string>("0");
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "daredevil"
  >("easy");
  const [balance, setBalance] = useState<number | null>(null);

  // Error / loading
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Track if /create is in-flight
  const [isCreating, setIsCreating] = useState(false);

  // NEW: We define a buttonState with 4 possible states
  // "start_default" | "start_loading" | "cashout_disabled" | "cashout_enabled"
  const [buttonState, setButtonState] = useState<
    "start_default" | "start_loading" | "cashout_disabled" | "cashout_enabled"
  >("start_default");

  // 1) On mount (or wallet change), fetch user data & multipliers
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

        const allResponse = await axios.get(
          `${API_URL}/api/seeds/multipliers`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAllMultipliers(allResponse.data);
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

  // 2) If difficulty changes & no active game, switch multipliers
  useEffect(() => {
    if (!gameActive && allMultipliers) {
      setMultipliers(allMultipliers[difficulty]);
    }
  }, [difficulty, allMultipliers, gameActive]);

  // 3) Debounced /seeds/create => idle mode
  useEffect(() => {
    if (!publicKey) return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const bet = parseFloat(betAmount);
    //removed the isNan(bet) to allow empty field
    if (bet < 0) {
      setError("Please enter a valid bet amount.");
      return;
    }
    if (balance !== null && bet > balance) {
      setError("Insufficient balance.");
      return;
    }

    const timer = setTimeout(async () => {
      // We'll disable the button if we are loading
      setIsCreating(true);
      // While we are in flight => buttonState => "start_loading"
      setButtonState("start_loading");

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
        // setEncryptedCrashLane(14);
        setNonce(response.data.nonce);
        setError("");

        // If successful, and the game is not started, we return to the "start_default" state
        if (!gameActive) {
          setButtonState("start_default");
        }
      } catch (err: any) {
        setError(
          "Failed to create seed pair: " +
          (err.response?.data?.error || err.message)
        );
        // Return to default if error
        setButtonState("start_default");
      } finally {
        setIsCreating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [betAmount, difficulty, publicKey, balance]);

  // (C) Start Game => user clicks => switch to "cashout_disabled"
  const handleStartGame = () => {
    if (buttonState === "cashout_enabled") {
      console.log("cashout enabled called");
      setButtonState("cashout_disabled")
    } else {
      if (!seedPairId) {
        setError("No seed pair available. Please adjust bet/difficulty first.");
        return;
      }
      setGameActive(true);
      setError("");
      // Once the user clicks => "Cash Out" with grey bg => disabled
      setButtonState("cashout_disabled");
    }
  };

  // (D) End Game => calls /seeds/retire
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
        setBalance((prev) =>
          prev !== null
            ? prev - parseFloat(betAmount) + response.data.payout
            : null
        );
      }

      // reset
      setGameActive(false);
      setClientSeed("");
      setSeedPairId("");
      setServerSeedHash("");
      setEncryptedCrashLane(undefined);
      setNonce("");
      setKeyPair(null);

      // Return to "Start Game" default
      setButtonState("start_default");
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
    setBetAmount((currentValue * multiplier).toFixed(3));
  };

  // NEW: callback from GameUI => once lane #1 is clicked, switch to "cashout_enabled"
  const handleFirstLaneClick = () => {
    // Only change if we're in the "cashout_disabled" state
    if (buttonState === "cashout_disabled") {
      setButtonState("cashout_enabled");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <div className="  bg-[#1A2C38]/95 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 py-5 lg:py-3 ">
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
                      ? `${balance.toFixed(3)} SOL`
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
                    {balance !== null ? `${balance.toFixed(3)} SOL` : "Loading..."}
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
      <div className=" ">
        <div className=" max-w-[85rem] mx-auto min-h-[40rem] bg-[#191939] lg:p-5 lg:rounded-2xl  ">
          {initialLoading ? (
            <div className="  w-full h-screen flex justify-center items-center ">
              <div className=" animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <>
              {/* The actual game UI */}
              <div className=" gameui lg:rounded-xl overflow-x-auto">
                <GameUI
                  betAmount={parseFloat(betAmount)}
                  difficulty={difficulty}
                  seedPairId={seedPairId}
                  multipliers={multipliers}
                  encryptedCrashLane={encryptedCrashLane}
                  nonce={nonce}
                  gameActive={gameActive}
                  onFirstLaneClick={handleFirstLaneClick}
                />
              </div>

              {/* Bet & Difficulty */}
              <div className="mt-5 bg-[#1A2C38]  rounded-2xl p-6 backdrop-blur-lg  border-white/10">
                {/* MOBILE Start Button */}
                <div className="lg:hidden  mt-2">
                  <div className="text-center mb-2">
                    <span className="text-sm text-white bg-purple-500/20 px-3 py-1 rounded-full">
                      Betting 0 SOL enters demo mode
                    </span>
                  </div>
                  <button
                    onClick={handleStartGame}
                    disabled={
                      buttonState === "start_loading" ||
                      buttonState === "cashout_disabled"
                    }
                    className={getButtonClasses(buttonState)}
                  >
                    {getButtonText(buttonState)}
                  </button>
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {parseFloat(betAmount) === 0
                      ? "Demo Mode"
                      : `Playing on ${difficulty} mode`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Bet Amount Field */}
                  <div className="space-y-2 ">
                    <label className="text-sm font-medium text-white">
                      Bet Amount (SOL)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={betAmount}
                        onChange={(e) => handleBetChange(e.target.value)}
                        className="w-full bg-[#2A3C48] border border-white/10 rounded-lg px-4 py-2 text-white"
                        placeholder="Enter bet amount (0 for demo)"
                        disabled={gameActive}
                      />
                      <div className="absolute right-2 top-2 flex space-x-1">
                        <button
                          onClick={() => handleQuickBet(0.5)}
                          className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded"
                        >
                          1/2
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
                  <div className="space-y-2 ">
                    <label className="text-sm font-medium text-white">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["easy", "medium", "hard", "daredevil"] as const).map(
                        (level) => (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${difficulty === level
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

                  {/* DESKTOP Start/CashOut Button */}
                  <div className="hidden lg:flex flex-col justify-center">
                    <div className="text-center mb-2">
                      <span className="text-sm text-white bg-purple-500/20 px-3 py-1 rounded-full">
                        Betting 0 SOL enters demo mode
                      </span>
                    </div>
                    <button
                      onClick={handleStartGame}
                      disabled={
                        buttonState === "start_loading" ||
                        buttonState === "cashout_disabled"
                      }
                      className={getButtonClasses(buttonState)}
                    >
                      {getButtonText(buttonState)}
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-2">
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
              {/* Game History section */}
              <div className=" mt-[5%]">
                <GameHistory apiUrl={API_URL} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to define button text given our buttonState
function getButtonText(
  state:
    | "start_default"
    | "start_loading"
    | "cashout_disabled"
    | "cashout_enabled"
) {
  switch (state) {
    case "start_default":
    case "start_loading":
      return "Start Game";
    case "cashout_disabled":
    case "cashout_enabled":
      return "Cash Out";
    default:
      return "Start Game";
  }
}

// Helper to define the classes based on our buttonState
function getButtonClasses(
  state:
    | "start_default"
    | "start_loading"
    | "cashout_disabled"
    | "cashout_enabled"
) {
  // Common classes for padding, rounding, etc
  const base =
    "w-full font-bold py-2 px-8 rounded-xl transition-all transform hover:scale-[1.02]";
  switch (state) {
    case "start_default":
      // "Start Game" with yellow background, clickable
      return `${base} bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black`;
    case "start_loading":
      // "Start Game" with grey BG, disabled
      return `${base} bg-gray-600 text-gray-300 cursor-not-allowed`;
    case "cashout_disabled":
      // "Cash Out" with grey BG, disabled
      return `${base} bg-gray-600 text-gray-300 cursor-not-allowed`;
    case "cashout_enabled":
      // "Cash Out" with yellow BG, enabled
      return `${base} bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black`;
    default:
      return `${base} bg-gray-600 text-gray-300 cursor-not-allowed`;
  }
}
