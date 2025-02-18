import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { UserCircle2, Home, LogOut, Menu, X } from "lucide-react";

interface HeaderProps {
  onPageChange: (page: "home" | "profile") => void;
}

export function Header({ onPageChange }: HeaderProps) {
  const { publicKey, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  const handleDisconnect = () => {
    disconnect();
    localStorage.removeItem("authToken");
    localStorage.removeItem("walletName");
    window.location.reload();
  };

  const handleNavigate = (page: "home" | "profile") => {
    onPageChange(page);
    setShowDropdown(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
          Chicken Cross
        </h1>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => handleNavigate("home")}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-white hover:bg-white/5 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          {/* <div className="h-6 w-px bg-white/10" /> */}
          
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {showMobileMenu ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Desktop Profile Button */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-white hover:bg-white/5 transition-colors"
          >
            <UserCircle2 className="w-6 h-6" />
            <span>{publicKey && publicKey.toBase58().slice(0, 4)}...{publicKey && publicKey.toBase58().slice(-4)}</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg py-1 text-white">
              <button
                onClick={() => handleNavigate("profile")}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-white/5"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center space-x-2 w-full px-4 py-2 text-sm hover:bg-white/5 text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-white/10">
          <div className="bg-[#1A2C38]/95 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <UserCircle2 className="w-5 h-5 text-white" />
                  <span className="text-white">
                    {publicKey && publicKey.toBase58().slice(0, 6)}...
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-red-400 hover:bg-white/5 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect</span>
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleNavigate("home");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-white hover:bg-white/5 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => {
                    handleNavigate("profile");
                    setShowMobileMenu(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg text-white hover:bg-white/5 transition-colors"
                >
                  <UserCircle2 className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
