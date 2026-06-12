import React from 'react';
import { Report } from '@/lib/types';

export default function RiceTab({ report, animate }: { report: Report; animate: boolean }) {
  const items = report.rice || (report.features || []).slice(0, 5).map((f, i) => ({ feature: f, reach: 9 - i, impact: i < 2 ? 3 : 2, confidence: 90 - i * 5, effort: i < 2 ? 2 : 3 }));
  const scored = items.map(r => ({ ...r, score: Math.round((r.reach * r.impact * (r.confidence / 100)) / r.effort * 10) })).sort((a, b) => b.score - a.score);
  const maxScore = scored[0]?.score || 1;
  const colors = ['#1a6b4a', '#2a5fa5', '#7c3aed', '#6366f1', 'var(--muted)'];

  return (
    <div className="tab-panel">
      <div style={{ fontSize: '13px', color: 'var(--acc3-t)', marginBottom: '14px', padding: '10px 14px', background: 'var(--acc3-bg)', border: '1px solid rgba(42,95,165,0.15)', borderRadius: '8px' }}>
        <strong style={{ color: 'var(--acc3-t)' }}>RICE Formula:</strong> (Reach × Impact × Confidence%) ÷ Effort &nbsp;—&nbsp; Higher score = build first
      </div>
      <div className="rice-visual">
        {scored.map((r, i) => {
          const pct = Math.round((r.score / maxScore) * 100);
          const isTop = i === 0;
          return (
            <div key={i} className={`rice-vis-row ${isTop ? 'top-rice' : ''}`}>
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: animate ? `${pct}%` : '0%', background: colors[i], opacity: .07, borderRadius: '10px', transition: 'width 0.9s ease' }}></div>
              <div className="rice-vis-header">
                <div>
                  <div className="rice-vis-name">{isTop ? '⭐ ' : ''}{r.feature}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Reach {r.reach} · Impact {r.impact} · Conf. {r.confidence}% · Effort {r.effort}
                  </div>
                </div>
                <div>
                  <div className="rice-vis-score" style={{ color: colors[i] }}>{r.score}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'right' }}>RICE score</div>
                </div>
              </div>
              <div className="rice-vis-bars">
                {[
                  { label: 'Reach', val: r.reach, max: 10 },
                  { label: 'Impact', val: r.impact, max: 3 },
                  { label: 'Confidence', val: r.confidence, max: 100 },
                  { label: 'Effort', val: r.effort, max: 5, bg: 'var(--border)' }
                ].map((dim, idx) => {
                  const fillPct = Math.round((dim.val / dim.max) * 100);
                  return (
                    <div key={idx} className="rice-dim">
                      <div className="rice-dim-label">{dim.label}</div>
                      <div className="rice-dim-track">
                        <div className="rice-dim-fill" style={{ width: animate ? `${fillPct}%` : '0%', background: dim.bg || colors[i], transition: 'width 0.8s ease' }}></div>
                      </div>
                      <div className="rice-dim-val">
                        {dim.label === 'Confidence' ? `${dim.val}%` : `${dim.val}/${dim.max}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
