import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet, Shield } from "lucide-react";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletSelector } from "./components/WalletSelector";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";
function App() {
  const { connected, publicKey, signMessage, disconnect, wallet } = useWallet();
  const [loading, setLoading] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<"home" | "profile">(
    "home"
  );
  const [showDepositModal, setShowDepositModal] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) setSignedIn(true);1
  }, []);

  React.useEffect(() => {
    if (!wallet || !wallet.adapter) return;

    // Listener for account changes
    const handleAccountChange = () => {
      console.log("account changed")
      disconnect();
      localStorage.removeItem("authToken");
      localStorage.removeItem("walletName");
      window.location.reload();
    };

    // Handle account changes (for Phantom and compatible wallets)
    if (window.solana) {
      window.solana.on("accountChanged", handleAccountChange);
    }

    return () => {
      if (window.solana) {
        window.solana.removeListener("accountChanged", handleAccountChange);
      }
    };
  }, [wallet, publicKey, disconnect]);

  const navigateToProfileWithModal = () => {
    setCurrentPage("profile");
    setShowDepositModal(true);
  };
  const handleSignIn = async () => {
    try {
      if (!connected || !publicKey || !signMessage) {
        throw new Error("Wallet not connected properly");
      }

      setLoading(true);
      // Request nonce from backend
      const nonceResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/auth/nonce`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
        }
      );
      const { nonce } = await nonceResponse.json();
      const messageBytes = new TextEncoder().encode(nonce);
      const signature = await signMessage(messageBytes);

      const base64Signature = Buffer.from(signature).toString("base64");

      const authResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/auth/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: publicKey.toBase58(),
            signedMessage: base64Signature,
          }),
        }
      );
      const { token } = await authResponse.json();

      if (token) {
        localStorage.setItem("authToken", token);
        setSignedIn(true);
      }

    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#0F1923] text-white">
      {/* {signedIn && <Header onPageChange={setCurrentPage} />} */}
      {!signedIn ? (
        <div className="min-h-screen flex flex-col">
          <div className="bg-[#1A2C38]/95 backdrop-blur-lg border-b border-white/10 z-50">
            <div className="max-w-7xl mx-auto px-4 py-5 lg:py-3">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  Chicken Cross
                </h1>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-[12px]">
            <div className="max-w-md w-full bg-[#1A2C38] rounded-2xl p-8 space-y-6 border border-white/10 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-center relative">
                {signedIn ? (
                  <Shield className="w-16 h-16 text-green-400" />
                ) : (
                  <Wallet className="w-16 h-16 text-yellow-400" />
                )}
              </div>
              <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                {signedIn ? "Successfully Signed In!" : "Connect Your Wallet"}
              </h1>
              <p className="text-center text-gray-400 px-4">
                {signedIn
                  ? "Your wallet is now securely connected and verified"
                  : "Connect your Solana wallet to get started"}
              </p>
              <div className="flex justify-center pt-4">
                {!signedIn &&
                  (!connected ? (
                    <WalletSelector />
                  ) : (
                    <button
                      onClick={handleSignIn}
                      disabled={loading}
                      className={`w-full px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow-500/25 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? "Signing..." : "Sign Message"}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : currentPage === "home" ? (
        <Home
          onPageChange={setCurrentPage}
          navigateToProfileWithModal={navigateToProfileWithModal}
        />
      ) : (
        <Profile
          onPageChange={setCurrentPage}
          showDepositModal={showDepositModal}
          setShowDepositModal={setShowDepositModal}
        />
      )}
    </div>
  );
}

export default App;
