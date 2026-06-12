import React from 'react';
import { Report } from '@/lib/types';

export default function PrdTab({ report }: { report: Report }) {
  const p = report.prd || {
    feature: (report.features || ['Top feature'])[0],
    objective: 'Improve core user experience and drive measurable engagement.',
    user_story: 'As a product user, I want this feature so that I can achieve my goal faster.',
    acceptance_criteria: ['Works on all devices', 'Loads in under 2 seconds', 'Accessible to all users', 'Analytics tracked'],
    success_metrics: ['10% increase in DAU', '5% churn reduction', 'NPS +8'],
    open_questions: ['What is the rollout plan?', 'How do we define success at 30 days?']
  };

  const story = p.user_story || '';
  const asA = story.match(/As a ([^,]+)/i)?.[1] || 'user';
  const iWant = story.match(/I want (.+?) so that/i)?.[1] || story;
  const soThat = story.match(/so that (.+)/i)?.[1] || 'achieve their goal';

  return (
    <div className="tab-panel">
      <div className="prd-visual">
        <div className="prd-hero">
          <div className="prd-hero-kicker">Feature Specification</div>
          <div className="prd-hero-title">{p.feature}</div>
          <div className="prd-hero-desc">{p.objective}</div>
        </div>
        <div className="prd-vis-block">
          <div className="prd-vis-label">User Story</div>
          <div className="prd-story-parts">
            <div className="prd-story-part">
              <span className="prd-story-tag" style={{ background: 'var(--bg3)', color: 'var(--muted)' }}>AS A</span>
              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{asA}</span>
            </div>
            <div className="prd-story-part">
              <span className="prd-story-tag" style={{ background: 'var(--acc2-bg)', color: 'var(--acc2-t)' }}>I WANT</span>
              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{iWant}</span>
            </div>
            <div className="prd-story-part">
              <span className="prd-story-tag" style={{ background: 'var(--acc3-bg)', color: 'var(--acc3-t)' }}>SO THAT</span>
              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>{soThat}</span>
            </div>
          </div>
        </div>
        <div className="prd-two-col">
          <div className="prd-vis-block">
            <div className="prd-vis-label">Acceptance Criteria</div>
            {(p.acceptance_criteria || []).map((ac: string, idx: number) => (
              <div key={idx} className="prd-ac-item">
                <div className="prd-check">✓</div>
                <span>{ac}</span>
              </div>
            ))}
          </div>
          <div className="prd-vis-block">
            <div className="prd-vis-label">Success Metrics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {(p.success_metrics || []).map((sm: string, idx: number) => (
                <span key={idx} className="pill" style={{ background: 'var(--acc2-bg)', color: 'var(--acc2-t)', borderColor: '#b6deca' }}>
                  {sm}
                </span>
              ))}
            </div>
            <div className="prd-vis-label" style={{ marginTop: '16px' }}>Open Questions</div>
            {(p.open_questions || []).map((oq: string, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--acc3-bg)', border: '1px solid #b6d0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--acc3)', flexShrink: 0 }}>
                  Q{idx + 1}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>{oq}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
