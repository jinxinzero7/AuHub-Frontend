"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

interface SignalRMessage {
  lotId: string;
  currentPrice: number;
  bidderName: string;
  timestamp: string;
}

interface NotificationMessage {
  userId: string;
  type: string;
  message: string;
  lotId: string | null;
  timestamp: string;
}

interface UseSignalROptions {
  lotId?: string;
  userId?: string;
  onNewBid?: (message: SignalRMessage) => void;
  onLotCompleted?: (message: { lotId: string; winnerName: string; finalPrice: number }) => void;
  onNewNotification?: (message: NotificationMessage) => void;
}

export function useSignalR({ lotId, userId, onNewBid, onLotCompleted, onNewNotification }: UseSignalROptions = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const startedRef = useRef(false);
  const callbacksRef = useRef({ onNewBid, onLotCompleted, onNewNotification });

  useEffect(() => {
    callbacksRef.current = { onNewBid, onLotCompleted, onNewNotification };
  }, [onNewBid, onLotCompleted, onNewNotification]);

  const connect = useCallback(() => {
    if (connectionRef.current || startedRef.current) return;
    if (!localStorage.getItem("accessToken")) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/auction`, {
        accessTokenFactory: () => localStorage.getItem("accessToken") ?? "",
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    const joinGroups = async () => {
      const joins: Promise<unknown>[] = [];
      if (lotId) joins.push(connection.invoke("JoinLotGroup", lotId));
      if (userId) joins.push(connection.invoke("JoinUserGroup"));
      await Promise.all(joins);
    };

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      setError(null);
      void joinGroups().catch((joinError: Error) => setError(joinError.message));
    });
    connection.onclose(() => {
      if (connectionRef.current !== connection) return;
      connectionRef.current = null;
      setConnected(false);
      startedRef.current = false;
    });

    connection.on("NewBidPlaced", (message: SignalRMessage) => {
      if (!lotId || message.lotId === lotId) callbacksRef.current.onNewBid?.(message);
    });
    connection.on("LotCompleted", (message: { lotId: string; winnerName: string; finalPrice: number }) => {
      if (!lotId || message.lotId === lotId) callbacksRef.current.onLotCompleted?.(message);
    });
    connection.on("NewNotification", (message: NotificationMessage) => {
      callbacksRef.current.onNewNotification?.(message);
    });

    startedRef.current = true;
    connection.start()
      .then(async () => {
        if (connectionRef.current !== connection) return;
        setConnected(true);
        setError(null);
        await joinGroups();
      })
      .catch((err) => {
        if (connectionRef.current !== connection) return;
        connectionRef.current = null;
        setError(err.message);
        setConnected(false);
        startedRef.current = false;
        void connection.stop();
      });
  }, [lotId, userId]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      const connection = connectionRef.current;
      connectionRef.current = null;
      startedRef.current = false;
      setConnected(false);
      void connection.stop();
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connected, error, connect, disconnect };
}
