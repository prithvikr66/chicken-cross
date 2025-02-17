import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  LogOut,
  Settings,
  Trophy,
  Bitcoin,
  Gamepad2,
  Calculator,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Clock,
  ChevronDown,
  Check,
  Upload,
} from "lucide-react";

interface ProfileProps {
  onPageChange: (page: "home" | "profile") => void;
}

export function Profile({ onPageChange }: ProfileProps) {
  const { publicKey, disconnect } = useWallet();
  const [, setIsEditing] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [showSettingsSuccess, setShowSettingsSuccess] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<"7d" | "30d" | "ytd">(
    "7d"
  );
  const [showTimeFilter, setShowTimeFilter] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
 

  const [profile, setProfile] = React.useState({
    username: "",
    name: "",
    profileImage: "",
    newImage: null,
    account_balance:0
  });

  // Add new state for temporary modal data
  const [modalProfile, setModalProfile] = React.useState({
    username: "",
    profileImage: "",
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          throw new Error("No auth token found");
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URI}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile((prevProfile) => ({
          ...prevProfile,
          username: data.username,
          name: data.name,
          account_balance:data.account_balance,
          profileImage: data.profile_pic ? data.profile_pic : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop" ,
        }));

        setModalProfile({
          username: data.username,
          profileImage: data.profile_pic ? data.profile_pic : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop",
        });
      } catch (err) {
        // setError(err.message);
      } finally {
        // setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size must be less than 5MB");
        return;
      }

      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Only JPG, PNG and WebP images are allowed");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setModalProfile(prev => ({
          ...prev,
          profileImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const transactions = [
    {
      id: 1,
      type: "deposit",
      amount: 25.5,
      date: "2024-03-15T10:30:00Z",
      status: "completed",
      hash: "5VeL...9XqM",
    },
    {
      id: 2,
      type: "withdrawal",
      amount: 12.8,
      date: "2024-03-14T15:45:00Z",
      status: "completed",
      hash: "3Kpj...7YtN",
    },
    {
      id: 3,
      type: "deposit",
      amount: 50.0,
      date: "2024-03-13T09:20:00Z",
      status: "completed",
      hash: "8RmX...2HqP",
    },
    {
      id: 4,
      type: "withdrawal",
      amount: 8.5,
      date: "2024-03-12T18:15:00Z",
      status: "completed",
      hash: "9WvQ...4ZsL",
    },
    {
      id: 5,
      type: "deposit",
      amount: 100.0,
      date: "2024-03-11T14:20:00Z",
      status: "completed",
      hash: "2ThN...6KmR",
    },
    {
      id: 6,
      type: "withdrawal",
      amount: 35.2,
      date: "2024-03-10T11:30:00Z",
      status: "completed",
      hash: "7PxY...1JtH",
    },
    {
      id: 7,
      type: "deposit",
      amount: 72.5,
      date: "2024-03-09T16:15:00Z",
      status: "completed",
      hash: "4MnB...9GvF",
    },
    {
      id: 8,
      type: "withdrawal",
      amount: 21.3,
      date: "2024-03-08T13:45:00Z",
      status: "completed",
      hash: "6LkD...3WsQ",
    },
    {
      id: 9,
      type: "deposit",
      amount: 48.9,
      date: "2024-03-07T09:10:00Z",
      status: "completed",
      hash: "1CjR...5NmK",
    },
    {
      id: 10,
      type: "withdrawal",
      amount: 15.7,
      date: "2024-03-06T17:25:00Z",
      status: "completed",
      hash: "0HxT...8BpL",
    },
    {
      id: 11,
      type: "deposit",
      amount: 30.0,
      date: "2024-03-05T12:40:00Z",
      status: "completed",
      hash: "9YmK...2VxN",
    },
    {
      id: 12,
      type: "withdrawal",
      amount: 18.4,
      date: "2024-03-04T08:55:00Z",
      status: "completed",
      hash: "4QwP...7HtM",
    },
    {
      id: 13,
      type: "deposit",
      amount: 65.2,
      date: "2024-03-03T14:30:00Z",
      status: "completed",
      hash: "2BnL...5RjK",
    },
    {
      id: 14,
      type: "withdrawal",
      amount: 42.1,
      date: "2024-03-02T16:20:00Z",
      status: "completed",
      hash: "7FmX...1TpQ",
    },
    {
      id: 15,
      type: "deposit",
      amount: 83.6,
      date: "2024-03-01T11:15:00Z",
      status: "completed",
      hash: "3VsY...9NhR",
    },
  ];
//  @ts-ignore
  const filterTransactions = (transactions: typeof transactions) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
// @ts-ignore
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (timeFilter) {
        case "7d":
          return diffDays <= 7;
        case "30d":
          return diffDays <= 30;
        case "ytd":
          return txDate >= startOfYear;
        default:
          return true;
      }
    });
  };

  const filteredTransactions = filterTransactions(transactions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      if (modalProfile.username) {
        formData.append("username", modalProfile.username);
      }
      
      if (imagePreview && fileInputRef.current?.files?.[0]) {
        formData.append("profilePic", fileInputRef.current.files[0]);
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("No auth token found");
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URI}/api/user/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      
      // Update the main profile state with the new data
      setProfile(prev => ({
        ...prev,
        username: data.username || prev.username,
        profileImage: data.profilePicUrl?.publicUrl || prev.profileImage,
      }));

      setShowSettingsSuccess(true);
      
      setTimeout(() => {
        setShowSettingsSuccess(false);
        setShowSettings(false);
        setIsEditing(false);
      }, 2000);

    } catch (error) {
      console.error("Error updating profile:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setModalProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount > 0 && amount <= 0.05) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowDepositModal(false);
        setDepositAmount("");
      }, 2000);
    }
  };

  const handleDepositChange = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");
    const formatted =
      parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 8) : "");
    const numValue = parseFloat(formatted);
    if (!numValue || numValue <= 0.05) {
      setDepositAmount(formatted);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= 245.5) {
      // Using mock balance
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
      }, 2000);
    }
  };

  const handleWithdrawChange = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");
    const formatted =
      parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 8) : "");
    const numValue = parseFloat(formatted);
    if (!numValue || numValue <= 245.5) {
      setWithdrawAmount(formatted);
    }
  };

  // Reset modal state when opening settings
  const handleOpenSettings = () => {
    setModalProfile({
      username: profile.username,
      profileImage: profile.profileImage,
    });
    setImagePreview(null);
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setModalProfile({
      username: profile.username,
      profileImage: profile.profileImage,
    });
    setImagePreview(null);
    setShowSettings(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => onPageChange("home")}
        className="mb-6 px-4 py-2 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white transition-all flex items-center space-x-2 group"
      >
        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span>Back to Home</span>
      </button>

      {/* Profile Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A2C38] rounded-2xl p-6 space-y-6 border border-white/10">
            <div className="relative">
              <img
                src={profile.profileImage}
                className="w-24 h-24 rounded-xl object-cover mx-auto ring-4 ring-yellow-500/20"
              />
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-medium text-xs px-3 py-1 rounded-full shadow-lg shadow-yellow-500/25">
                  Level 42
                </div>
              </div>
            </div>

            <div className="text-center space-y-2 pt-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                {profile.username}
              </h2>
              <p className="text-gray-400">{profile.name}</p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Wallet className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">
                  {publicKey?.toBase58().slice(0, 6)}...
                  {publicKey?.toBase58().slice(-4)}
                </span>
              </div>
              <button
                onClick={() => {
                  disconnect();
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("walletName");
                  window.location.reload();
                }}
                className="mt-2 w-full px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Wallet</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#2A3C48] rounded-xl border border-white/10">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Balance</span>
              </div>
              <span className="text-lg font-semibold text-white">
                {profile.account_balance} SOL
              </span>
            </div>

            <div className="flex items-center justify-between space-x-3">
              <div className="grid grid-cols-3 gap-2 w-full">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="px-2 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25 flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Deposit</span>
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-2 py-2.5 bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white rounded-lg transition-all flex items-center justify-center space-x-1"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span className="text-sm">Withdraw</span>
                </button>
                <button
                  onClick={handleOpenSettings}
                  className="px-2 py-2.5 bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white rounded-lg transition-all flex items-center justify-center space-x-1"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A2C38] rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">
                  Transaction History
                </h3>
                <span className="text-sm text-gray-400">
                  (
                  {timeFilter === "7d"
                    ? "Last 7 Days"
                    : timeFilter === "30d"
                    ? "Last 30 Days"
                    : "Year to Date"}
                  )
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowTimeFilter(!showTimeFilter)}
                  className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10"
                >
                  <span>Time Period</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showTimeFilter && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A2C38] rounded-xl shadow-lg py-1 border border-white/10 z-10">
                    <button
                      onClick={() => {
                        setTimeFilter("7d");
                        setShowTimeFilter(false);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-white/5 ${
                        timeFilter === "7d"
                          ? "text-purple-400"
                          : "text-gray-200"
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("30d");
                        setShowTimeFilter(false);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-white/5 ${
                        timeFilter === "30d"
                          ? "text-purple-400"
                          : "text-gray-200"
                      }`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter("ytd");
                        setShowTimeFilter(false);
                      }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-white/5 ${
                        timeFilter === "ytd"
                          ? "text-purple-400"
                          : "text-gray-200"
                      }`}
                    >
                      Year to Date
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle px-6">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm text-purple-200">
                        <th className="pb-4 font-medium">Type</th>
                        <th className="pb-4 font-medium">Status</th>
                        <th className="pb-4 font-medium">Amount</th>
                        <th className="pb-4 font-medium">Date</th>
                        <th className="pb-4 font-medium">Transaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {/* @ts-ignore */}
                      {filteredTransactions.map((tx, index) => (
                        <tr key={tx.id} className="text-white">
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              {tx.type === "deposit" ? (
                                <ArrowUpCircle className="w-5 h-5 text-green-400" />
                              ) : (
                                <ArrowDownCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className="capitalize font-medium">
                                {tx.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-4">
                            <span
                              className={
                                tx.type === "deposit"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {tx.type === "deposit" ? "+" : "-"}
                              {tx.amount} SOL
                            </span>
                          </td>
                          <td className="py-4 text-purple-200">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-gray-400">
                              {tx.hash}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-8 text-center text-gray-400"
                          >
                            No transactions found for this time period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Betting Statistics */}
      <div className="mt-6">
        <div className="bg-[#1A2C38] rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-2 mb-6">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Betting Statistics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2A3C48] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Wagered</span>
                <Bitcoin className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white">245.50 SOL</div>
              <div className="text-sm text-gray-400 mt-1">Lifetime total</div>
            </div>

            <div className="bg-[#2A3C48] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Bets</span>
                <Gamepad2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">1,234</div>
              <div className="text-sm text-gray-400 mt-1">All-time plays</div>
            </div>

            <div className="bg-[#2A3C48] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Average Wager</span>
                <Calculator className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">0.20 SOL</div>
              <div className="text-sm text-gray-400 mt-1">Per bet average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A2C38] rounded-2xl p-6 w-full max-w-md m-4 border border-white/10">
            {showSettingsSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500 animate-check-mark" />
                </div>
                <h3 className="text-xl font-bold text-green-500 mb-2">
                  Changes Saved!
                </h3>
                <p className="text-gray-400 text-center">
                  Your profile has been updated successfully
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Profile Settings
                  </h3>
                  <button
                    onClick={handleCloseSettings}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#2A3C48] border border-white/10">
                      <Wallet className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400 text-sm">
                        {publicKey?.toBase58().slice(0, 6)}...
                        {publicKey?.toBase58().slice(-4)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={modalProfile.username}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg bg-[#2A3C48] border border-white/10 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-white"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-4">
                      Profile Image
                    </label>
                    <div className="space-y-4">
                      <div className="relative w-32 h-32 mx-auto">
                        <img
                          src={imagePreview || modalProfile.profileImage}
                          className="w-full h-full rounded-xl object-cover ring-4 ring-yellow-500/20"
                        />
                      </div>

                      <div className="flex flex-col items-center space-y-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-colors text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload New Image</span>
                        </button>
                        <p className="text-xs text-gray-400">
                          Max size: 5MB. Supported formats: JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseSettings}
                      className="px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-all font-medium text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A2C38] rounded-2xl p-6 w-full max-w-md m-4 border border-white/10 relative overflow-hidden">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-green-500 mt-4 mb-2">
                  Deposit Successful!
                </h3>
                <p className="text-gray-400 text-center">
                  Your funds have been added to your account
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Deposit SOL
                  </h3>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (Max 0.05 SOL)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={depositAmount}
                        onChange={(e) => handleDepositChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#2A3C48] border border-white/10 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-white pr-20"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => handleDepositChange("0.05")}
                        className="absolute right-2 top-2 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Available: 245.5 SOL
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={
                        !depositAmount || parseFloat(depositAmount) <= 0
                      }
                      className={`flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25 ${
                        !depositAmount || parseFloat(depositAmount) <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDepositModal(false)}
                      className="px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-all font-medium text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A2C38] rounded-2xl p-6 w-full max-w-md m-4 border border-white/10 relative overflow-hidden">
            {showSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-green-500 mt-4 mb-2">
                  Withdrawal Successful!
                </h3>
                <p className="text-gray-400 text-center">
                  Your funds have been sent to your wallet
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Withdraw SOL
                  </h3>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (Max 245.5 SOL)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={withdrawAmount}
                        onChange={(e) => handleWithdrawChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-[#2A3C48] border border-white/10 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-white pr-20"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() => handleWithdrawChange("245.5")}
                        className="absolute right-2 top-2 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Available: 245.5 SOL
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={
                        !withdrawAmount || parseFloat(withdrawAmount) <= 0
                      }
                      className={`flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25 ${
                        !withdrawAmount || parseFloat(withdrawAmount) <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      Withdraw
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-all font-medium text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
