import React from 'react';
import { Report } from '@/lib/types';

export default function MetricsTab({ report, animate }: { report: Report; animate: boolean }) {
  const mets = report.metrics || [
    { name: 'North Star', importance: 95, priority: 'high', value: 'DAU/MAU' },
    { name: 'DAU', importance: 90, priority: 'high', value: 'Daily count' },
    { name: 'D7 Retention', importance: 85, priority: 'high', value: '% returning' },
    { name: 'Activation', importance: 80, priority: 'high', value: '% onboarded' },
    { name: 'Conversion', importance: 75, priority: 'medium', value: 'Free→Paid' },
    { name: 'Churn', importance: 65, priority: 'medium', value: 'Monthly %' },
    { name: 'NPS', importance: 60, priority: 'medium', value: '0–100' },
    { name: 'Feature Adopt.', importance: 55, priority: 'low', value: '% using' }
  ];
  const pc: Record<string, string> = { high: '#1a6b4a', medium: '#d4a017', low: '#6b6860' };
  const pb: Record<string, string> = { high: 'mt-high', medium: 'mt-med', low: 'mt-low' };

  // Gauge helper
  const renderGauge = (val: number, color: string) => {
    const r = 28, circ = 2 * Math.PI * r, fill = circ - (val / 100) * circ;
    return (
      <svg className="gauge-svg" viewBox="0 0 70 70" width="60" height="60">
        <circle cx="35" cy="35" r={r} fill="none" stroke="var(--bg3)" strokeWidth="7" />
        <circle
          cx="35"
          cy="35"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={animate ? fill : circ}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="35" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">{val}</text>
      </svg>
    );
  };

  return (
    <div className="tab-panel">
      <div className="gauge-grid" style={{ marginBottom: '16px' }}>
        {mets.slice(0, 4).map((m, i) => (
          <div key={i} className="gauge-card">
            {renderGauge(m.importance, pc[m.priority] || '#6b6860')}
            <div className="gauge-val">{m.value}</div>
            <div className="gauge-lbl">{m.name}</div>
            <div className="gauge-trend" style={{ color: pc[m.priority] || '#6b6860' }}>{m.priority}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>
        All Metrics — Priority Ranking
      </div>
      <div className="metrics-table">
        <div className="mt-row header"><div>Metric</div><div>Importance</div><div style={{ textAlign: 'center' }}>Score</div><div>Priority</div></div>
        {mets.map((m, i) => (
          <div key={i} className="mt-row">
            <div className="mt-name">
              {m.name}
              <div style={{ fontSize: '11px', color: 'var(--dim)', fontWeight: 400 }}>{m.value}</div>
            </div>
            <div className="mt-bar-wrap">
              <div className="mt-bar" style={{ width: animate ? `${m.importance}%` : '0%', background: pc[m.priority] || '#6b6860', transition: 'width 0.8s ease' }}></div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>{m.importance}%</div>
            <div><span className={`mt-pri ${pb[m.priority] || 'mt-low'}`}>{m.priority}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
