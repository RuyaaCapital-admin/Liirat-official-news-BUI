import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface FunctionalLiquidToggleProps {
  className?: string;
}

export function FunctionalLiquidToggle({ className }: FunctionalLiquidToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className={className}>
      <input
        type="checkbox"
        role="switch"
        checked={isDark}
        onChange={handleToggle}
        aria-label="Toggle dark/light theme"
        style={{
          // CSS Variables
          ['--primary' as any]: '#000',
          ['--secondary' as any]: '#fff',
          ['--time' as any]: '0.6s',
          
          // Base styles
          appearance: 'none',
          position: 'relative',
          cursor: 'pointer',
          width: '2.5em',
          aspectRatio: '2 / 1',
          background: 'var(--primary)',
          borderRadius: '20em',
          boxShadow: '0 0 0 0.25em var(--secondary)',
          transform: 'translateX(0.5px)',
          transition: 'transform var(--time) cubic-bezier(0.75, 0, 0.75, 1)',
          filter: 'blur(0.17em) contrast(20)',
          mixBlendMode: 'darken',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => {
          // Add the ::before pseudo-element effect via a separate div
          const input = e.target as HTMLInputElement;
          const rect = input.getBoundingClientRect();
          
          // Create the liquid blob effect
          if (!input.querySelector('.liquid-blob')) {
            const blob = document.createElement('div');
            blob.className = 'liquid-blob';
            blob.style.cssText = `
              content: "";
              position: absolute;
              width: 200%;
              height: 100%;
              transform: translate(-25%, -50%);
              left: 50%;
              top: 50%;
              background: radial-gradient(
                closest-side circle at 12.5% 50%,
                var(--secondary) 50%,
                transparent 0
              ),
              radial-gradient(
                closest-side circle at 87.5% 50%,
                var(--secondary) 50%,
                transparent 0
              ),
              #f000;
              transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1.3);
              pointer-events: none;
            `;
            input.appendChild(blob);
          }
        }}
      />
      
      <style jsx>{`
        input[type="checkbox"]:checked {
          transform: translateX(-0.5px) !important;
        }
        
        input[type="checkbox"]:checked .liquid-blob {
          transform: translate(-75%, -50%) !important;
        }
        
        @media (max-width: 768px) {
          input[type="checkbox"] {
            width: 2em !important;
            box-shadow: 0 0 0 0.2em var(--secondary) !important;
            filter: blur(0.13em) contrast(20) !important;
          }
        }
      `}</style>
    </div>
  );
}
