import React, { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";

export function NewLiquidToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-12 h-6 bg-gray-300 rounded-full relative">
        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
      </div>
    );
  }

  const isDark = theme === "dark";

  const handleToggle = () => {
    toggleTheme();
  };

  return (
    <div className="liquid-toggle-container">
      <input
        type="checkbox"
        role="switch"
        className="liquid-toggle-input"
        checked={isDark}
        onChange={handleToggle}
        aria-label="Toggle dark/light theme"
      />

      <style jsx={true} global={true}>{`
        .liquid-toggle-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .liquid-toggle-input {
          --primary: ${isDark ? "#fff" : "#000"};
          --secondary: ${isDark ? "#000" : "#fff"};
          --time: 0.6s;

          appearance: none;
          position: relative;
          cursor: pointer;
          width: 3em;
          aspect-ratio: 2 / 1;
          background: var(--primary);
          border-radius: 20em;
          box-shadow: 0 0 0 0.3em var(--secondary);
          transform: translateX(0.5px);
          transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1);
          filter: blur(0.2em) contrast(20);
          mix-blend-mode: darken;
          overflow: hidden;
          margin: 0;
        }

        .liquid-toggle-input::before {
          content: "";
          position: absolute;
          width: 200%;
          height: 100%;
          left: 50%;
          top: 50%;
          transform: translate(-25%, -50%);
          background:
            radial-gradient(
              closest-side circle at 12.5% 50%,
              var(--secondary) 50%,
              #0000 0
            ),
            radial-gradient(
              closest-side circle at 87.5% 50%,
              var(--secondary) 50%,
              #0000 0
            ),
            #f000;
          transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1.3);
        }

        .liquid-toggle-input:checked {
          transform: translateX(-0.5px);
        }

        .liquid-toggle-input:checked::before {
          transform: translate(-75%, -50%);
        }

        .liquid-toggle-input:focus-visible {
          outline: 2px solid rgba(34, 197, 94, 0.5);
          outline-offset: 2px;
        }

        @media (max-width: 768px) {
          .liquid-toggle-input {
            width: 2.5em;
            box-shadow: 0 0 0 0.25em var(--secondary);
            filter: blur(0.17em) contrast(20);
          }
        }
      `}</style>
    </div>
  );
}
