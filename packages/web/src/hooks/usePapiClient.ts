"use client";

import { useState, useEffect, useRef } from "react";

/**
 * usePapiClient — manages a PAPI client connection on the frontend.
 *
 * In production, this would initialize a PAPI client with smoldot
 * for trustless light-client verification, or a WsProvider for
 * direct RPC connection.
 *
 * Architecture note from the spec:
 * "The frontend UI will be configured to optionally use smoldot for
 *  live data subscriptions, providing the user with cryptographic
 *  proof of their current balance."
 */

interface PapiClientState {
  connected: boolean;
  chainName: string | null;
  error: string | null;
}

export function usePapiClient(rpcUrl?: string) {
  const [state, setState] = useState<PapiClientState>({
    connected: false,
    chainName: null,
    error: null,
  });

  const clientRef = useRef<unknown>(null);

  useEffect(() => {
    if (!rpcUrl) return;

    async function connect() {
      try {
        // Dynamic import to keep PAPI out of the main bundle when not needed
        const { createClient } = await import("polkadot-api");
        const { getWsProvider } = await import("polkadot-api/ws-provider/web");

        const provider = getWsProvider(rpcUrl!);
        const client = createClient(provider);

        clientRef.current = client;
        setState({
          connected: true,
          chainName: null, // Would be resolved from metadata
          error: null,
        });
      } catch (err) {
        setState({
          connected: false,
          chainName: null,
          error: err instanceof Error ? err.message : "Connection failed",
        });
      }
    }

    connect();

    return () => {
      if (
        clientRef.current &&
        typeof (clientRef.current as { destroy?: () => void }).destroy === "function"
      ) {
        (clientRef.current as { destroy: () => void }).destroy();
      }
    };
  }, [rpcUrl]);

  return { ...state, client: clientRef.current };
}
