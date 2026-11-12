import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices } from 'lucide-react';

export interface Roll { expr: string; total: number; by: string; at: number; detail?: string }

const DICE = [4, 6, 8, 10, 12, 20, 100];
const BURST = Array.from({ length: 12 }, (_, i) => i);

/** Barra de dados do tabletop: rola, anima e avisa quem rolou. */
export const DiceBar = ({ onRoll, compact }: { onRoll: (roll: Roll) => void; compact?: boolean }) => {
  const roll = (sides: number) => {
    const total = 1 + Math.floor(Math.random() * sides);
    onRoll({ expr: `d${sides}`, total, by: '', at: Date.now() });
  };
  return (
    <div className={`flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 backdrop-blur px-3 py-1.5 shadow-lg ${compact ? 'flex-wrap justify-center rounded-xl' : ''}`}>
      <Dices className="w-4 h-4 text-primary shrink-0" />
      {DICE.map(d => (
        <button key={d} onClick={() => roll(d)}
          className="text-xs font-bold px-2 py-1 rounded-md hover:bg-primary/20 hover:text-primary transition-colors">
          d{d}
        </button>
      ))}
    </div>
  );
};

/** Animação de dado rolando que aparece para todos quando alguém rola. */
export const DiceAnimation = ({ roll }: { roll: Roll | null }) => {
  const [shown, setShown] = useState<Roll | null>(null);
  const [phase, setPhase] = useState<'rolling' | 'done'>('rolling');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!roll) return;
    setShown(roll);
    setPhase('rolling');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase('done'), 900);
    const hide = setTimeout(() => setShown(null), 3500);
    return () => { clearTimeout(timer.current); clearTimeout(hide); };
  }, [roll]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={shown.at}
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: -20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary/50 bg-card/90 backdrop-blur px-6 py-4 shadow-2xl">
            <motion.div
              className="relative grid place-items-center w-20 h-20"
              animate={phase === 'rolling' ? { x: [0, -4, 4, -3, 0], rotate: [0, 12, -14, 8, 0] } : { scale: [0.8, 1.2, 1] }}
              transition={phase === 'rolling' ? { duration: 0.3, repeat: Infinity } : { duration: 0.45 }}
            >
              <motion.div
                animate={phase === 'rolling' ? { rotate: [0, 360, 720], scale: [1, 1.35, 0.95] } : { rotate: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="relative z-10 w-14 h-14 rounded-xl bg-primary/20 border border-primary flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
              >
                {phase === 'rolling'
                  ? <Dices className="w-8 h-8 text-primary" />
                  : <span className="text-2xl font-display font-bold text-primary">{shown.total}</span>}
              </motion.div>
              {BURST.map(i => {
                const angle = (i / BURST.length) * Math.PI * 2;
                return <motion.span key={`${shown.at}-${i}`} className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={phase === 'done' ? { x: Math.cos(angle) * 48, y: Math.sin(angle) * 48, scale: [0, 1, 0], opacity: [1, 1, 0] } : { opacity: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.01 }} />;
              })}
            </motion.div>
            {shown.detail && <p className="text-xs text-muted-foreground">{shown.detail}</p>}
            <p className="text-xs text-muted-foreground">
              {shown.by ? `${shown.by} rolou` : 'Rolagem'} {shown.expr}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
