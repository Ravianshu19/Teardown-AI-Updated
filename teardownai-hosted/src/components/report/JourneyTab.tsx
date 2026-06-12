import React from 'react';
import { Report } from '@/lib/types';

export default function JourneyTab({ report }: { report: Report }) {
  const steps = report.journey || [
    { stage: 'Discovery', title: 'How users find it', desc: 'Users discover via referral, SEO, or ads.', actions: ['See referral', 'Visit landing page'] },
    { stage: 'Onboarding', title: 'First-run experience', desc: 'Guided setup and initial value delivery.', actions: ['Create account', 'Complete walkthrough'] },
    { stage: 'Activation', title: 'The aha moment', desc: 'User completes first meaningful action.', actions: ['Core action', 'See result'] },
    { stage: 'Retention', title: 'Core habit loop', desc: 'Regular return driven by habit triggers.', actions: ['Return visit', 'Use core feature'] },
    { stage: 'Referral', title: 'Viral moment', desc: 'Satisfied users share with peers.', actions: ['Invite friend', 'Share output'] }
  ];
  const colors = ['#2a5fa5', '#3b82f6', '#10b981', '#1a6b4a', '#6366f1'];
  const funnelPcts = [100, 72, 55, 38, 24];

  return (
    <div className="tab-panel">
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '14px' }}>
          Conversion Funnel
        </div>
        <div className="funnel-wrap">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="funnel-step">
                <span className="funnel-label" style={{ color: colors[i] }}>{s.stage}</span>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width: `${funnelPcts[i]}%`, background: colors[i], height: '28px', opacity: .85, minWidth: '32px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', padding: '0 10px' }}>{funnelPcts[i]}%</span>
                  </div>
                </div>
                <span className="funnel-val">{funnelPcts[i]}%</span>
              </div>
              {i < steps.length - 1 && <div className="funnel-arrow">🔽</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '12px' }}>
        Detailed Journey
      </div>
      <div className="journey-visual">
        {steps.map((s, i) => (
          <div key={i} className="jv-step">
            <div className="jv-left">
              <div className="jv-circle" style={{ background: colors[i] }}>{i + 1}</div>
              {i < steps.length - 1 && (
                <div className="jv-line" style={{ background: `linear-gradient(to bottom, ${colors[i]}, ${colors[i + 1]})` }}></div>
              )}
            </div>
            <div className="jv-card" style={{ borderLeft: `3px solid ${colors[i]}` }}>
              <div className="jv-stage" style={{ color: colors[i] }}>{s.stage}</div>
              <div className="jv-title">{s.title}</div>
              <div className="jv-desc">{s.desc}</div>
              <div className="jv-actions">
                {(s.actions || []).map((act: string, aIdx: number) => (
                  <span key={aIdx} className="jv-tag">{act}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
