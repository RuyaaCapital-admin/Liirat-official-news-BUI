import React, { useState, useEffect } from "react";
import { X, Bell, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PriceNotification {
  id: string;
  symbol: string;
  currentPrice: number;
  targetPrice: number;
  condition: "above" | "below";
  timestamp: Date;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<PriceNotification[]>([]);

  // Function to add new notification
  const addNotification = (
    notification: Omit<PriceNotification, "id" | "timestamp">,
  ) => {
    const newNotification: PriceNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]); // Keep max 5

    // Play sound alert
    playAlertSound();

    // Auto-remove after 10 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 10000);

    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`Price Alert: ${notification.symbol}`, {
        body: `${notification.symbol} is now ${notification.condition} ${notification.targetPrice.toFixed(4)}`,
        icon: "/favicon.ico",
        tag: notification.symbol,
      });
    }
  };

  // Play alert sound function
  const playAlertSound = () => {
    try {
      // Create audio context for better cross-browser support
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create oscillator for alert sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure alert tone (800Hz for 200ms, then 600Hz for 200ms)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);

      // Volume control
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);

    } catch (error) {
      // Fallback: Try to use simple audio element
      try {
        // Create a simple beep sound using data URL
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCSGF0fPTgjMGHm7A7+OZYA0PVanm8bllHgg2jdj20Ic1BypnvOnvpVITC0ml4PK8aB4GM47V9M2SOAUfcsnw3I1FBxho0/LZfD4JIGq+8OOYXg4QT6/k8LdnHQo3k9Xzz44uBSJ4y+3akUcDCjePzPDLCCMKImms6+6nUhcCTpzt9L9nJwoaM47Z992fSgoJXa3h6rdaFhJSvOPvxmfE");
        audio.volume = 0.3;
        audio.play().catch(() => {
          console.warn('Could not play alert sound');
        });
      } catch (fallbackError) {
        console.warn('Alert sound not available');
      }
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Expose addNotification function globally for use by alert system
  useEffect(() => {
    (window as any).addPriceNotification = addNotification;
    return () => {
      delete (window as any).addPriceNotification;
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className={cn("fixed top-20 right-4 z-[200] space-y-2", className)}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {notification.condition === "above" ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  Price Alert: {notification.symbol}
                </h4>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mt-1">
                Current price:{" "}
                <span className="font-mono font-medium">
                  {notification.currentPrice.toFixed(4)}
                </span>
              </p>

              <p className="text-sm text-muted-foreground">
                Target was:{" "}
                <span className="font-mono">
                  {notification.condition} {notification.targetPrice.toFixed(4)}
                </span>
              </p>

              <p className="text-xs text-muted-foreground mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
