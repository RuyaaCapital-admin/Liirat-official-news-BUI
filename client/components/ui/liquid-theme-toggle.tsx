import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from 'next-themes';

const Switch = () => {
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
    <StyledWrapper>
      <input 
        type="checkbox" 
        role="switch" 
        className="liquid-3" 
        checked={isDark}
        onChange={handleToggle}
        aria-label="Toggle dark/light theme"
      />
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;

  .liquid-3 {
    --primary: #000;
    --secondary: #fff;
    --time: 0.6s;
    appearance: none;
    position: relative;
    cursor: pointer;
    width: 4em;
    aspect-ratio: 2 / 1;
    background: var(--primary);
    border-radius: 20em;
    box-shadow: 0 0 0 0.25em var(--secondary);
    transform: translateX(0.5px);
    transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1);
    filter: blur(0.16em) contrast(20);
    mix-blend-mode: difference;
    overflow: hidden;
    margin: 0 auto;

    &::before {
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
        transparent;
      transition: transform var(--time) cubic-bezier(0.75, 0, 0.75, 1.3);
    }

    &:checked {
      transform: translateX(-0.5px);
      &::before {
        transform: translate(-75%, -50%);
      }
    }

    &:focus-visible {
      outline: 2px solid hsl(var(--primary));
      outline-offset: 2px;
    }

    @media (max-width: 768px) {
      width: 3em;
      box-shadow: 0 0 0 0.2em var(--secondary);
    }
  }
`;

export default Switch;
