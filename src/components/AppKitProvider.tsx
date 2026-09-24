"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  useAppKit,
  useAppKitAccount,
  useDisconnect,
} from "@reown/appkit/react";
import { initAppKit, isAppKitConfigured } from "@/lib/reown";
import { isSolanaAddress, shortenAddress } from "@/lib/solana";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "unavailable";

export interface WalletApi {
  ready: boolean;
  configured: boolean;
  isConnected: boolean;
  address?: string;
  shortAddress?: string;
  status: WalletStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const unavailable: WalletApi = {
  ready: true,
  configured: false,
  isConnected: false,
  status: "unavailable",
  connect: async () => {},
  disconnect: async () => {},
};

const WalletContext = createContext<WalletApi>({
  ...unavailable,
  ready: false,
  status: "disconnected",
});

export function useWallet(): WalletApi {
  return useContext(WalletContext);
}

function LiveWalletBridge({ children }: { children: ReactNode }) {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount({
    namespace: "solana",
  });
  const { disconnect } = useDisconnect();
  const [notice, setNotice] = useState<string | null>(null);

  const validAddress = isSolanaAddress(address) ? address : undefined;
  const connected = Boolean(isConnected && validAddress);

  const connect = useCallback(async () => {
    setNotice(null);
    try {
      await open({ view: "Connect", namespace: "solana" });
    } catch {
      setNotice("unavailable");
    }
  }, [open]);

  const handleDisconnect = useCallback(async () => {
    setNotice(null);
    try {
      await disconnect({ namespace: "solana" });
    } catch {
      setNotice("unavailable");
    }
  }, [disconnect]);

  const walletStatus: WalletStatus = notice
    ? "unavailable"
    : connected
      ? "connected"
      : status === "connecting" || status === "reconnecting"
        ? "connecting"
        : "disconnected";

  const value = useMemo<WalletApi>(
    () => ({
      ready: true,
      configured: true,
      isConnected: connected,
      address: validAddress,
      shortAddress: validAddress ? shortenAddress(validAddress) : undefined,
      status: walletStatus,
      connect,
      disconnect: handleDisconnect,
    }),
    [connected, validAddress, walletStatus, connect, handleDisconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

function subscribe() {
  return () => {};
}

function useHasMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function AppKitProvider({ children }: { children: ReactNode }) {
  const mounted = useHasMounted();
  const configured = mounted && initAppKit();

  if (!mounted) {
    return (
      <WalletContext.Provider
        value={{ ...unavailable, ready: false, status: "disconnected" }}
      >
        {children}
      </WalletContext.Provider>
    );
  }

  if (!configured || !isAppKitConfigured()) {
    return (
      <WalletContext.Provider value={unavailable}>
        {children}
      </WalletContext.Provider>
    );
  }

  return <LiveWalletBridge>{children}</LiveWalletBridge>;
}
