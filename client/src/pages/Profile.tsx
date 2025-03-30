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
  Check,
  Upload,
  X,
} from "lucide-react";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useHandleDeposits } from "../utils/Deposits";
import { stat } from "fs";

interface ProfileProps {
  onPageChange: (page: "home" | "profile") => void;
  showDepositModal: any;
  setShowDepositModal: any;
}

interface BettingHistory {
  id: string;
  wallet_address: string;
  seed_pair_id: string;
  bet_amount: number;
  payout: number;
  cash_out_lane: number;
  crash_lane: number;
  difficulty: string;
  created_at: string;
}

interface GameHistoryResponse {
  user_stats: {
    total_wag: number;
    total_won: number;
    total_bets: number;
  };
  transactions: BettingHistory[];
}

export function Profile({
  onPageChange,
  showDepositModal,
  setShowDepositModal,
}: ProfileProps) {
  const { publicKey, disconnect } = useWallet();
  const [, setIsEditing] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [showSettingsSuccess, setShowSettingsSuccess] = React.useState(false);

  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [walletBalance, setWalletBalance] = React.useState<number>(0);
  const { handleDeposits } = useHandleDeposits();
  const [profile, setProfile] = React.useState({
    username: "",
    name: "",
    profileImage: "",
    newImage: null,
    account_balance: 0,
  });

  // Add new state for temporary modal data
  const [modalProfile, setModalProfile] = React.useState({
    username: "",
    profileImage: "",
  });

  const [isTransactionPending, setIsTransactionPending] = React.useState(false);
  const [transactionError, setTransactionError] = React.useState<string | null>(
    null
  );
  const [transactions, setTransactions] = React.useState<
    Array<{
      id: string;
      wallet_address: string;
      amount: number;
      transaction_type: string;
      status: string;
      signature: string;
      created_at: string;
      updated_at: string;
      fee: number | null;
      notes: string | null;
      error_message: string | null;
    }>
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] =
    React.useState(true);

  // Add these new states
  const [bettingHistory, setBettingHistory] = React.useState<BettingHistory[]>(
    []
  );
  const [isLoadingBets, setIsLoadingBets] = React.useState(true);

  const [stats, setStats] = React.useState({
    totalWagered: 0,
    totalBets: 0,
    averageWager: 0,
  });

  // Add new state for withdrawal processing
  const [isWithdrawPending, setIsWithdrawPending] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          throw new Error("No auth token found");
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URI}/api/user/profile`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile((prevProfile) => ({
          ...prevProfile,
          username: data.username,
          name: data.name,
          account_balance: data.account_balance,
          profileImage: data.profile_pic
            ? data.profile_pic
            : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop",
        }));

        setModalProfile({
          username: data.username,
          profileImage: data.profile_pic
            ? data.profile_pic
            : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&auto=format&fit=crop",
        });
      } catch (err) {
        // setError(err.message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  React.useEffect(() => {
    const fetchWalletBalance = async () => {
      if (publicKey) {
        try {
          const connection = new Connection(
            import.meta.env.VITE_SOLANA_RPC_URL ||
              "https://api.devnet.solana.com"
          );
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error("Error fetching wallet balance:", error);
        }
      }
    };

    fetchWalletBalance();
  }, [publicKey]);

  // Add this useEffect to fetch transactions
  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("No auth token found");

        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URI
          }/api/transactions/fetch-transactions?wallet_address=${publicKey?.toBase58()}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data = await response.json();
        console.log("data", data.transactions);
        setTransactions(
          data.length > 10 ? data.slice(0, 10) : data.transactions
        );
        console.log("transactions", transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, []);

  // Update the useEffect that fetches betting history
  React.useEffect(() => {
    const fetchBettingHistory = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) throw new Error("No auth token found");

        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URI
          }/api/transactions/game-history?wallet_address=${publicKey?.toBase58()}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch betting history");

        const data: GameHistoryResponse = await response.json();
        setBettingHistory(
          data.transactions.length > 10
            ? data.transactions.slice(0, 10)
            : data.transactions
        );

        // Update stats in the grid cards
        setStats({
          totalWagered: data.user_stats.total_wag,
          totalBets: data.user_stats.total_bets,
          averageWager:
            data.user_stats.total_wag && data.user_stats.total_bets
              ? data.user_stats.total_wag / data.user_stats.total_bets
              : 0,
        });
      } catch (error) {
        console.error("Error fetching betting history:", error);
      } finally {
        setIsLoadingBets(false);
      }
    };

    fetchBettingHistory();
  }, [publicKey]);

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
        setModalProfile((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/user/update-profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();

      // Update the main profile state with the new data
      setProfile((prev) => ({
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
    setModalProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepositChange = (value: string) => {
    setDepositAmount(value);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawPending(true);
    setWithdrawError(null);

    try {
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0) {
        throw new Error("Invalid withdrawal amount");
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) throw new Error("No auth token found");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/transactions/withdraw`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: publicKey?.toBase58(),
            amount: amount,
            signature: "",
            notes: "Withdrawal request",
          }),
        }
      );

      const data = await response.json();

      if (response.status === 409) {
        throw new Error(
          "You already have a pending withdrawal request. Please try again after some time"
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal");
      }

      // Update local profile balance
      setProfile((prev) => ({
        ...prev,
        account_balance: prev.account_balance - amount,
      }));

      // Add new transaction to the list
      setTransactions((prev) => [
        {
          ...data.transaction[0],
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
      }, 2000);
    } catch (error) {
      console.error("Withdrawal error:", error);
      setWithdrawError(
        error instanceof Error ? error.message : "Transaction failed"
      );
    } finally {
      setIsWithdrawPending(false);
    }
  };

  const handleWithdrawChange = (value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");
    const formatted =
      parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 8) : "");
    const numValue = parseFloat(formatted);
    if (!numValue || numValue <= profile.account_balance) {
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

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransactionPending(true);
    setTransactionError(null);

    try {
      await handleDeposits(Number(depositAmount));

      // Fetch updated profile to get new balance
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/user/profile`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch updated balance");

      const data = await response.json();
      setProfile((prev) => ({
        ...prev,
        account_balance: data.account_balance,
      }));

      // Fetch updated transactions
      const txResponse = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URI
        }/api/transactions/fetch-transactions?wallet_address=${publicKey?.toBase58()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (txResponse.ok) {
        const txData = await txResponse.json();
        setTransactions(
          txData.transactions.length > 10
            ? txData.transactions.slice(0, 10)
            : txData.transactions
        );
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowDepositModal(false);
        setDepositAmount("");
      }, 2000);
    } catch (error) {
      console.error("Deposit failed:", error);
      setTransactionError(
        error instanceof Error ? error.message : "Transaction failed"
      );
    } finally {
      setIsTransactionPending(false);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Profile Card */}
        <div className="lg:col-span-1 h-full">
          <div className="bg-[#1A2C38] rounded-2xl p-6 space-y-6 border border-white/10 h-full">
            <div className="relative">
              {isLoadingProfile ? (
                <div className="w-24 h-24 rounded-xl bg-[#2A3C48] animate-pulse flex items-center justify-center ring-4 ring-yellow-500/20 mx-auto">
                  <div className="w-8 h-8 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                </div>
              ) : (
                <img
                  src={profile.profileImage}
                  className="w-24 h-24 rounded-xl object-cover mx-auto ring-4 ring-yellow-500/20"
                />
              )}
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
                {profile.account_balance?.toFixed(3)} SOL
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
        <div className="lg:col-span-2 h-full">
          <div className="bg-[#1A2C38] rounded-2xl p-6 border border-white/10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">
                  Transaction History
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto hide-scrollbar lg:overflow-x-visible -mx-6 flex-1">
              <div className="inline-block min-w-full align-middle px-6 h-full">
                <div className="overflow-y-auto max-h-[400px] hide-scrollbar">
                  <table className="w-full lg:table-fixed border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-[#1A2C38] z-10">
                      <tr className="text-left text-sm text-purple-200">
                        <th className="pb-4 font-medium lg:w-[20%] px-4 whitespace-nowrap">
                          Type
                        </th>
                        <th className="pb-4 font-medium lg:w-[15%] px-4 whitespace-nowrap">
                          Status
                        </th>
                        <th className="pb-4 font-medium lg:w-[15%] px-4 whitespace-nowrap">
                          Amount
                        </th>
                        <th className="pb-4 font-medium lg:w-[20%] px-4 whitespace-nowrap">
                          Date
                        </th>
                        <th className="pb-4 font-medium lg:w-[30%] pl-8 pr-4 whitespace-nowrap">
                          Transaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isLoadingTransactions ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                              <span className="text-gray-400">
                                Loading transactions...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : !Array.isArray(transactions) ||
                        transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-20 px-4 text-center text-gray-400"
                          >
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="text-white">
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                {tx.transaction_type === "deposit" ? (
                                  <ArrowUpCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                  <ArrowDownCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                                <span className="capitalize font-medium">
                                  {tx.transaction_type}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  tx.status === "successful"
                                    ? "bg-green-500/20 text-green-400"
                                    : tx.status === "failed"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={
                                  tx.transaction_type === "deposit"
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {tx.transaction_type === "deposit" ? "+" : "-"}
                                {tx.amount} SOL
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className="text-purple-200 cursor-help"
                                title={new Date(tx.created_at).toLocaleString()}
                              >
                                {new Date(tx.created_at).toLocaleDateString(
                                  undefined,
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </td>
                            <td className="py-4 pl-8 pr-4 whitespace-nowrap">
                              <a
                                href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-400 hover:text-yellow-400 transition-colors truncate block"
                              >
                                {tx.signature ? (
                                  <>
                                    {tx.signature.slice(0, 6)}...
                                    {tx.signature.slice(-4)}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </a>
                            </td>
                          </tr>
                        ))
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
      <div className="mt-6 space-y-6">
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
              <div className="text-2xl font-bold text-white">
                {stats.totalWagered.toFixed(3)} SOL
              </div>
              <div className="text-sm text-gray-400 mt-1">Lifetime total</div>
            </div>

            <div className="bg-[#2A3C48] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Bets</span>
                <Gamepad2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.totalBets.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 mt-1">All-time plays</div>
            </div>

            <div className="bg-[#2A3C48] rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Average Wager</span>
                <Calculator className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.averageWager > 0
                  ? stats.averageWager.toFixed(3)
                  : stats.averageWager}{" "}
                SOL
              </div>
              <div className="text-sm text-gray-400 mt-1">Per bet average</div>
            </div>
          </div>

          {/* New Betting History Table */}
          <div className="mt-8">
            <div className="flex items-center space-x-2 mb-6">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Recent Bets</h3>
            </div>

            {/* Update the table container to enable horizontal scrolling */}
            <div className="relative w-full overflow-x-auto hide-scrollbar">
              <div className="max-h-[400px] overflow-y-auto hide-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
                <table className="w-full min-w-[800px]">
                  {" "}
                  {/* Add min-width to ensure table doesn't compress */}
                  <thead className="sticky top-0 bg-[#1A2C38] z-10">
                    <tr className="text-left text-xs uppercase text-purple-200">
                      <th className="px-4 py-4 whitespace-nowrap font-medium">
                        Amount
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap font-medium">
                        Payout
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap font-medium">
                        P/L
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap font-medium">
                        Difficulty
                      </th>
                      <th className="px-4 py-4 whitespace-nowrap font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoadingBets ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                            <span className="text-gray-400">
                              Loading bets...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : !bettingHistory.length ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-20 text-center text-gray-400"
                        >
                          No betting history found
                        </td>
                      </tr>
                    ) : (
                      bettingHistory.map((bet) => (
                        <tr
                          key={bet.id}
                          className="text-white hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-yellow-400">
                              {bet.bet_amount.toFixed(3)} SOL
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={
                                bet.payout > bet.bet_amount
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {bet.payout.toFixed(3)} SOL
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                                bet.payout > bet.bet_amount
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {bet.payout > bet.bet_amount ? "+" : ""}
                              {(bet.payout - bet.bet_amount).toFixed(3)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                                bet.difficulty === "easy"
                                  ? "bg-green-500/20 text-green-400"
                                  : bet.difficulty === "medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {bet.difficulty}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap relative group">
                            <span className="text-purple-200 cursor-help">
                              {new Date(bet.created_at).toLocaleDateString(
                                undefined,
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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

      {/* Modified Deposit Modal */}
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
            ) : transactionError ? (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-500 mt-4 mb-2">
                  Transaction Failed
                </h3>
                <p className="text-gray-400 text-center">{transactionError}</p>
                <button
                  onClick={() => setTransactionError(null)}
                  className="mt-4 px-6 py-2 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-all font-medium text-white"
                >
                  Try Again
                </button>
              </div>
            ) : isTransactionPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 relative">
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20 animate-spin border-t-yellow-500"></div>
                </div>
                <h3 className="text-xl font-bold text-white mt-4 mb-2">
                  Processing Transaction
                </h3>
                <p className="text-gray-400 text-center">
                  Please wait while we verify your deposit...
                </p>
                <div className="w-full max-w-xs mt-4 h-2 bg-[#2A3C48] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 animate-progress"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Deposit SOL
                  </h3>
                </div>

                <form onSubmit={handleDepositSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (Max 5 SOL)
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
                        onClick={() => handleDepositChange("5")}
                        className="absolute right-2 top-2 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Available: {walletBalance.toFixed(3)} SOL
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
                  Withdrwal Request created
                </h3>
                <p className="text-gray-400 text-center">
                  Your request should be processed within 24 hours
                </p>
              </div>
            ) : withdrawError ? (
              <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-500 mt-4 mb-2">
                  Withdrawal Failed
                </h3>
                <p className="text-gray-400 text-center">{withdrawError}</p>
                <button
                  onClick={() => setWithdrawError(null)}
                  className="mt-4 px-6 py-2 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 transition-all font-medium text-white"
                >
                  Try Again
                </button>
              </div>
            ) : isWithdrawPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 relative">
                  <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20 animate-spin border-t-yellow-500"></div>
                </div>
                <h3 className="text-xl font-bold text-white mt-4 mb-2">
                  Processing Withdrawal
                </h3>
                <p className="text-gray-400 text-center">
                  Please wait while we process your withdrawal...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    Withdraw SOL
                  </h3>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount (Max {profile.account_balance.toFixed(3)} SOL)
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
                        onClick={() =>
                          handleWithdrawChange(
                            profile.account_balance.toFixed(3).toString()
                          )
                        }
                        className="absolute right-2 top-2 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                      Available: {profile.account_balance.toFixed(3)} SOL
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
