import { getClassificationBadgeClasses } from '../config/changeEngineConfig';
import type { ChangeClassification } from '../types';

interface ScoreBadgeProps {
  score: number;
  classification: ChangeClassification;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({
  score,
  classification,
  showScore = true,
  size = 'md',
}: ScoreBadgeProps) {
  const classes = getClassificationBadgeClasses(classification);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-bold uppercase tracking-wider',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-bold uppercase tracking-wider',
    lg: 'text-xs px-3.5 py-1 gap-2 font-bold uppercase tracking-wider',
  }[size];

  return (
    <div
      id={`score-badge-${classification.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center rounded-full border ${classes.bg} ${classes.border} ${classes.text} ${sizeClasses} transition-colors whitespace-nowrap shadow-2xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${classes.dot}`} />
      <span>{classification}</span>
      {showScore && (
        <span className="opacity-80 font-mono text-[10px] font-bold">
          ({score})
        </span>
      )}
    </div>
  );
}
