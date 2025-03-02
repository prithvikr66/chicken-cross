import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {WalletProvider} from "./utils/WalletProvidex.tsx"

import App from "./App.tsx";
import "./index.css";
import { Buffer } from 'buffer';
window.Buffer = Buffer;


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
   
  </StrictMode>
);
