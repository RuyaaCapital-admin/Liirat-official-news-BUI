import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  apiStatus: "online" | "offline" | "degraded" | "unknown";
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isChecking: false,
    lastChecked: null,
    apiStatus: "unknown",
  });

  // Check API connectivity
  const checkApiStatus = useCallback(async (): Promise<
    "online" | "offline" | "degraded"
  > => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/status", {
        method: "GET",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Check if critical services are working
        const hasErrors = Object.values(data.checks || {}).some(
          (check: any) => check.status === "error",
        );

        return hasErrors ? "degraded" : "online";
      } else {
        return "degraded";
      }
    } catch (error) {
      console.warn("[NETWORK] API status check failed:", error);
      return "offline";
    }
  }, []);

  // Full network check
  const checkNetworkStatus = useCallback(async () => {
    setStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      const apiStatus = await checkApiStatus();

      setStatus((prev) => ({
        ...prev,
        isOnline: navigator.onLine,
        isChecking: false,
        lastChecked: new Date(),
        apiStatus,
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
        apiStatus: "offline",
      }));
    }
  }, [checkApiStatus]);

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      checkNetworkStatus(); // Re-check API when coming back online
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        apiStatus: "offline",
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkNetworkStatus]);

  // Initial check
  useEffect(() => {
    checkNetworkStatus();
  }, [checkNetworkStatus]);

  // Periodic API health checks (every 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (status.isOnline) {
        checkNetworkStatus();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [status.isOnline, checkNetworkStatus]);

  return {
    ...status,
    checkNetworkStatus,
    isApiAvailable: status.apiStatus === "online",
    isDegraded: status.apiStatus === "degraded",
  };
}
