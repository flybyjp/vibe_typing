import { useEffect, useState, useMemo } from 'react';
import styles from './PointFlash.module.css';

interface PointFlashProps {
  side: 'left' | 'right';
  playerName: string;
  onAnimationEnd: () => void;
}

export function PointFlash({ side, playerName, onAnimationEnd }: PointFlashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onAnimationEnd();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      angle: `${(i * 360) / 20}deg`,
      dist: `${150 + Math.random() * 120}px`,
      delay: `${Math.random() * 0.2}s`,
      size: `${6 + Math.random() * 10}px`,
    })), []
  );

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={`${styles.flash} ${styles[side]}`} />

      <div className={styles.banner}>
        <div className={styles.bannerText}>{playerName}</div>
        <div className={styles.bannerSub}>POINT!</div>
      </div>

      <div className={styles.particles}>
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              '--angle': p.angle,
              '--dist': p.dist,
              '--delay': p.delay,
              '--size': p.size,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
