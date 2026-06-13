'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Star,
  Users,
  History,
  Download,
  CreditCard,
  Settings,
  Plus,
  Trash2,
  Share2,
  Search,
  ExternalLink,
  ChevronRight,
  Send,
  UserCheck,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Report, TeamMember } from '@/lib/types';

interface UserState {
  name: string;
  email: string;
  plan: string;
  credits: number;
  maxCreds: number;
  team: TeamMember[];
}

export default function PortalPage() {
  const router = useRouter();

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Token and Session States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [razorpayKey, setRazorpayKey] = useState<string>('');

  // Mobile navigation
  const [isMobNavOpen, setIsMobNavOpen] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  // Settings inputs
  const [setFieldUsername, setSetFieldUsername] = useState('');
  const [setFieldEmail, setSetFieldEmail] = useState('');
  const [isNotifOn, setIsNotifOn] = useState(true);

  // Team input
  const [inviteEmail, setInviteEmail] = useState('');

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: string }[]>([]);

  // Load session
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

    bootstrapPortal();

    // Initial View parameter check
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view');
    if (initialView) {
      setActiveView(initialView);
    }
  }, []);

  const showToast = (msg: string, type: string = 'ok') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
  };

  // Bootstrap session and query reports list
  const bootstrapPortal = async () => {
    try {
      const res = await fetch('/api/session');
      if (!res.ok) {
        setToken(null);
        showToast('Please sign in to access the portal.', 'warn');
        setTimeout(() => {
          router.push('/?auth=true');
        }, 1000);
        return;
      }

      setToken('session');
      const sessionData = await res.json();
      setRazorpayKey(sessionData.razorpayKey || '');
      setUser({
        name: sessionData.name,
        email: sessionData.email,
        plan: sessionData.plan || 'Free',
        credits: sessionData.credits !== undefined ? sessionData.credits : 10,
        maxCreds: sessionData.maxCreds || 10,
        team: sessionData.team || []
      });
      setSetFieldUsername(sessionData.name);
      setSetFieldEmail(sessionData.email);

      // Query reports
      const reportsRes = await fetch('/api/reports');
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }
    } catch (err) {
      showToast('Error during connection.', 'warn');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    setToken(null);
    setUser(null);
    showToast('Logged out successfully!', 'ok');
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  // Reports sorting logic
  const getSortedReports = () => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = reports.filter(r => r.name.toLowerCase().includes(query));
    
    if (sortBy === 'score') {
      return [...filtered].sort((a, b) => b.score - a.score);
    } else if (sortBy === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      return [...filtered].sort((a, b) => b.ts - a.ts);
    }
  };

  // Toggle report bookmark save state
  const toggleSaveReport = async (reportItem: Report) => {
    if (!token) return;
    const updated = { ...reportItem, saved: !reportItem.saved };
    
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        showToast(updated.saved ? 'Report saved!' : 'Report unsaved', 'ok');
        setReports(prev => prev.map(r => r.id === reportItem.id ? updated : r));
      }
    } catch (err) {
      showToast('Error saving changes.', 'warn');
    }
  };

  // Delete report entry
  const handleDeleteReport = async (reportItem: Report) => {
    if (!token || !reportItem.id) return;
    
    try {
      const res = await fetch(`/api/reports/${reportItem.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Report deleted', 'ok');
        setReports(prev => prev.filter(r => r.id !== reportItem.id));
      }
    } catch (err) {
      showToast('Error deleting report.', 'warn');
    }
  };

  // Team Invite API
  const handleInviteMember = async () => {
    if (!token) return;
    const email = inviteEmail.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email.', 'warn');
      return;
    }

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invitation failed.', 'warn');
        return;
      }

      setUser(prev => prev ? { ...prev, team: data.team } : null);
      setInviteEmail('');
      showToast('Teammate invited successfully!', 'ok');
    } catch (err) {
      showToast('Error sending invitation.', 'warn');
    }
  };

  // Team Remove Member API
  const handleRemoveTeamMember = async (memberEmail: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/team/${encodeURIComponent(memberEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, team: data.team } : null);
        showToast('Team member removed', 'ok');
      }
    } catch (err) {
      showToast('Error removing team member.', 'warn');
    }
  };

  // Upgrade payments (Razorpay checkout integration with simulation fallback)
  const handleBuyPlan = async (planName: string) => {
    if (!token) {
      showToast('Sign in to upgrade.', 'warn');
      return;
    }

    const normalizedPlan = planName.toLowerCase();
    if (normalizedPlan === 'free') {
      verifyPaymentOnServer('order_free_downgrade', 'pay_free_downgrade', 'sig_mock_signature', 'free');
      return;
    }

    // Real Razorpay modal open if script is loaded and key is configured
    if (typeof window !== 'undefined' && (window as any).Razorpay && razorpayKey) {
      const amount = planName === 'pro' ? 149900 : 19900; // in paise
      const description = planName === 'pro' ? 'Pro Subscription — Unlimited credits' : 'Student Subscription — 15 credits';

      const options = {
        key: razorpayKey,
        amount: amount,
        currency: 'INR',
        name: 'TeardownAI',
        description: description,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#d4520a' },
        handler: async function (response: any) {
          const paymentId = response.razorpay_payment_id;
          const orderId = response.razorpay_order_id || 'order_' + Math.random().toString(36).substring(2, 10);
          const signature = response.razorpay_signature || 'sig_mock_signature';

          verifyPaymentOnServer(orderId, paymentId, signature, planName);
        },
        modal: {
          ondismiss: () => showToast('Payment cancelled', ''),
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay modal error:', err);
        showToast('Failed to open payment gateway.', 'warn');
      }
    } else {
      // Simulation Fallback
      showToast('Initiating checkout (Razorpay simulated)...', 'ok');
      setTimeout(async () => {
        const razorpay_order_id = 'order_' + Math.random().toString(36).substring(2, 10);
        const razorpay_payment_id = 'pay_' + Math.random().toString(36).substring(2, 10);
        const razorpay_signature = 'sig_mock_signature';

        verifyPaymentOnServer(razorpay_order_id, razorpay_payment_id, razorpay_signature, planName);
      }, 1500);
    }
  };

  const verifyPaymentOnServer = async (orderId: string, paymentId: string, signature: string, planName: string) => {
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          plan: planName
        })
      });
      const data = await res.json();
      if (data.verified) {
        setUser(prev => prev ? { ...prev, plan: data.plan, credits: data.credits, maxCreds: data.maxCreds } : null);
        showToast(`Upgraded to ${data.plan} successfully!`, 'ok');
      } else {
        showToast('Payment verification failed.', 'warn');
      }
    } catch (err) {
      showToast('Payment verification failed.', 'warn');
    }
  };

  // Settings save handler (persisted on server)
  const handleSaveSetting = async (key: 'name' | 'email') => {
    if (!token) return;
    const payload = key === 'name' ? { name: setFieldUsername } : { email: setFieldEmail };
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, name: data.name, email: data.email } : null);
        showToast(key === 'name' ? 'Name saved!' : 'Email updated!', 'ok');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save settings.', 'warn');
      }
    } catch (err) {
      showToast('Error saving settings.', 'warn');
    }
  };

  // Clear session history (persisted on server)
  const handleClearHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/reports', {
        method: 'DELETE'
      });
      if (res.ok) {
        setReports([]);
        showToast('History cleared', 'ok');
      } else {
        showToast('Failed to clear history on server.', 'warn');
      }
    } catch (err) {
      showToast('Error clearing history.', 'warn');
    }
  };

  // Delete user account permanently
  const handleDeleteAccount = async () => {
    if (!token) return;
    if (!window.confirm('Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch('/api/session', {
        method: 'DELETE'
      });
      if (res.ok) {
        setToken(null);
        setUser(null);
        showToast('Account deleted successfully.', 'ok');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        showToast('Failed to delete account.', 'warn');
      }
    } catch (err) {
      showToast('Error deleting account.', 'warn');
    }
  };

  // Nav menu actions
  const menuOptions = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { key: 'reports', label: 'My reports', icon: <FileText size={16} /> },
    { key: 'saved', label: 'Saved', icon: <Star size={16} /> },
    { key: 'team', label: 'Team', icon: <Users size={16} />, devOnly: true },
    { key: 'history', label: 'History', icon: <History size={16} /> },
    { key: 'exports', label: 'Exports', icon: <Download size={16} /> },
    { key: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={16} /> }
  ];

  // Filter menu choices (only developer or Pro plan sees team option)
  const isDeveloper = user?.plan === 'Pro' || user?.email?.toLowerCase().includes('developer');
  const visibleMenu = menuOptions.filter(opt => !opt.devOnly || isDeveloper);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'var(--acc2)';
    if (s >= 60) return 'var(--acc3)';
    return '#be123c';
  };

  return (
    <>
      {/* Toast Alert overlay */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav>
        <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-mark" style={{ background: 'none', border: '1.5px solid var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0 }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35 }}>
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="6" strokeDasharray="10 6" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="6" strokeDasharray="10 6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="8 8" />
            </svg>
            <span style={{ fontFamily: 'var(--fh)', fontWeight: 800, fontSize: '15px', color: 'var(--ink)', position: 'relative', zIndex: 1 }}>T</span>
          </div>
          TeardownAI
        </div>
        <div className="nav-links">
          <a href="/#features">Features</a>
          <a href="/#how">How it works</a>
          <a href="/#pricing">Pricing</a>
          <a href="/portal" className="active" style={{ color: 'var(--ink)', fontWeight: 700 }}>Portal</a>
        </div>
        <div className="nav-right">
          <button id="theme-toggle-btn" className="ti-btn" style={{ padding: '6px', borderRadius: '8px', marginRight: '8px', cursor: 'pointer', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="btn-nav" onClick={handleLogout}>Log Out</button>
          <button className={`hamburger ${isMobNavOpen ? 'open' : ''}`} id="ham" aria-label="Menu" onClick={() => setIsMobNavOpen(!isMobNavOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className={`mob-nav ${isMobNavOpen ? 'open' : ''}`} id="mob-nav">
        <a href="/#features" className="mob-link" onClick={() => setIsMobNavOpen(false)}>Features</a>
        <a href="/#how" className="mob-link" onClick={() => setIsMobNavOpen(false)}>How it works</a>
        <a href="/#pricing" className="mob-link" onClick={() => setIsMobNavOpen(false)}>Pricing</a>
        <div className="mob-divider"></div>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', padding: '0 14px' }} id="mob-views-container">
          {visibleMenu.map(opt => (
            <button key={opt.key} className={`mob-pill ${activeView === opt.key ? 'on' : ''}`} onClick={() => { setActiveView(opt.key); setIsMobNavOpen(false); }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mob-divider"></div>
        <button className="mob-cta" onClick={handleLogout}>Log Out</button>
      </div>

      {/* Portal Header */}
      <div className="section" id="portal" style={{ paddingBottom: '1.5rem', marginTop: '2rem' }}>
        <div className="kicker">Client portal</div>
        <div className="sec-title">Your all-in-one workspace</div>
        <div className="sec-sub">Manage teardowns, track history, collaborate with your team, and monitor usage.</div>
      </div>

      {/* Portal Main Body Grid */}
      <div className="portal-wrap">
        <div className="portal-shell">
          {/* Top Tabs (Mobile / Tablet nav choices) */}
          <div className="p-topbar" id="p-topbar">
            {visibleMenu.map(opt => (
              <div key={opt.key} className={`p-tab ${activeView === opt.key ? 'on' : ''}`} onClick={() => setActiveView(opt.key)}>
                {opt.label}
              </div>
            ))}
          </div>

          <div className="p-body">
            {/* Sidebar navigation */}
            <div className="p-sidebar" id="p-sidebar">
              <div className="p-nav-lbl">Menu</div>
              {visibleMenu.map(opt => (
                <div key={opt.key} className={`p-nav ${activeView === opt.key ? 'on' : ''}`} onClick={() => setActiveView(opt.key)}>
                  <span className="ico" style={{ marginRight: '8px' }}>{opt.icon}</span> {opt.label}
                </div>
              ))}

              {/* Sidebar User Info */}
              <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }} id="sidebar-user-box">
                {user ? (
                  <>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ color: 'var(--dim)', fontSize: '10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</div>
                    {user.plan !== 'Pro' ? (
                      user.credits <= 2 && user.credits > 0 ? (
                        <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(229, 9, 20, 0.08)', border: '1px solid rgba(229, 9, 20, 0.2)', borderRadius: '6px', color: '#e50914', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={10} /> Low Credits: {user.credits} left
                        </div>
                      ) : user.credits === 0 ? (
                        <div style={{ marginTop: '4px', padding: '4px 8px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.3)', borderRadius: '6px', color: '#e50914', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={10} /> 0 Credits left. Upgrade needed
                        </div>
                      ) : (
                        <div style={{ color: 'var(--dim)', fontSize: '10px', marginTop: '2px' }}>Credits remaining: <strong>{user.credits}</strong></div>
                      )
                    ) : (
                      <div style={{ color: 'var(--acc2)', fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>Plan: Pro (Unlimited)</div>
                    )}
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--acc)', fontSize: '11px', cursor: 'pointer', textAlign: 'left', fontWeight: 600, padding: 0, marginTop: '6px' }}>Log Out</button>
                  </>
                ) : (
                  <>
                    <div style={{ color: 'var(--muted)', fontWeight: 500 }}>Running as Guest</div>
                    <button className="r-btn r-btn-p" style={{ padding: '4px 8px', fontSize: '11px', width: '100%', justifyContent: 'center', marginTop: '6px' }} onClick={() => router.push('/?auth=true')}>Log In / Sign Up</button>
                  </>
                )}
              </div>
            </div>

            {/* Main view container panel */}
            <div className="p-main" id="p-main">
              {activeView === 'dashboard' && (
                <DashboardView
                  user={user}
                  reports={reports}
                  router={router}
                  getScoreColor={getScoreColor}
                  toggleSaveReport={toggleSaveReport}
                  handleDeleteReport={handleDeleteReport}
                />
              )}
              {activeView === 'reports' && (
                <ReportsView
                  reports={reports}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  getSortedReports={getSortedReports}
                  getScoreColor={getScoreColor}
                  toggleSaveReport={toggleSaveReport}
                  handleDeleteReport={handleDeleteReport}
                  router={router}
                />
              )}
              {activeView === 'saved' && (
                <SavedView
                  reports={reports}
                  getScoreColor={getScoreColor}
                  toggleSaveReport={toggleSaveReport}
                  handleDeleteReport={handleDeleteReport}
                  router={router}
                />
              )}
              {activeView === 'team' && isDeveloper && (
                <TeamView
                  user={user}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  handleInviteMember={handleInviteMember}
                  handleRemoveTeamMember={handleRemoveTeamMember}
                  showToast={showToast}
                />
              )}
              {activeView === 'history' && (
                <HistoryView
                  reports={reports}
                  getScoreColor={getScoreColor}
                  toggleSaveReport={toggleSaveReport}
                  handleDeleteReport={handleDeleteReport}
                  router={router}
                />
              )}
              {activeView === 'exports' && (
                <ExportsView
                  reports={reports}
                  router={router}
                  exportPDF={showToast}
                />
              )}
              {activeView === 'billing' && (
                <BillingView
                  user={user}
                  handleBuyPlan={handleBuyPlan}
                  router={router}
                />
              )}
              {activeView === 'settings' && (
                <SettingsView
                  user={user}
                  setFieldUsername={setFieldUsername}
                  setSetFieldUsername={setSetFieldUsername}
                  setFieldEmail={setFieldEmail}
                  setSetFieldEmail={setSetFieldEmail}
                  isNotifOn={isNotifOn}
                  setIsNotifOn={setIsNotifOn}
                  reportsLength={reports.length}
                  handleClearHistory={handleClearHistory}
                  handleSaveSetting={handleSaveSetting}
                  handleDeleteAccount={handleDeleteAccount}
                  showToast={showToast}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>&copy; 2025 TeardownAI. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/" onClick={() => router.push('/')}>Home</a>
          <a href="/#pricing">Pricing</a>
        </div>
      </footer>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// SUB-VIEWS SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

function DashboardView({
  user,
  reports,
  router,
  getScoreColor,
  toggleSaveReport,
  handleDeleteReport
}: {
  user: UserState | null;
  reports: Report[];
  router: any;
  getScoreColor: (s: number) => string;
  toggleSaveReport: (r: Report) => void;
  handleDeleteReport: (r: Report) => void;
}) {
  const total = reports.length;
  const w = Date.now() - 7 * 24 * 3600 * 1000;
  const week = reports.filter(r => r.ts > w).length;
  const saved = reports.filter(r => r.saved).length;
  const credits = user ? user.credits : 10;
  const maxCreds = user ? user.maxCreds : 10;
  const pct = maxCreds > 0 ? Math.round(((maxCreds - credits) / maxCreds) * 100) : 0;
  const today = reports.filter(r => r.ts > Date.now() - 86400000).length;

  // Portfolio Diagnostics
  let topStrength = 'N/A';
  let weakestArea = 'N/A';
  let suggestedFocus = 'Generate a teardown report to unlock strategic diagnostics';

  const validReports = reports.filter(r => r.score_ux !== undefined);
  if (validReports.length > 0) {
    const avgUX = validReports.reduce((sum, r) => sum + r.score_ux, 0) / validReports.length;
    const avgMarket = validReports.reduce((sum, r) => sum + r.score_market, 0) / validReports.length;
    const avgMoat = validReports.reduce((sum, r) => sum + (r.score_moat !== undefined ? r.score_moat : r.score), 0) / validReports.length;
    const avgGrowth = validReports.reduce((sum, r) => sum + (r.score_growth !== undefined ? r.score_growth : r.score), 0) / validReports.length;
    const avgRev = validReports.reduce((sum, r) => sum + (r.score_revenue !== undefined ? r.score_revenue : r.score), 0) / validReports.length;
    const avgRet = validReports.reduce((sum, r) => sum + (r.score_retention !== undefined ? r.score_retention : r.score), 0) / validReports.length;

    const dims = [
      { name: 'UX', val: avgUX, focus: 'Optimize key friction points in onboarding flow' },
      { name: 'Market', val: avgMarket, focus: 'Expand target personas and address new segments' },
      { name: 'Moat', val: avgMoat, focus: 'Strengthen core product defensibility and IP Moats' },
      { name: 'Growth', val: avgGrowth, focus: 'Improve onboarding activation loops' },
      { name: 'Revenue', val: avgRev, focus: 'Experiment with upsell triggers and packaging' },
      { name: 'Retention', val: avgRet, focus: 'Invest in habit-forming core retention hooks' }
    ];

    dims.sort((a, b) => b.val - a.val);
    topStrength = `${dims[0].name} (${Math.round(dims[0].val)}/100)`;
    weakestArea = `${dims[5].name} (${Math.round(dims[5].val)}/100)`;
    suggestedFocus = dims[5].focus;
  }

  // Activity Sparklines
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const lbl = d.toLocaleDateString('en', { weekday: 'short' });
    const cnt = reports.filter(h => new Date(h.ts).toDateString() === d.toDateString()).length;
    return { lbl, cnt };
  });
  const maxDay = Math.max(...days.map(d => d.cnt), 1);

  // SVG Chart 1: PM Score Trend (Bar Chart for recent 5 reports)
  const trendReports = reports.slice(0, 5).reverse();
  const W = 360, H = 140, PL = 36, PB = 26, PT = 14, PR = 10;
  const iW = W - PL - PR, iH = H - PB - PT;
  const barW = trendReports.length ? Math.round(iW / trendReports.length) - 16 : 0;
  const scX = (i: number) => PL + i * Math.round(iW / (trendReports.length || 1)) + 8;
  const scY = (v: number) => PT + iH - (v / 100) * iH;

  // SVG Chart 2: Portfolio Strength Radar
  const cx = 110, cy = 90, rMax = 56;
  let radarPoints = '';
  let radarSpokes: React.ReactNode[] = [];
  if (validReports.length > 0) {
    const ux = Math.round(validReports.reduce((sum, r) => sum + r.score_ux, 0) / validReports.length);
    const market = Math.round(validReports.reduce((sum, r) => sum + r.score_market, 0) / validReports.length);
    const moat = Math.round(validReports.reduce((sum, r) => sum + r.score_moat, 0) / validReports.length);
    const growth = Math.round(validReports.reduce((sum, r) => sum + r.score_growth, 0) / validReports.length);
    const revenue = Math.round(validReports.reduce((sum, r) => sum + r.score_revenue, 0) / validReports.length);
    const retention = Math.round(validReports.reduce((sum, r) => sum + r.score_retention, 0) / validReports.length);

    const dims = [
      { name: 'UX', val: ux, angle: 0 },
      { name: 'Market', val: market, angle: 60 },
      { name: 'Moat', val: moat, angle: 120 },
      { name: 'Growth', val: growth, angle: 180 },
      { name: 'Revenue', val: revenue, angle: 240 },
      { name: 'Retention', val: retention, angle: 300 }
    ];

    const getPolyD = (rVal: number) => dims.map(d => {
      const rad = (d.angle - 90) * Math.PI / 180;
      return `${cx + rVal * Math.cos(rad)},${cy + rVal * Math.sin(rad)}`;
    }).join(' ');

    radarPoints = dims.map(d => {
      const rad = (d.angle - 90) * Math.PI / 180;
      const dist = (d.val / 100) * rMax;
      return `${cx + dist * Math.cos(rad)},${cy + dist * Math.sin(rad)}`;
    }).join(' ');

    radarSpokes = dims.map((d, idx) => {
      const rad = (d.angle - 90) * Math.PI / 180;
      const x = cx + rMax * Math.cos(rad);
      const y = cy + rMax * Math.sin(rad);
      const lx = cx + (rMax + 10) * Math.cos(rad);
      const ly = cy + (rMax + 6) * Math.sin(rad);
      const anchor = Math.abs(d.angle - 180) < 10 || d.angle === 0 ? 'middle' : (d.angle > 180 ? 'end' : 'start');

      return (
        <g key={idx}>
          <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />
          <text x={lx} y={ly} textAnchor={anchor} fontSize="7" fontWeight="600" fill="var(--muted)">{d.name} ({d.val})</text>
        </g>
      );
    });
  }

  return (
    <>
      <div className="p-title">Dashboard</div>
      <div className="metrics" style={{ marginBottom: '14px' }}>
        <div className="m-card">
          <div className="m-num">{total}</div>
          <div className="m-lbl">Total teardowns</div>
          <div style={{ fontSize: '10px', color: 'var(--acc2)', marginTop: '4px', fontWeight: 600 }}>+{today} today</div>
        </div>
        <div className="m-card">
          <div className="m-num">{week}</div>
          <div className="m-lbl">This week</div>
          <div style={{ fontSize: '10px', color: 'var(--acc3)', marginTop: '4px', fontWeight: 600 }}>{reports.length} in session</div>
        </div>
        <div className="m-card">
          <div className="m-num">{saved}</div>
          <div className="m-lbl">Saved</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Star to save</div>
        </div>
        <div className="m-card">
          <div className="m-num">{credits}</div>
          <div className="m-lbl">Credits left</div>
          {user && user.plan !== 'Pro' ? (
            <div style={{ marginTop: '6px', height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${100 - pct}%`, background: 'var(--acc)', borderRadius: '2px' }}></div>
            </div>
          ) : (
            <div style={{ fontSize: '10px', color: 'var(--acc2)', fontWeight: 600, marginTop: '4px' }}>Unlimited Pro</div>
          )}
        </div>
      </div>

      {/* Portfolio Diagnostics Box */}
      <div style={{ background: 'linear-gradient(135deg, var(--acc3-bg), var(--bg2))', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--acc3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
          <Activity size={14} /> Portfolio Strategic Diagnostics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dash-charts-grid">
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'rgba(26, 107, 74, 0.06)', borderRadius: '8px', border: '1px solid rgba(26, 107, 74, 0.15)', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Top Strength</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--acc2)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>💪 {topStrength}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'rgba(190, 18, 60, 0.06)', borderRadius: '8px', border: '1px solid rgba(190, 18, 60, 0.15)', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>Weakest Area</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#be123c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>⚠️ {weakestArea}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Suggested Focus</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', lineHeight: '1.45' }}>{suggestedFocus}</div>
          </div>
        </div>
      </div>

      {/* SVG Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }} className="dash-charts-grid">
        {/* Chart 1: PM Score Trend */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px' }}>PM Score Trend</div>
          {trendReports.length > 0 ? (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
              <line x1={PL} y1={scY(0)} x2={PL + iW} y2={scY(0)} stroke="var(--border2)" strokeWidth="1" />
              <line x1={PL} y1={PT} x2={PL} y2={scY(0)} stroke="var(--border2)" strokeWidth="1" />
              <line x1={PL} y1={scY(50)} x2={PL + iW} y2={scY(50)} stroke="var(--border)" strokeWidth="1" strokeDasharray="2" />
              <text x={PL - 6} y={scY(0) + 3} textAnchor="end" fontSize="8" fill="var(--dim)">0</text>
              <text x={PL - 6} y={scY(50) + 3} textAnchor="end" fontSize="8" fill="var(--dim)">50</text>
              <text x={PL - 6} y={scY(100) + 3} textAnchor="end" fontSize="8" fill="var(--dim)">100</text>
              {trendReports.map((r, i) => {
                const x = scX(i);
                const y = scY(r.score);
                const hVal = Math.max(scY(0) - y, 2);
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barW} height={hVal} fill="var(--acc)" rx="3" />
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)">{r.score}</text>
                    <text x={x + barW / 2} y={H - 12} textAnchor="middle" fontSize="8" fill="var(--dim)">{r.name.slice(0, 8)}</text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: '12px' }}>
              Generate teardowns to view trends
            </div>
          )}
        </div>

        {/* Chart 2: Portfolio Strength Radar */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '8px', alignSelf: 'flex-start' }}>Portfolio Strength Focus</div>
          {validReports.length > 0 ? (
            <svg viewBox="0 0 220 180" style={{ width: '100%', maxWidth: '220px', height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
              {/* grid polygon rings */}
              <polygon points="110,34 158.496,62 158.496,118 110,146 61.504,118 61.504,62" fill="none" stroke="var(--border2)" strokeWidth="1" />
              <polygon points="110,52.48 142.007,70.96 142.007,107.92 110,126.4 77.992,107.92 77.992,70.96" fill="none" stroke="var(--border)" strokeDasharray="2" strokeWidth="1" />
              <polygon points="110,70.96 125.518,79.92 125.518,97.84 110,106.8 94.481,97.84 94.481,79.92" fill="none" stroke="var(--border)" strokeDasharray="2" strokeWidth="1" />
              <polygon points={radarPoints} fill="rgba(212,82,10,.15)" stroke="var(--acc)" strokeWidth="1.5" />
              {radarSpokes}
            </svg>
          ) : (
            <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: '12px' }}>
              Generate teardowns to map averages
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Activity Sparklines */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '12px' }}>7-Day Activity</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '52px' }}>
          {days.map((d, i) => {
            const hVal = Math.max(Math.round((d.cnt / maxDay) * 40), 2);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                <div style={{ width: '100%', background: d.cnt > 0 ? 'var(--acc)' : 'var(--bg3)', borderRadius: '3px 3px 0 0', height: `${hVal}px`, transition: 'height 0.3s ease' }}></div>
                <span style={{ fontSize: '10px', color: 'var(--dim)' }}>{d.lbl}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Teardowns List */}
      <div className="p-title" style={{ marginBottom: '10px' }}>Recent teardowns</div>
      <div className="tlist">
        {reports.length > 0 ? (
          reports.slice(0, 5).map((r) => (
            <ReportItemRow
              key={r.id}
              report={r}
              reports={reports}
              getScoreColor={getScoreColor}
              toggleSaveReport={toggleSaveReport}
              handleDeleteReport={handleDeleteReport}
              router={router}
            />
          ))
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
            No teardowns yet. Run your first analysis!
          </div>
        )}
      </div>
      <button className="new-btn" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> New teardown
      </button>
    </>
  );
}

function ReportsView({
  reports,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  getSortedReports,
  getScoreColor,
  toggleSaveReport,
  handleDeleteReport,
  router
}: {
  reports: Report[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  getSortedReports: () => Report[];
  getScoreColor: (s: number) => string;
  toggleSaveReport: (r: Report) => void;
  handleDeleteReport: (r: Report) => void;
  router: any;
}) {
  const sorted = getSortedReports();
  return (
    <>
      <div className="p-title">All Reports <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--muted)' }}>({reports.length})</span></div>
      <div className="p-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input
          className="inp"
          placeholder="Search…"
          style={{ maxWidth: '200px', padding: '8px 12px', fontSize: '13px' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Search reports"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--ink)', outline: 'none', cursor: 'pointer' }}
        >
          <option value="date">Newest first</option>
          <option value="score">Highest score</option>
          <option value="name">A–Z</option>
        </select>
      </div>
      <div className="tlist" id="report-list">
        {sorted.length > 0 ? (
          sorted.map((r) => (
            <ReportItemRow
              key={r.id}
              report={r}
              reports={reports}
              getScoreColor={getScoreColor}
              toggleSaveReport={toggleSaveReport}
              handleDeleteReport={handleDeleteReport}
              router={router}
            />
          ))
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No reports found.</div>
        )}
      </div>
    </>
  );
}

function SavedView({
  reports,
  getScoreColor,
  toggleSaveReport,
  handleDeleteReport,
  router
}: {
  reports: Report[];
  getScoreColor: (s: number) => string;
  toggleSaveReport: (r: Report) => void;
  handleDeleteReport: (r: Report) => void;
  router: any;
}) {
  const savedItems = reports.filter(r => r.saved);
  return (
    <>
      <div className="p-title">Saved <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--muted)' }}>({savedItems.length})</span></div>
      <div className="tlist">
        {savedItems.length > 0 ? (
          savedItems.map((r) => (
            <ReportItemRow
              key={r.id}
              report={r}
              reports={reports}
              getScoreColor={getScoreColor}
              toggleSaveReport={toggleSaveReport}
              handleDeleteReport={handleDeleteReport}
              router={router}
            />
          ))
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⭐</div>
            <div>No saved reports yet.</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Click the star on any teardown item list.</div>
          </div>
        )}
      </div>
      <button className="new-btn" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> New teardown
      </button>
    </>
  );
}

function TeamView({
  user,
  inviteEmail,
  setInviteEmail,
  handleInviteMember,
  handleRemoveTeamMember,
  showToast
}: {
  user: UserState | null;
  inviteEmail: string;
  setInviteEmail: (e: string) => void;
  handleInviteMember: () => void;
  handleRemoveTeamMember: (e: string) => void;
  showToast: (m: string) => void;
}) {
  const members = user?.team || [];
  return (
    <>
      <div className="p-title">Team <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--muted)' }}>({members.length})</span></div>
      <div className="tlist" style={{ marginBottom: '12px' }}>
        {members.map((m, idx) => {
          const isYou = idx === 0;
          return (
            <div key={m.email || idx} className="ti">
              <div className="ti-l">
                <div className={`ti-icon ${m.col}`} style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.initials}
                </div>
                <div className="ti-info">
                  <div className="ti-name">{m.name}{isYou ? ' (You)' : ''}</div>
                  <div className="ti-date">{m.email || m.name} · {m.tears} teardowns · {m.lastActive}</div>
                </div>
              </div>
              <div className="ti-r">
                {isYou ? (
                  <span className="badge">Admin</span>
                ) : (
                  <div className="ti-btns" style={{ display: 'flex', gap: '4px' }}>
                    <button className="ti-btn" onClick={() => showToast(`Invite resent to ${m.name.split(' ')[0]}`)}>
                      <Send size={13} />
                    </button>
                    <button className="ti-btn" style={{ color: '#be123c' }} onClick={() => handleRemoveTeamMember(m.email || m.name)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>Invite member</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            className="inp"
            placeholder="colleague@company.com"
            style={{ flex: 1, minWidth: '160px', padding: '8px 12px', fontSize: '13px' }}
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            aria-label="Email address to invite"
          />
          <button className="r-btn r-btn-p" onClick={handleInviteMember}>Send invite</button>
        </div>
      </div>
    </>
  );
}

function HistoryView({
  reports,
  getScoreColor,
  toggleSaveReport,
  handleDeleteReport,
  router
}: {
  reports: Report[];
  getScoreColor: (s: number) => string;
  toggleSaveReport: (r: Report) => void;
  handleDeleteReport: (r: Report) => void;
  router: any;
}) {
  const all = [...reports].sort((a, b) => b.ts - a.ts);
  const groups: Record<string, Report[]> = {};
  all.forEach(h => {
    const lbl = new Date(h.ts).toDateString() === new Date().toDateString() ? 'Today' :
      new Date(h.ts).toDateString() === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : h.date;
    if (!groups[lbl]) groups[lbl] = [];
    groups[lbl].push(h);
  });

  return (
    <>
      <div className="p-title">Activity History</div>
      {Object.entries(groups).length > 0 ? (
        Object.entries(groups).map(([lbl, items], idx) => (
          <div key={idx} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', padding: '8px 0 6px' }}>
              {lbl}
            </div>
            <div className="tlist">
              {items.map((r) => (
                <ReportItemRow
                  key={r.id}
                  report={r}
                  reports={reports}
                  getScoreColor={getScoreColor}
                  toggleSaveReport={toggleSaveReport}
                  handleDeleteReport={handleDeleteReport}
                  router={router}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No activity yet.</div>
      )}
    </>
  );
}

function ExportsView({ reports, router, exportPDF }: { reports: Report[]; router: any; exportPDF: (m: string) => void }) {
  const cols = ['ic-o', 'ic-g', 'ic-b'];
  return (
    <>
      <div className="p-title">Exports</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>Click download to open a print-ready report → Save as PDF.</div>
      <div className="tlist">
        {reports.length > 0 ? (
          reports.slice(0, 5).map((h, i) => {
            const init = (h.name || '?').charAt(0).toUpperCase();
            return (
              <div key={h.id} className="ti">
                <div className="ti-l">
                  <div className={`ti-icon ${cols[i % 3]}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {h.domain ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://www.google.com/s2/favicons?domain=${h.domain}&sz=32`} style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px' }} alt={h.name} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{init}</span>
                    )}
                  </div>
                  <div className="ti-info">
                    <div className="ti-name">{h.name}_Teardown.html</div>
                    <div className="ti-date">{h.date} · ~260 KB</div>
                  </div>
                </div>
                <div className="ti-r">
                  <div className="ti-btns" style={{ display: 'flex', gap: '4px' }}>
                    <button className="ti-btn" onClick={() => router.push(`/?q=${encodeURIComponent(h.name)}`)}>
                      <ExternalLink size={13} />
                    </button>
                    <button className="ti-btn" onClick={() => {
                      exportPDF('Generating PDF...');
                      setTimeout(() => { window.print(); }, 800);
                    }}>
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>No exports yet.</div>
        )}
      </div>
      <button className="new-btn" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Plus size={14} /> New teardown
      </button>
    </>
  );
}

function BillingView({ user, handleBuyPlan, router }: { user: UserState | null; handleBuyPlan: (p: string) => void; router: any }) {
  const credits = user ? user.credits : 10;
  const maxCreds = user ? user.maxCreds : 10;
  const used = maxCreds - credits;
  const pct = maxCreds > 0 ? Math.round((used / maxCreds) * 100) : 0;

  const planPrice = user?.plan === 'Pro' ? '₹1,499/mo' : (user?.plan === 'Student' ? '₹199/mo' : 'Free');
  const planRenew = user?.plan !== 'Free' ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';

  return (
    <>
      <div className="p-title">Billing &amp; Plan</div>
      <div style={{ background: 'var(--acc3-bg)', border: '1px solid rgba(42,95,165,0.15)', borderRadius: '10px', padding: '16px 18px', marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '4px' }}>Current plan</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--acc3)', marginBottom: '2px' }}>{user?.plan || 'Free'} — {planPrice}</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Renews {planRenew} · {credits} credits left</div>
      </div>
      
      <div className="metrics" style={{ marginBottom: '14px' }}>
        <div className="m-card">
          <div className="m-num">{used}</div>
          <div className="m-lbl">Used</div>
          <div style={{ marginTop: '6px', height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--acc3)', borderRadius: '2px' }}></div>
          </div>
        </div>
        <div className="m-card"><div className="m-num">{credits}</div><div className="m-lbl">Remaining</div></div>
        <div className="m-card"><div className="m-num">{maxCreds}</div><div className="m-lbl">Monthly quota</div></div>
        <div className="m-card">
          <div className="m-num" style={{ fontSize: '15px' }}>Visa<br /><span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>•••• 4242</span></div>
          <div className="m-lbl">Payment</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="r-btn r-btn-p" onClick={() => handleBuyPlan(user?.plan === 'Pro' ? 'student' : 'pro')}>
          {user?.plan === 'Pro' ? 'Downgrade to Student' : 'Upgrade to Pro'}
        </button>
        <button className="r-btn" onClick={() => router.push('/#pricing')}>Upgrade details</button>
      </div>
    </>
  );
}

function SettingsView({
  user,
  setFieldUsername,
  setSetFieldUsername,
  setFieldEmail,
  setSetFieldEmail,
  isNotifOn,
  setIsNotifOn,
  reportsLength,
  handleClearHistory,
  handleSaveSetting,
  handleDeleteAccount,
  showToast
}: {
  user: UserState | null;
  setFieldUsername: string;
  setSetFieldUsername: (v: string) => void;
  setFieldEmail: string;
  setSetFieldEmail: (v: string) => void;
  isNotifOn: boolean;
  setIsNotifOn: (v: boolean) => void;
  reportsLength: number;
  handleClearHistory: () => void;
  handleSaveSetting: (k: 'name' | 'email') => void;
  handleDeleteAccount: () => void;
  showToast: (m: string) => void;
}) {
  return (
    <>
      <div className="p-title">Account Settings</div>
      <div className="tlist" style={{ gap: '14px' }}>
        <div className="ti" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Display name</div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            <input className="inp" style={{ flex: 1, minWidth: '140px', padding: '8px 12px', fontSize: '13px' }} value={setFieldUsername} onChange={e => setSetFieldUsername(e.target.value)} aria-label="Display name" />
            <button className="r-btn r-btn-p" onClick={() => handleSaveSetting('name')}>Save</button>
          </div>
        </div>
        
        <div className="ti" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', padding: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Email address</div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="inp" style={{ flex: 1, minWidth: '140px', padding: '8px 12px', fontSize: '13px', opacity: 0.7, cursor: 'not-allowed' }} value={setFieldEmail} readOnly disabled aria-label="Email address" />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Email cannot be changed</span>
          </div>
        </div>
        
        <div className="ti">
          <div className="ti-l">
            <div className="ti-info">
              <div className="ti-name">Email notifications</div>
              <div className="ti-date">Notify when teardowns complete</div>
            </div>
          </div>
          <div className="ti-r">
            <button className="ti-btn" onClick={() => { setIsNotifOn(!isNotifOn); showToast(`Notifications ${!isNotifOn ? 'enabled' : 'disabled'}`); }} style={{ width: 'auto', padding: '4px 14px', fontSize: '12px', fontWeight: 600, background: isNotifOn ? 'var(--acc2-bg)' : 'var(--bg2)', color: isNotifOn ? 'var(--acc2-t)' : 'var(--muted)', borderColor: isNotifOn ? '#b6deca' : 'var(--border)' }}>
              {isNotifOn ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="ti">
          <div className="ti-l">
            <div className="ti-info">
              <div className="ti-name">Clear all history</div>
              <div className="ti-date">Remove {reportsLength} teardowns from this session</div>
            </div>
          </div>
          <div className="ti-r">
            <button className="ti-btn" onClick={handleClearHistory} style={{ color: '#b45309', borderColor: '#fde68a' }}>Clear</button>
          </div>
        </div>

        <div className="ti">
          <div className="ti-l">
            <div className="ti-info">
              <div className="ti-name">Delete account</div>
              <div className="ti-date">Permanently remove your data</div>
            </div>
          </div>
          <div className="ti-r">
            <button className="ti-btn" onClick={handleDeleteAccount} style={{ color: '#be123c', borderColor: '#f5c3c3' }}>Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// INDIVIDUAL LIST ITEM ROW
// ────────────────────────────────────────────────────────────────

function ReportItemRow({
  report,
  reports,
  getScoreColor,
  toggleSaveReport,
  handleDeleteReport,
  router
}: {
  report: Report;
  reports: Report[];
  getScoreColor: (s: number) => string;
  toggleSaveReport: (r: Report) => void;
  handleDeleteReport: (r: Report) => void;
  router: any;
}) {
  const initial = (report.name || '?').charAt(0).toUpperCase();

  return (
    <div className="ti">
      <div className="ti-l">
        <div className={`ti-icon ${report.col}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {report.domain ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://www.google.com/s2/favicons?domain=${report.domain}&sz=32`}
              style={{ width: '20px', height: '20px', objectFit: 'contain', borderRadius: '4px' }}
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              alt={report.name}
            />
          ) : (
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{initial}</span>
          )}
        </div>
        <div className="ti-info">
          <div className="ti-name">{report.name}</div>
          <div className="ti-date">
            {report.date}
            {report.note && (
              <> · <em style={{ color: 'var(--acc3)' }}>{report.note}</em></>
            )}
          </div>
        </div>
      </div>
      <div className="ti-r">
        <div className="ti-score" style={{ color: getScoreColor(report.score) }}>{report.score}/100</div>
        <div className="ti-btns" style={{ display: 'flex', gap: '4px' }}>
          <button className="ti-btn" title="View" onClick={() => router.push(`/?q=${encodeURIComponent(report.name)}`)}>
            <ExternalLink size={13} />
          </button>
          <button className="ti-btn" title={report.saved ? 'Unsave' : 'Save'} onClick={() => toggleSaveReport(report)}>
            <Star size={13} fill={report.saved ? '#d4a017' : 'none'} color={report.saved ? '#d4a017' : 'currentColor'} />
          </button>
          <button className="ti-btn" title="Delete" onClick={() => handleDeleteReport(report)} style={{ color: '#be123c' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
