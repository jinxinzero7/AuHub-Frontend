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

  const connect = useCallback(() => {
    if (connectionRef.current || startedRef.current) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/auction`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => setConnected(false));
    connection.onreconnected(() => {
      setConnected(true);
      if (lotId) connection.invoke("JoinLotGroup", lotId);
      if (userId) connection.invoke("JoinUserGroup", userId);
    });
    connection.onclose(() => {
      setConnected(false);
      startedRef.current = false;
    });

    if (onNewBid) {
      connection.on("NewBidPlaced", (message: SignalRMessage) => {
        if (!lotId || message.lotId === lotId) {
          onNewBid(message);
        }
      });
    }

    if (onLotCompleted) {
      connection.on("LotCompleted", (message: { lotId: string; winnerName: string; finalPrice: number }) => {
        if (!lotId || message.lotId === lotId) {
          onLotCompleted(message);
        }
      });
    }

    if (onNewNotification) {
      connection.on("NewNotification", (message: NotificationMessage) => {
        onNewNotification(message);
      });
    }

    startedRef.current = true;
    connection.start()
      .then(() => {
        setConnected(true);
        if (lotId) connection.invoke("JoinLotGroup", lotId);
        if (userId) connection.invoke("JoinUserGroup", userId);
      })
      .catch((err) => {
        setError(err.message);
        startedRef.current = false;
      });
  }, [lotId, userId, onNewBid, onLotCompleted, onNewNotification]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.stop();
      connectionRef.current = null;
      startedRef.current = false;
      setConnected(false);
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
