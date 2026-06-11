import React, { createContext, useContext, useState } from 'react';
import { useDisconnect } from 'wagmi';

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  sessionToken: string | null;
  setSessionToken: (token: string | null) => void;
  wallet: string | null;
  setWallet: (wallet: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { disconnectAsync } = useDisconnect();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  const logout = async () => {
    try {
      await disconnectAsync(); // Wagmi disconnect — tells the wallet extension to revoke site permission
    } catch (e) {}
    
    // Clear all local state
    setUserEmail(null);
    setSessionToken(null);
    setWallet(null);
    
    // Wipe all localStorage
    localStorage.removeItem("arc_wallet_session");
    localStorage.removeItem("arc_session_token");
    localStorage.removeItem("arc_network_mode");
    localStorage.setItem("arc_user_signed_out", "true");
    
    // Force page back to connection screen
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{
      userEmail, setUserEmail,
      sessionToken, setSessionToken,
      wallet, setWallet,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
