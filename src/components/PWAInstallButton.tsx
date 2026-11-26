import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="glass-block inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all hover:scale-[1.01] cursor-pointer whitespace-nowrap"
        style={{ color: 'var(--accent-primary)' }}
        aria-label="Install Nin's Calorie Tracker app"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install App
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="glass-block w-full max-w-sm rounded-3xl p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="ios-install-title"
                  className="font-display text-base font-bold"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  Install Nin&apos;s Tracker
                </h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                  Add this app to your Home Screen for full-screen tracking and offline access:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-black/5 cursor-pointer"
                style={{ color: 'var(--ink-muted)' }}
                aria-label="Close install instructions"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <ol
              className="mt-4 space-y-2.5 text-xs font-medium"
              style={{ color: 'var(--ink-primary)' }}
            >
              <li className="glass-block flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
                <span className="btn-theme-gradient flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  1
                </span>
                <span className="inline-flex items-center gap-1">
                  Tap the <Share className="inline h-3.5 w-3.5" aria-hidden="true" /> Share button in Safari
                </span>
              </li>
              <li className="glass-block flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
                <span className="btn-theme-gradient flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  2
                </span>
                <span>Scroll and tap &ldquo;Add to Home Screen&rdquo;</span>
              </li>
              <li className="glass-block flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
                <span className="btn-theme-gradient flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  3
                </span>
                <span>Tap &ldquo;Add&rdquo; in the top right corner</span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="btn-theme-gradient mt-4 w-full min-h-[42px] rounded-xl text-xs font-semibold text-white cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
