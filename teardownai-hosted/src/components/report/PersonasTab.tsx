import React from 'react';
import { Report, Persona } from '@/lib/types';

export default function PersonasTab({ report }: { report: Report }) {
  const renderCard = (p: Persona | undefined | null, cls: string, bg: string, fg: string, emoji: string) => {
    if (!p) return null;
    const goals = (p.goals || []).map((g: string, i: number) => <span key={i} className="ptag ptag-goal">{g}</span>);
    const pains = (p.pains || []).map((pain: string, i: number) => <span key={i} className="ptag ptag-pain">{pain}</span>);
    const triggers = (p.triggers || []).map((t: string, i: number) => <span key={i} className="ptag ptag-trigger">{t}</span>);

    return (
      <div className={`persona-card ${cls}`}>
        <div className="persona-avatar" style={{ background: bg, color: fg }}>{emoji}</div>
        <div className="persona-name">{p.name || 'User'}</div>
        <div className="persona-role">{p.role || ''} · {p.age || ''}</div>
        <div className="persona-section"><div className="persona-section-label">Goals</div><div className="persona-tags">{goals}</div></div>
        <div className="persona-section"><div className="persona-section-label">Pain points</div><div className="persona-tags">{pains}</div></div>
        <div className="persona-section"><div className="persona-section-label">Triggers</div><div className="persona-tags">{triggers}</div></div>
      </div>
    );
  };

  return (
    <div className="tab-panel">
      <div className="personas-grid">
        {renderCard(report.persona_primary, 'persona-p', '#fef3ed', '#7a2800', '👨')}
        {renderCard(report.persona_secondary, 'persona-s', '#edf7f2', '#0d3d28', '👩')}
      </div>
    </div>
  );
}
