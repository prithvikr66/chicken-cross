import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  UserCircle2,
  Wallet,
  Gift,
  MessageSquare,
  ChevronDown,
  Plus,
  Trophy,
  Bitcoin,
  LogOut,
  Clock,
  Gamepad2,
} from "lucide-react";

interface HomeProps {
  onPageChange: (page: "home" | "profile") => void;
}

export function Home({ onPageChange }: HomeProps) {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = React.useState<"highest" | "luckiest">(
    "highest"
  );
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock data for wins
  const wins = [
    { id: 1, rank: 1, amount: 12500, wager: 250, multiplier: 50 },
    { id: 2, rank: 2, amount: 8750, wager: 175, multiplier: 200 },
    { id: 3, rank: 3, amount: 5000, wager: 100, multiplier: 75 },
    { id: 4, rank: 4, amount: 3750, wager: 75, multiplier: 150 },
  ];

  // Mock data for leaderboard
  const leaderboardData = [
    {
      id: 1,
      game: "Fruit Party",
      username: "Hidden",
      time: "2 min ago",
      wager: 100,
      multiplier: 150.0,
      payout: 15000,
    },
    {
      id: 2,
      game: "Lightning Storm",
      username: "Hidden",
      time: "5 min ago",
      wager: 50,
      multiplier: 100.0,
      payout: 5000,
    },
    {
      id: 3,
      game: "Crypto Crash",
      username: "Hidden",
      time: "7 min ago",
      wager: 200,
      multiplier: 50.0,
      payout: 10000,
    },
    {
      id: 4,
      game: "Fruit Party",
      username: "Hidden",
      time: "10 min ago",
      wager: 75,
      multiplier: 75.0,
      payout: 5625,
    },
    {
      id: 5,
      game: "Lightning Storm",
      username: "Hidden",
      time: "12 min ago",
      wager: 150,
      multiplier: 25.0,
      payout: 3750,
    },
  ];

  const [activeFilter, setActiveFilter] = React.useState<
    "all" | "high" | "lucky" | "my"
  >("all");
  const [betAmount, setBetAmount] = React.useState<string>("0");
  const [difficulty, setDifficulty] = React.useState<
    "easy" | "medium" | "hard" | "daredevil"
  >("easy");
  const [showMultipliers, setShowMultipliers] = React.useState(true);

  const handleBetChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");
    // Ensure only one decimal point
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
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#1A2C38]/95 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Chicken Cross
            </h1>

            {/* Center Section - Balance */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="bg-[#2A3C48] rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">1,234.56 SOL</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-1">
                <Plus className="w-4 h-4" />
                <span>Deposit</span>
              </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Mobile Balance */}
              <div className="md:hidden bg-[#2A3C48] rounded-lg px-3 py-2">
                <div className="flex items-center space-x-1">
                  <Wallet className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium text-sm">1,234 SOL</span>
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
                    <div className="md:hidden px-4 py-2 border-b border-white/10">
                      <div className="text-sm text-gray-400">
                        {publicKey?.toBase58().slice(0, 6)}...
                        {publicKey?.toBase58().slice(-4)}
                      </div>
                    </div>
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
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 border-t border-white/10"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Rewards</span>
                    </button>
                    <button
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-2 w-full px-4 py-3 text-sm text-gray-200 hover:bg-white/5 border-t border-white/10"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Messages</span>
                    </button>
                    <button
                      onClick={() => {
                        window.location.reload();
                        setShowProfileMenu(false);
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
          {/* Game Header */}
          <div className="mb-12 text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm mb-4">
              Featured Game
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Chicken Cross
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              🏆 Bet your SOL, cross the lanes, and make it as far as you can.
              The farther you go, the bigger the payout—but one wrong move, and
              it’s game over! 🐤💸
            </p>
          </div>

          {/* Chicken Crossing Game UI */}
          <div className="mb-12 bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Mobile Start Game Button */}
              <div className="lg:hidden mb-6">
                <div className="text-center mb-2">
                  <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                    Betting less than $0.01 will enter demo mode
                  </span>
                </div>
                <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25">
                  Start Game
                </button>
                <p className="text-center text-sm text-gray-400 mt-2">
                  {parseFloat(betAmount) < 0.01
                    ? "You're in demo mode. Place a higher bet to play for real!"
                    : `Playing on ${difficulty} mode`}
                </p>
              </div>

              {/* Left Column - Bet Controls */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-purple-200">
                      Bet Amount
                      <span className="ml-1 text-xs text-purple-400">
                        (SOL)
                      </span>
                    </label>
                    {parseFloat(betAmount) < 0.01 && (
                      <span className="text-xs text-purple-400">Demo Mode</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={betAmount}
                      onChange={(e) => handleBetChange(e.target.value)}
                      className="w-full bg-[#2A3C48] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter bet amount"
                    />
                    <div className="absolute right-2 top-2 flex space-x-1">
                      <button
                        onClick={() => handleQuickBet(0.5)}
                        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
                      >
                        ½
                      </button>
                      <button
                        onClick={() => handleQuickBet(2)}
                        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
                      >
                        2×
                      </button>
                      <button
                        onClick={() => setBetAmount("0")}
                        className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                            difficulty === level
                              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          {level}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Center Column - Multipliers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Current Multipliers</h3>
                  <button
                    onClick={() => setShowMultipliers(!showMultipliers)}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    {showMultipliers ? "Hide" : "Show"}
                  </button>
                </div>
                {showMultipliers && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[1.0, 1.04, 1.09, 1.14, 1.2, 1.26].map((multiplier) => (
                      <div
                        key={multiplier}
                        className="bg-white/5 rounded-lg p-2"
                      >
                        <span className="text-yellow-400 font-medium">
                          {multiplier.toFixed(2)}×
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Start Game */}
              <div className="hidden lg:flex flex-col justify-center">
                <div className="text-center mb-2">
                  <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full">
                    Betting less than $0.01 will enter demo mode
                  </span>
                </div>
                <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25">
                  Start Game
                </button>
                <p className="text-center text-sm text-gray-400 mt-4">
                  {parseFloat(betAmount) < 0.01
                    ? "You're in demo mode. Place a higher bet to play for real!"
                    : `Playing on ${difficulty} mode`}
                </p>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold">Top Winners</h2>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-[#2A3C48] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("highest")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === "highest"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Highest Wins
                </button>
                <button
                  onClick={() => setActiveTab("luckiest")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeTab === "luckiest"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Luckiest Wins
                </button>
              </div>
            </div>

            {/* Wins Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="bg-[#2A3C48] rounded-xl p-4 border border-white/5 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {win.rank === 1 && (
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      )}
                      {win.rank === 2 && (
                        <Trophy className="w-5 h-5 text-gray-400" />
                      )}
                      {win.rank === 3 && (
                        <Trophy className="w-5 h-5 text-orange-400" />
                      )}
                      <span className="text-gray-400">Hidden</span>
                    </div>
                    <div className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-sm">
                      {win.multiplier}x
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Bitcoin className="w-4 h-4 text-yellow-400" />
                      <span className="text-green-400 font-medium">
                        +{win.amount.toLocaleString()} SOL
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Wager: {win.wager.toLocaleString()} SOL
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Dashboard */}
          <div className="mt-8 bg-[#1A2C38] rounded-2xl p-6 backdrop-blur-lg border border-white/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <Gamepad2 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold">Live Bets</h2>
              </div>

              {/* Filter Navigation */}
              <div className="flex bg-[#2A3C48] rounded-lg p-1">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeFilter === "all"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All Games
                </button>
                <button
                  onClick={() => setActiveFilter("high")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeFilter === "high"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  High Wins
                </button>
                <button
                  onClick={() => setActiveFilter("lucky")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeFilter === "lucky"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Lucky Wins
                </button>
                <button
                  onClick={() => setActiveFilter("my")}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    activeFilter === "my"
                      ? "bg-purple-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  My Wagers
                </button>
              </div>
            </div>

            {/* Scrollable Table */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="pb-4 font-medium text-purple-200">Game</th>
                      <th className="pb-4 font-medium text-purple-200">
                        Username
                      </th>
                      <th className="pb-4 font-medium text-purple-200">Time</th>
                      <th className="pb-4 font-medium text-purple-200">
                        Wager
                      </th>
                      <th className="pb-4 font-medium text-purple-200">
                        Multiplier
                      </th>
                      <th className="pb-4 font-medium text-purple-200">
                        Payout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leaderboardData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <Gamepad2 className="w-4 h-4 text-purple-400" />
                            <span className="text-white">{entry.game}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-gray-400">
                            {entry.username}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{entry.time}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-white">{entry.wager} SOL</span>
                        </td>
                        <td className="py-4">
                          <span className="text-purple-400">
                            {entry.multiplier}x
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-green-400">
                            +{entry.payout} SOL
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
