'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WalletIconProps {
  connector?: string;
  className?: string;
}

export function WalletIcon({ connector, className }: WalletIconProps) {
  // Map connector names to icon components or images
  const getIcon = () => {
    switch (connector?.toLowerCase()) {
      case 'metamask':
        return <MetaMaskIcon className={className} />;
      case 'walletconnect':
        return <WalletConnectIcon className={className} />;
      case 'coinbase':
      case 'coinbase wallet':
        return <CoinbaseIcon className={className} />;
      case 'rainbow':
        return <RainbowIcon className={className} />;
      case 'ledger':
        return <LedgerIcon className={className} />;
      case 'trezor':
        return <TrezorIcon className={className} />;
      default:
        return <Wallet className={cn('text-gray-500 dark:text-gray-400', className)} />;
    }
  };

  return getIcon();
}

// MetaMask Icon
function MetaMaskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M36.5 3.5L22 14l2.7-6.3z"
        fill="#E17726"
        stroke="#E17726"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 3.5L17.8 14.1 15 7.7z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.3 27.5l-3.8 5.8 8.2 2.3 2.3-7.9zM2 27.7l2.3 7.9 8.2-2.3-3.8-5.8z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 17.5l-2.4 3.6 8.1.4-.3-8.7zM28 17.5l-5.5-5-2 8.9 8.1-.4z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 33.3l4.9-2.4-4.2-3.3zM22.6 30.9l4.9 2.4-.7-5.7z"
        fill="#E27625"
        stroke="#E27625"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.5 33.3l-4.9-2.4.4 3.2-.1 1.5zM12.5 33.3l4.6 2.3-.1-1.5.4-3.2z"
        fill="#D5BFB2"
        stroke="#D5BFB2"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.2 25.3l-4-1.2 2.8-1.3zM22.8 25.3l1.2-2.5 2.8 1.3z"
        fill="#233447"
        stroke="#233447"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 33.3l.7-5.8-4.5.1zM26.8 27.5l.7 5.8 3.8-5.7zM30.4 21.1l-8.1.4.8 4.3 1.2-2.5 2.8 1.3zM13.2 24.1l2.8-1.3 1.2 2.5.8-4.3-8.1-.4z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 21.1l3.4 6.6-.1-3.3zM26.7 24.4l-.1 3.3 3.4-6.6zM18 21.5l-.8 4.3.9 4.8.2-6.1zM22.3 21.5l-.3 3-.1 6.1.9-4.8z"
        fill="#E27525"
        stroke="#E27525"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.1 25.8l-.9 4.8.7.5 4.2-3.3.1-3.3zM13.2 24.5l.1 3.3 4.2 3.3.7-.5-.9-4.8z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.2 35.6l.1-1.5-.3-.3h-5.6l-.3.3.1 1.5-4.6-2.3 1.6 1.3 3.3 2.3h5.7l3.3-2.3 1.6-1.3z"
        fill="#C0AC9D"
        stroke="#C0AC9D"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22.6 30.9l-.7-.5h-3.8l-.7.5-.4 3.2.3-.3h5.6l.3.3z"
        fill="#161616"
        stroke="#161616"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37.2 14.8l1.2-5.9-1.8-5.4-13.6 10 5.2 4.4 7.4 2.2 1.6-1.9-.7-.5 1.1-1-.9-.7 1.1-.8zM1.6 8.9l1.2 5.9-.7.5 1.1.8-.8.7 1.1 1-.7.5 1.6 1.9 7.4-2.2 5.2-4.4L3.4 3.5z"
        fill="#763E1A"
        stroke="#763E1A"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35.7 19.5l-7.4-2.2 2.4 3.6-3.4 6.6 4.5-.1h6.7zM12 17.3l-7.4 2.2-2.7 8.1h6.7l4.5.1-3.4-6.6zM22.3 21.5l.5-8.1 2.2-5.9h-9.8l2.2 5.9.5 8.1.2 3 .1 6.1h3.8l.1-6.1z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeWidth="0.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// WalletConnect Icon
function WalletConnectIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 14.8c5.5-5.4 14.5-5.4 20 0l.7.6c.3.3.3.7 0 1l-2.3 2.2c-.1.1-.4.1-.5 0l-.9-.9c-3.9-3.8-10.1-3.8-14 0l-1 .9c-.1.1-.4.1-.5 0l-2.3-2.2c-.3-.3-.3-.7 0-1l.8-.6zm24.7 4.6l2 2c.3.3.3.7 0 1l-9.1 8.9c-.3.3-.7.3-1 0l-6.5-6.3c0-.1-.2-.1-.2 0l-6.5 6.3c-.3.3-.7.3-1 0l-9.1-8.9c-.3-.3-.3-.7 0-1l2-2c.3-.3.7-.3 1 0l6.5 6.3c0 .1.2.1.2 0l6.5-6.3c.3-.3.7-.3 1 0l6.5 6.3c0 .1.2.1.2 0l6.5-6.3c.3-.3.7-.3 1 0z"
        fill="#3B99FC"
      />
    </svg>
  );
}

// Coinbase Icon
function CoinbaseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="20" cy="20" r="18" fill="#0052FF" />
      <path
        d="M20 12c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 9h-2.5v2.5c0 .6-.4 1-1 1s-1-.4-1-1V21h-2.5c-.6 0-1-.4-1-1s.4-1 1-1H19v-2.5c0-.6.4-1 1-1s1 .4 1 1V19h2.5c.6 0 1 .4 1 1s-.4 1-1 1z"
        fill="white"
      />
    </svg>
  );
}

// Rainbow Icon
function RainbowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4D4D" />
          <stop offset="20%" stopColor="#FF9D4D" />
          <stop offset="40%" stopColor="#FFE14D" />
          <stop offset="60%" stopColor="#4DFF88" />
          <stop offset="80%" stopColor="#4D9DFF" />
          <stop offset="100%" stopColor="#9D4DFF" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#rainbow-gradient)" />
      <path
        d="M20 8c-6.6 0-12 5.4-12 12h4c0-4.4 3.6-8 8-8s8 3.6 8 8h4c0-6.6-5.4-12-12-12z"
        fill="white"
      />
      <circle cx="20" cy="26" r="3" fill="white" />
    </svg>
  );
}

// Ledger Icon
function LedgerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="#000000" />
      <path
        d="M28 12v8h-8v8h-8v-8h8v-8h8zm-16 0v8H4v-8h8zm0 16v8H4v-8h8z"
        fill="white"
      />
    </svg>
  );
}

// Trezor Icon
function TrezorIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="8" fill="#0F6148" />
      <path
        d="M20 8l-12 8v8c0 7.4 5.1 14.3 12 16 6.9-1.7 12-8.6 12-16v-8l-12-8zm0 4.8l8 5.3v6.1c0 5-3.4 9.7-8 10.8-4.6-1.1-8-5.8-8-10.8v-6.1l8-5.3z"
        fill="white"
      />
    </svg>
  );
}
