import { riskLabel, scoreColor } from "../utils/score";

// Jauge circulaire du score de vulnérabilité composite (0-100), calculé côté
// backend. Dessinée en SVG plutôt qu'avec une librairie de graphiques pour
// rester cohérente avec docs/maquettes/resultats.html sans dépendance externe.
export default function ScoreRing({ score, size = 150 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = size * 0.4;
  const stroke = size * 0.093;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (clamped / 100) * circumference;
  const color = scoreColor(clamped);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score de vulnérabilité ${clamped} sur 100`}>
      <title>Score de vulnérabilité</title>
      <circle cx={center} cy={center} r={r} fill="none" stroke="var(--bg)" strokeWidth={stroke} strokeLinecap="round" />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - size * 0.03} textAnchor="middle" fontSize={size * 0.19} fontWeight="700" fill={color} fontFamily="system-ui">
        {clamped}
      </text>
      <text x={center} y={center + size * 0.09} textAnchor="middle" fontSize={size * 0.073} fill="var(--text3)" fontFamily="system-ui">
        / 100
      </text>
      <text x={center} y={center + size * 0.19} textAnchor="middle" fontSize={size * 0.067} fontWeight="600" fill={color} fontFamily="system-ui">
        {riskLabel(clamped).toUpperCase()}
      </text>
    </svg>
  );
}
