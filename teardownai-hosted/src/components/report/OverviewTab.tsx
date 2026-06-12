import React from 'react';
import { Report } from '@/lib/types';

export default function OverviewTab({ report }: { report: Report }) {
  const comps = (report.competitors || []).map(c => typeof c === 'object' ? c.name : c);
  const feats = (report.features || []).map((f, i) => <span key={i} className="pill">{f}</span>);

  // Radar logic
  const dims = [
    { label: 'UX', val: report.score_ux ?? report.score, color: '#2a5fa5' },
    { label: 'Market', val: report.score_market ?? report.score, color: '#1a6b4a' },
    { label: 'Moat', val: report.score_moat ?? report.score, color: '#6366f1' },
    { label: 'Growth', val: report.score_growth ?? report.score, color: '#10b981' },
    { label: 'Revenue', val: report.score_revenue ?? report.score, color: '#7c3aed' },
    { label: 'Retention', val: report.score_retention ?? report.score, color: '#be123c' }
  ];
  const cx = 130, cy = 130, R = 90, n = dims.length;
  const angle = (i: number) => (Math.PI * 2 * (i / n)) - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map((f, ringIdx) => {
    const dStr = Array.from({ length: n }, (_, i) => pt(i, R * f))
      .map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1])
      .join(' ') + 'Z';
    return <path key={ringIdx} d={dStr} fill="none" stroke="var(--border)" strokeWidth="1" />;
  });

  // Spokes
  const spokes = Array.from({ length: n }, (_, i) => {
    const [x, y] = pt(i, R);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
  });

  // Data Polygon
  const polyD = dims.map((d2, i) => {
    const r = R * (Math.min(d2.val, 100) / 100);
    const [x, y] = pt(i, r);
    return (i === 0 ? 'M' : 'L') + x + ' ' + y;
  }).join(' ') + 'Z';

  // Labels
  const labels = dims.map((d2, i) => {
    const [x, y] = pt(i, R + 18);
    const anchor = x < cx - 5 ? 'end' : (x > cx + 5 ? 'start' : 'middle');
    return (
      <text key={i} x={x} y={y + 4} textAnchor={anchor} fontSize="11" fill="var(--muted)" fontFamily="DM Sans, sans-serif" fontWeight="600">
        {d2.label}
        <tspan x={x} dy="13" fontWeight="700" fill="var(--ink)">{Math.min(d2.val, 100)}</tspan>
      </text>
    );
  });

  // Dots
  const dots = dims.map((d2, i) => {
    const r = R * (Math.min(d2.val, 100) / 100);
    const [x, y] = pt(i, r);
    return <circle key={i} cx={x} cy={y} r="4" fill={d2.color} stroke="var(--bg)" strokeWidth="1.5" />;
  });

  const sources = (report.sources && report.sources.filter(Boolean).length > 0)
    ? report.sources.filter(Boolean)
    : ['OpenAI', 'Crunchbase', 'Company website', 'App Store reviews'];

  return (
    <div className="tab-panel">
      <div className="overview-grid">
        <div className="radar-wrap">
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px', textAlign: 'center' }}>
            Product Score Radar
          </div>
          <svg viewBox="0 0 260 260" width="260" height="260" xmlns="http://www.w3.org/2000/svg">
            {rings}
            {spokes}
            <path d={polyD} fill="rgba(42,95,165,.12)" stroke="#2a5fa5" strokeWidth="2" strokeLinejoin="round" />
            {dots}
            {labels}
          </svg>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0, width: '100%' }}>
          <div className="ov-card"><div className="ov-label">Problem solved</div><div className="ov-val">{report.problem || ''}</div></div>
          <div className="ov-card"><div className="ov-label">Value proposition</div><div className="ov-val">{report.value || ''}</div></div>
          <div className="ov-card"><div className="ov-label">Target users</div><div className="ov-val">{report.users || ''}</div></div>
          <div className="ov-card"><div className="ov-label">Revenue model</div><div className="ov-val">{report.revenue || ''}</div></div>
        </div>
      </div>

      <div className="ov-card" style={{ marginBottom: '12px', marginTop: '12px' }}>
        <div className="ov-label">Competitors</div>
        <div className="ov-comp-list" style={{ marginTop: '6px' }}>
          {comps.map((c, i) => <span key={i} className="comp-chip">{c}</span>)}
        </div>
      </div>

      <div className="ov-card" style={{ marginBottom: '12px' }}>
        <div className="ov-label">Recommended next features</div>
        <div className="feat-pill-list" style={{ marginTop: '8px' }}>
          {feats}
        </div>
      </div>

      <div className="ov-card" style={{ marginTop: '12px' }}>
        <div className="ov-label">📌 Sources & Citations</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
          {sources.map((s, i) => (
            <span key={i} className="source-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--dim)' }}>•</span> {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
