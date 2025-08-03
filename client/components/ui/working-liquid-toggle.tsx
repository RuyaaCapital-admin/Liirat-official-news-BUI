import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function WorkingLiquidToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <input
        type="checkbox"
        role="switch"
        checked={isDark}
        onChange={handleToggle}
        aria-label="Toggle dark/light theme"
        className="liquid-toggle"
      />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .liquid-toggle {
            --primary: #000;
            --secondary: #fff;
            --time: 0.6s;
            appearance: none;
            position: relative;
            cursor: pointer;
            width: 2.5em;
            aspect-ratio: 2 / 1;
            background: var(--primary);
            border-radius: 20em;
            box-shadow: 0 0 0 0.25em var(--secondary);
            transform: translateX(0.5px);
            transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1);
            filter: blur(0.17em) contrast(20);
            mix-blend-mode: darken;
            overflow: hidden;
            margin: 0 auto;
          }

          .liquid-toggle::before {
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

          .liquid-toggle:checked {
            transform: translateX(-0.5px);
          }

          .liquid-toggle:checked::before {
            transform: translate(-75%, -50%);
          }

          .liquid-toggle:focus-visible {
            outline: 2px solid rgba(255, 255, 255, 0.5);
            outline-offset: 2px;
          }

          @media (max-width: 768px) {
            .liquid-toggle {
              width: 2em;
              box-shadow: 0 0 0 0.2em var(--secondary);
              filter: blur(0.13em) contrast(20);
            }
          }
        `
      }} />
    </div>
  );
}
