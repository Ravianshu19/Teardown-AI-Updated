import React from 'react';
import { Report } from '@/lib/types';

export default function SwotTab({ report }: { report: Report }) {
  const quad = (cls: string, emoji: string, label: string, arr: string[] | undefined, bulletChar: string, bulletColor: string) => {
    return (
      <div className={`swot-hm-q ${cls}`}>
        <div className="swot-hm-header"><span className="swot-hm-icon">{emoji}</span>{label}</div>
        <div className="swot-hm-items">
          {(arr || []).map((item, idx) => (
            <div key={idx} className="swot-hm-item">
              <span className="swot-hm-bullet" style={{ color: bulletColor, fontWeight: 'bold', fontSize: '14px' }}>{bulletChar}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const W = 320, H = 220, P = 40;
  const iW = W - P * 2, iH = H - P * 2;
  const allItems = [
    ...(report.strengths || []).map((s, i) => ({ label: s, x: 70 + i * 10, y: 75 - i * 8, color: '#1a6b4a' })),
    ...(report.weaknesses || []).map((s, i) => ({ label: s, x: 30 + i * 8, y: 35 + i * 5, color: '#d97706' })),
    ...(report.opportunities || []).map((s, i) => ({ label: s, x: 75 + i * 8, y: 30 + i * 6, color: '#2a5fa5' })),
    ...(report.threats || []).map((s, i) => ({ label: s, x: 28 + i * 7, y: 68 + i * 7, color: '#be123c' }))
  ];

  const dots = allItems.map((item, idx) => {
    const x = P + (item.x / 100) * iW;
    const y = P + iH - (item.y / 100) * iH;
    return (
      <circle key={idx} cx={x} cy={y} r="5" fill={item.color} opacity=".8" stroke="#fff" strokeWidth="1.5">
        <title>{item.label}</title>
      </circle>
    );
  });

  return (
    <div className="tab-panel">
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>
          Impact / Likelihood Matrix
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
          <rect x={P} y={P} width={iW / 2} height={iH / 2} fill="rgba(190,18,60,.06)" />
          <rect x={P + iW / 2} y={P} width={iW / 2} height={iH / 2} fill="rgba(42,95,165,.06)" />
          <rect x={P} y={P + iH / 2} width={iW / 2} height={iH / 2} fill="rgba(217,119,6,.06)" />
          <rect x={P + iW / 2} y={P + iH / 2} width={iW / 2} height={iH / 2} fill="rgba(26,107,74,.06)" />
          <line x1={P} y1={P + iH / 2} x2={P + iW} y2={P + iH / 2} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
          <line x1={P + iW / 2} y1={P} x2={P + iW / 2} y2={P + iH} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
          <rect x={P} y={P} width={iW} height={iH} fill="none" stroke="var(--border)" strokeWidth="1" />
          {dots}
          <text x={P + iW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600">Impact →</text>
          <text x="12" y={P + iH / 2} textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="600" transform={`rotate(-90,12,${P + iH / 2})`}>Likelihood →</text>
          <text x={P + 4} y={P + 14} fontSize="9" fill="#be123c" fontWeight="700">THREATS</text>
          <text x={P + iW - 4} y={P + 14} textAnchor="end" fontSize="9" fill="#2a5fa5" fontWeight="700">OPPORTUNITIES</text>
          <text x={P + 4} y={P + iH - 6} fontSize="9" fill="#d97706" fontWeight="700">WEAKNESSES</text>
          <text x={P + iW - 4} y={P + iH - 6} textAnchor="end" fontSize="9" fill="#1a6b4a" fontWeight="700">STRENGTHS</text>
        </svg>
      </div>
      <div className="swot-heatmap">
        {quad('swot-hm-s', '💪', 'Strengths', report.strengths, '✓', 'var(--acc2)')}
        {quad('swot-hm-w', '⚠️', 'Weaknesses', report.weaknesses, '⚠', '#be123c')}
        {quad('swot-hm-o', '🚀', 'Growth Opportunities', report.opportunities, '→', 'var(--acc3)')}
        {quad('swot-hm-t', '🚨', 'Market Threats', report.threats, '✖', '#be123c')}
      </div>
    </div>
  );
}
