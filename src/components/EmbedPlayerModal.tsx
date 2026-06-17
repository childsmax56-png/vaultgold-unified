import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';

export type EmbedService = 'samply' | 'untitled';

export interface EmbedTarget {
  service: EmbedService;
  url: string;
  label?: string;
}

/** Detect which service a URL belongs to, or null if neither. */
export function detectEmbedService(url: string): EmbedService | null {
  if (url.includes('samply.app')) return 'samply';
  if (url.includes('untitled.stream')) return 'untitled';
  return null;
}

/** Convert a Samply share URL to a clean embed src (strips tracking params). */
function samplyEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // Keep only the path — drop ?si= tracking tokens
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

/** Extract the project ID from an untitled.stream URL and build the deep link. */
function untitledDeepLink(url: string): string {
  try {
    const u = new URL(url);
    // e.g. /library/project/2aE0ENV3QVJgkQKkS7Ljw → untitled://library/project/2aE0ENV3QVJgkQKkS7Ljw
    return `untitled:/${u.pathname}`;
  } catch {
    return url;
  }
}

interface Props {
  target: EmbedTarget | null;
  onClose: () => void;
}

export function EmbedPlayerModal({ target, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Fire Untitled deep link as soon as the modal mounts for that service
  useEffect(() => {
    if (!target || target.service !== 'untitled') return;
    const deep = untitledDeepLink(target.url);
    window.location.href = deep;
  }, [target]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!target) return null;

  if (target.service === 'untitled') {
    return createPortal(
      <AnimatePresence>
        <motion.div
          key="untitled-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={overlayRef}
          onClick={e => { if (e.target === overlayRef.current) onClose(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{
              background: '#111', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%',
              textAlign: 'center',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute' as const, top: 14, right: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', display: 'flex',
              }}
            >
              <X size={18} />
            </button>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎵</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              Opening in Untitled
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              {target.label ? `"${target.label}" is` : 'This project is'} hosted on Untitled.
              It should open in the Untitled app automatically.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <a
                href={untitledDeepLink(target.url)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', textDecoration: 'none', cursor: 'pointer',
                }}
              >
                Open Untitled App
              </a>
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
                }}
              >
                <ExternalLink size={12} />
                Web
              </a>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }

  // Samply — full iframe embed
  const embedSrc = samplyEmbedUrl(target.url);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="samply-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden',
            width: '100%', maxWidth: 480,
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                {target.label || 'Samply'}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
                background: 'rgba(255,215,0,0.12)', color: '#FFD700',
                border: '1px solid rgba(255,215,0,0.2)',
              }}>Samply</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={target.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)'; }}
              >
                <ExternalLink size={11} /> Open
              </a>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 4,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Iframe */}
          <iframe
            src={embedSrc}
            style={{
              width: '100%',
              height: 560,
              border: 'none',
              display: 'block',
            }}
            allow="autoplay; clipboard-write"
            allowFullScreen
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
