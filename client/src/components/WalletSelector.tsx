import { useWallet } from '@solana/wallet-adapter-react';

export function WalletSelector() {
  const { select, wallets } = useWallet();

  const connectPhantom = () => {
    const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
    if (phantomWallet) {
      select(phantomWallet.adapter.name);
    }
  };

  const connectSolflare = () => {
    const solflareWallet = wallets.find(w => w.adapter.name === 'Solflare');
    if (solflareWallet) {
      select(solflareWallet.adapter.name);
    }
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      <button
        onClick={connectPhantom}
        className="w-full px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
      >
        <img src="https://phantom.com/favicon/android-chrome-192x192.png" className="w-5 h-5" />
        <span>
          Connect with Phantom
        </span>
      </button>
      <button
        onClick={connectSolflare}
        className="w-full px-6 py-3 rounded-lg bg-[#2A3C48] hover:bg-[#374857] border border-white/10 text-white font-medium transition-all flex items-center justify-center space-x-2"
      >
        <img src="https://solflare.com/favicon.ico" className="w-5 h-5" />
        <span>
          Connect with Solflare
        </span>
      </button>
    </div>
  );
}