import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: 'primary' | 'secondary';
  label?: string;
}

export function ProgressBar({ progress, color = 'primary', label }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.track}>
        <div
          className={`${styles.bar} ${styles[color]}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <span className={styles.percentage}>{Math.round(clampedProgress)}%</span>
    </div>
  );
}
