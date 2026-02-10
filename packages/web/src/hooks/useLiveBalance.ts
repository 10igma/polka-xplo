"use client";

import { useState, useEffect, useRef } from "react";

interface LiveBalance {
  free: string;
  reserved: string;
  frozen: string;
  flags: string;
}

/**
 * useLiveBalance — subscribes to real-time balance updates via PAPI.
 *
 * Implements the spec requirement:
 * "Use a React Hook useLiveBalance(address) that subscribes to
 *  api.query.System.Account.watchValue(address) via PAPI."
 *
 * In production, this hook would use a WebSocket connection to the
 * frontend PAPI client (optionally via smoldot light client) for
 * trustless, real-time balance verification.
 *
 * For now, it polls the indexer API as a fallback mechanism.
 */
export function useLiveBalance(address: string) {
  const [balance, setBalance] = useState<LiveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!address) return;

    async function fetchBalance() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/accounts/${address}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.balance) {
          setBalance(data.balance);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchBalance();

    // Poll every 6 seconds (matching Polkadot block time)
    // In production: replace with PAPI WebSocket subscription
    intervalRef.current = setInterval(fetchBalance, 6_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [address]);

  return { balance, loading, error };
}
