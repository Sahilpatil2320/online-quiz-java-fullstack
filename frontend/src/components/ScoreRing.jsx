import { formatPercent } from '../utils/format';

/** Circular score chart drawn from the percentage returned by the server. */
export default function ScoreRing({ percentage, label = 'Score', size = 200 }) {
  const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const tone = pct >= 75 ? 'good' : pct >= 40 ? 'ok' : 'low';
  return (
    <div className={`score-ring score-${tone}`} style={{ width: size, height: size }}
         role="img" aria-label={`${label}: ${formatPercent(pct)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
        <circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-text">
        <strong>{formatPercent(pct)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
