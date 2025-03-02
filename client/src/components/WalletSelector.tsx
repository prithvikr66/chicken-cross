import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletSelector() {
  const { select, wallets, wallet, disconnect } = useWallet();
  // Check if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const connectPhantom = () => {
    // Desktop flow remains the same
    const phantomWallet = wallets.find((w) => w.adapter.name === "Phantom");
    if (phantomWallet) {
      select(phantomWallet.adapter.name);
    }
  };

  const connectSolflare = () => {
    const solflareWallet = wallets.find((w) => w.adapter.name === "Solflare");
    if (solflareWallet) {
      select(solflareWallet.adapter.name);
    }
  };
  const handleClick = async () => {
    if (wallet) {
      await disconnect();
    }
    select(null);
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      {isMobile ? (
        // <div className=" mt-[-20px]">
          <WalletMultiButton
            style={{
              width: "100%",
              // padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "#2A3C48",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "white",
              fontWeight: 500,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            Connect Wallet
          </WalletMultiButton>
        // </div>
      ) : (
        <>
          {" "}
          <button
            onClick={connectPhantom}
            className="w-full px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
          >
            <img
              src="https://phantom.com/favicon/android-chrome-192x192.png"
              className="w-5 h-5"
            />
            <span>Connect with Phantom</span>
          </button>
          <button
            onClick={connectSolflare}
            className="w-full px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
          >
            <img src="https://solflare.com/favicon.ico" className="w-5 h-5" />
            <span>Connect with Solflare</span>
          </button>
        </>
      )}
    </div>
  );
}
