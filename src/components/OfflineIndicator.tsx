import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-block fixed bottom-20 left-4 z-40 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-md md:bottom-5"
      style={{ color: 'var(--ink-primary)' }}
    >
      <WifiOff className="h-3.5 w-3.5" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
      <span>Offline · Logs saved locally</span>
    </div>
  );
};
