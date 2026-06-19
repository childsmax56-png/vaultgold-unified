import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'bully_deluxe_popup_dismissed';

export function AnnouncementPopup() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(STORAGE_KEY));

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <div className="absolute inset-0 bg-black/70" />
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative max-w-xs w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Card */}
            <div className="bg-black border border-white/20 rounded-lg overflow-hidden select-none" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              <div className="relative p-6 pb-5">
                {/* Corner stars */}
                {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
                  <span key={i} className={`absolute ${pos} text-white text-lg`}>★</span>
                ))}

                {/* Inner border */}
                <div className="border border-white/40 rounded p-4 flex flex-col items-center gap-1">
                  <p className="text-white text-xs tracking-[0.25em] uppercase">YE</p>
                  <p className="text-white text-5xl font-black tracking-tight leading-none text-center uppercase">BULLY<br />DELUXE</p>
                  <div className="flex items-center gap-2 w-full justify-center mt-1">
                    <div className="flex-1 h-px bg-white/60" />
                    <p className="text-white text-[10px] tracking-[0.3em] uppercase whitespace-nowrap">Listening Party</p>
                    <div className="flex-1 h-px bg-white/60" />
                  </div>
                  <p className="text-white text-4xl font-black tracking-tight uppercase mt-1">TONIGHT</p>
                  <p className="text-white text-2xl font-black tracking-widest">!!!!!!!!!!!</p>

                  {/* Time grid */}
                  <div className="grid grid-cols-4 border border-white/50 divide-x divide-white/50 mt-2 w-full text-center">
                    {[['11PM','CT'],['12AM','ET'],['10PM','MT'],['9PM','PT']].map(([time, tz]) => (
                      <div key={tz} className="py-1.5">
                        <div className="text-white font-black text-sm">{time}</div>
                        <div className="text-white/70 text-[10px] tracking-widest">{tz}</div>
                      </div>
                    ))}
                  </div>

                  <p className="text-white text-[10px] tracking-[0.25em] uppercase mt-3">On Our Discord</p>
                  <div className="border border-white/60 rounded px-4 py-1.5 mt-1">
                    <p className="text-white text-sm font-bold tracking-wide">discord.gg/67BveMsE</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={dismiss}
              className="absolute -top-3 -right-3 bg-white text-black rounded-full p-1 hover:bg-white/80 transition-colors shadow-lg"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
