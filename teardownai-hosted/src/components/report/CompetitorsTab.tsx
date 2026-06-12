import React from 'react';
import { Report } from '@/lib/types';

export default function CompetitorsTab({ report, animate }: { report: Report; animate: boolean }) {
  const raw = (report.competitors || []).slice(0, 5).map(c => typeof c === 'string' ? { name: c, threat: 'medium', ux: 65, features: 65, pricing: 65, market: 60 } : c);
  const tc: Record<string, string> = { high: 'comp-tag-threat', medium: 'comp-tag-watch', low: 'comp-tag-minor' };
  const colors = ['#2a5fa5', '#1a6b4a', '#d4520a', '#b45309', '#7c3aed'];

  const W = 480, H = 240, PL = 60, PB = 36, PT = 16, PR = 16;
  const iW = W - PL - PR, iH = H - PB - PT;
  const scX = (v: number) => PL + (v / 100) * iW;
  const scY = (v: number) => PT + iH - (v / 100) * iH;

  const bubbles = raw.map((c, i) => {
    const x = scX(c.ux || 65);
    const y = scY(c.market || 60);
    const r = 6 + ((c.features || 65) / 100) * 18;
    return (
      <g key={i}>
        <circle cx={x} cy={y} r={r} fill={colors[i]} opacity=".85" stroke="#fff" strokeWidth="1.5" />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">
          {c.name.split(' ')[0].slice(0, 6)}
        </text>
      </g>
    );
  });

  const xLabels = [0, 25, 50, 75, 100].map((v, i) => (
    <text key={i} x={scX(v)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{v}</text>
  ));
  const yLabels = [0, 25, 50, 75, 100].map((v, i) => (
    <text key={i} x={PL - 6} y={scY(v) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{v}</text>
  ));
  const gridX = [25, 50, 75].map((v, i) => (
    <line key={i} x1={scX(v)} y1={PT} x2={scX(v)} y2={PT + iH} stroke="var(--border)" strokeWidth="1" strokeDasharray="3" />
  ));
  const gridY = [25, 50, 75].map((v, i) => (
    <line key={i} x1={PL} y1={scY(v)} x2={PL + iW} y2={scY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3" />
  ));

  return (
    <div className="tab-panel">
      <div className="comp-layout">
        <div className="comp-chart-panel" style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>
            Competitive Positioning Map
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
            <rect x={PL} y={PT} width={iW} height={iH} fill="none" stroke="var(--border)" strokeWidth="1" />
            {gridX}
            {gridY}
            {bubbles}
            {xLabels}
            {yLabels}
            <text x={PL + iW / 2} y={H} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">UX Quality →</text>
            <text x="10" y={PT + iH / 2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,10,${PT + iH / 2})`}>Market Fit →</text>
            <text x={PL + iW - 4} y={PT + 14} textAnchor="end" fontSize="9" fill="var(--muted)">Bubble size = Features</text>
          </svg>
        </div>
        <div className="comp-table">
          {raw.map((c, i) => {
            const dom = c.name.toLowerCase().replace(/\s/g, '') + '.com';
            return (
              <div key={i} className="comp-row">
                <div className="comp-row-top">
                  <div className="comp-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i], flexShrink: 0 }}></div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`}
                      style={{ width: '18px', height: '18px', borderRadius: '3px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      alt={c.name}
                    />
                    {c.name}
                  </div>
                  <span className={`comp-tag ${tc[c.threat] || 'comp-tag-watch'}`}>{c.threat || 'medium'} threat</span>
                </div>
                <div className="comp-bars">
                  {[
                    { label: 'UX', val: c.ux || 65 },
                    { label: 'Features', val: c.features || 65 },
                    { label: 'Pricing', val: c.pricing || 65 },
                    { label: 'Market fit', val: c.market || 60 }
                  ].map((bar, idx) => (
                    <div key={idx} className="comp-bar-row">
                      <span className="comp-bar-label">{bar.label}</span>
                      <div className="comp-bar-track">
                        <div className="comp-bar-fill" style={{ width: animate ? `${bar.val}%` : '0%', background: colors[i], transition: 'width 0.8s ease' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', width: '28px', textAlign: 'right' }}>{bar.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
