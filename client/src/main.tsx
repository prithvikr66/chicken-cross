import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  // WalletProvider,
} from "@solana/wallet-adapter-react";
import {WalletProvider} from "./utils/WalletProvidex.tsx"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import App from "./App.tsx";
import "./index.css";

// You can also provide a custom RPC endpoint
const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);

// Initialize wallet adapter
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
    {/* <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider> */}
  </StrictMode>
);
