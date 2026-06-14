'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Plus,
  Trash2,
  Share2,
  FileDown,
  Activity,
  CheckCircle2,
  TrendingUp,
  Star,
  Zap,
  ArrowRight,
  LogOut,
  ChevronRight,
  BookOpen,
  Users,
  AlertCircle
} from 'lucide-react';
import { PRODUCT_DB } from '@/lib/products';
import { Report, Competitor, TeamMember, Persona } from '@/lib/types';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import OverviewTab from '@/components/report/OverviewTab';
import PersonasTab from '@/components/report/PersonasTab';
import SwotTab from '@/components/report/SwotTab';
import CompetitorsTab from '@/components/report/CompetitorsTab';
import JourneyTab from '@/components/report/JourneyTab';
import MetricsTab from '@/components/report/MetricsTab';
import RiceTab from '@/components/report/RiceTab';
import PrdTab from '@/components/report/PrdTab';

interface UserState {
  name: string;
  email: string;
  plan: string;
  credits: number;
  maxCreds: number;
  team: TeamMember[];
}

export default function LandingPage() {
  const router = useRouter();

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Auth States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // User Session State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  const [history, setHistory] = useState<Report[]>([]);

  // Mobile Navigation State
  const [isMobNavOpen, setIsMobNavOpen] = useState(false);

  // Search Analyzer States
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressSteps, setProgressSteps] = useState([
    { text: 'Scanning website & metadata...', status: 'idle' },
    { text: 'Reading customer reviews & discussions...', status: 'idle' },
    { text: 'Building user personas & journey maps...', status: 'idle' },
    { text: 'Mapping competitor space & features...', status: 'idle' },
    { text: 'Generating SWOT & RICE matrices...', status: 'idle' },
    { text: 'Assembling full PM report...', status: 'idle' }
  ]);

  // Report Rendering States
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<string>('Overview');
  const [reportNotes, setReportNotes] = useState('');
  const [showNotesGlow, setShowNotesGlow] = useState(false);
  const [scoreExplainer, setScoreExplainer] = useState<{ key: string; title: string; desc: string } | null>(null);
  const [animateBars, setAnimateBars] = useState(false);

  // Pricing States
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: string }[]>([]);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const analyzerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const [stats, setStats] = useState({ teardowns: '14,000+', users: '5,400+' });



  // Sync theme to body
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
  };

  // Toast Helper
  const showToast = useCallback((msg: string, type: string = 'ok') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);



  // Fetch Reports list
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    }
  }, []);

  // Authentication Submission
  const handleAuthSubmit = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault();
    const url = type === 'login' ? '/api/login' : '/api/register';
    const payload = type === 'login' 
      ? { email: loginEmail, password: loginPassword }
      : { name: regName, email: regEmail, password: regPassword };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Authentication failed', 'warn');
        return;
      }
      
      setToken('session');
      setUser({
        name: data.name,
        email: data.email,
        plan: data.plan,
        credits: data.credits,
        maxCreds: data.maxCreds,
        team: data.team || []
      });
      showToast(type === 'login' ? 'Logged in successfully!' : 'Account registered successfully!', 'ok');
      setIsAuthModalOpen(false);
      // Fetch latest reports
      fetchReports();
      
      // Redirect to portal only if NOT mid-analysis
      if (!currentReport && !isRunning) {
        setTimeout(() => {
          router.push('/portal');
        }, 500);
      }

    } catch (err: any) {
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
    setHistory([]);
    showToast('Logged out successfully!', 'ok');
  };

  // SPA State resets
  const resetPage = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentReport(null);
    setSearchQuery('');
    setIsRunning(false);
    setProgressPct(0);
    setIsMobNavOpen(false);
  };

  const resetAnalyzer = () => {
    setCurrentReport(null);
    setSearchQuery('');
    setIsRunning(false);
    setProgressPct(0);
    analyzerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus research notes textbox
  const focusNotes = () => {
    setShowNotesGlow(true);
    setTimeout(() => {
      notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notesRef.current?.focus();
    }, 150);
  };

  // Sharing report function
  const shareReport = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.origin + '?q=' + encodeURIComponent(currentReport?.name || '');
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('Link copied!', 'ok'))
        .catch(() => showToast('Failed to copy link.', 'warn'));
    }
  };

  // PDF Export
  const exportPDF = () => {
    showToast('Generating PDF...', 'ok');
    setTimeout(() => {
      window.print();
    }, 800);
  };

  // Resolve target domain for logo loading
  const resolveDomain = (input: string) => {
    let raw = input.toLowerCase().trim();
    raw = raw.replace(/https?:\/\//g, '').replace(/www\./g, '');
    const idx = raw.indexOf('/');
    if (idx !== -1) raw = raw.substring(0, idx);
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
    if (domainRegex.test(raw)) return raw;
    
    // Fallback dictionary for top brands
    const brands: Record<string, string> = {
      notion: 'notion.so', figma: 'figma.com', stripe: 'stripe.com', slack: 'slack.com',
      airbnb: 'airbnb.com', swiggy: 'swiggy.com', zomato: 'zomato.com',
      netflix: 'netflix.com', spotify: 'spotify.com', linear: 'linear.app', razorpay: 'razorpay.com'
    };
    const key = Object.keys(brands).find(k => raw.includes(k));
    return key ? brands[key] : `${raw.replace(/[^a-z0-9]/g, '')}.com`;
  };

  // Analysis engine trigger
  const triggerAnalysis = useCallback(async (
    queryVal: string,
    isLoggedIn: boolean = token !== null,
    overrideUser: any = null
  ) => {
    if (isRunning) return;
    const name = queryVal.trim();
    if (!name) {
      showToast('Enter a product name or URL', 'warn');
      return;
    }

    const activeUser = overrideUser || user;
    // Credits checking
    if (activeUser && activeUser.plan !== 'Pro' && activeUser.credits <= 0) {
      showToast('Out of credits! Please upgrade your plan or log in to continue.', 'warn');
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsRunning(true);
    setProgressPct(0);
    setCurrentReport(null);
    setAnimateBars(false);

    // Initial steps state
    setProgressSteps([
      { text: 'Scanning website & metadata...', status: 'active' },
      { text: 'Reading customer reviews & discussions...', status: 'idle' },
      { text: 'Building user personas & journey maps...', status: 'idle' },
      { text: 'Mapping competitor space & features...', status: 'idle' },
      { text: 'Generating SWOT & RICE matrices...', status: 'idle' },
      { text: 'Assembling full PM report...', status: 'idle' }
    ]);

    const qKey = name.toLowerCase().replace(/https?:\/\/(www\.)?/i, '').replace(/[^a-z0-9]/g, '');
    const curatedKeys = Object.keys(PRODUCT_DB);
    const isCurated = curatedKeys.some(k => qKey === k || qKey.includes(k) || k.includes(qKey));

    // Determine offline / mockup settings
    const hasServerKey = true; // Assume active unless proxy returns error
    const stepDelay = (isCurated || !hasServerKey) ? 100 : 500;

    // Fast progress ticker
    const tickTimeouts: NodeJS.Timeout[] = [];
    const scheduleTick = (idx: number, pct: number) => {
      const t = setTimeout(() => {
        setProgressPct(pct);
        setProgressSteps(prev => {
          const next = [...prev];
          if (next[idx]) next[idx].status = 'done';
          if (next[idx + 1]) next[idx + 1].status = 'active';
          return next;
        });
      }, stepDelay * (idx + 1));
      tickTimeouts.push(t);
    };

    scheduleTick(0, 15);
    scheduleTick(1, 32);
    scheduleTick(2, 52);
    scheduleTick(3, 68);
    scheduleTick(4, 82);
    scheduleTick(5, 95);

    // Finish cleanups
    const finishAnalysis = (reportData: Report, userCredits: number) => {
      tickTimeouts.forEach(clearTimeout);
      setProgressPct(100);
      setProgressSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
      
      setTimeout(() => {
        setIsRunning(false);
        setCurrentReport(reportData);
        setReportNotes(reportData.note || '');
        setActiveReportTab('Overview');
        
        // Trigger bars animation
        setTimeout(() => {
          setAnimateBars(true);
        }, 100);

        if (user && isLoggedIn) {
          setUser(prev => prev ? { ...prev, credits: userCredits } : null);
          fetchReports();
        }
      }, 300);
    };

    // Curated/Offline path
    if (isCurated) {
      setTimeout(async () => {
        const foundKey = curatedKeys.find(k => qKey === k || qKey.includes(k) || k.includes(qKey)) || 'notion';
        const rawItem = PRODUCT_DB[foundKey];
        
        const mockReport: Report = {
          ...rawItem,
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
          ts: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          domain: resolveDomain(rawItem.name),
          col: foundKey === 'notion' ? 'ic-g' : (foundKey === 'stripe' ? 'ic-b' : 'ic-o'),
          saved: false,
          note: ''
        };

        // Post to database to decrement credit and save history
        let savedCredits = activeUser ? activeUser.credits : 10;
        if (isLoggedIn) {
          try {
            const saveRes = await fetch('/api/reports', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(mockReport)
            });
            if (saveRes.ok) {
              const saveData = await saveRes.json();
              savedCredits = saveData.credits !== undefined ? saveData.credits : savedCredits;
            }
          } catch (e) {
            console.error('Error saving curated report:', e);
          }
        }

        if (activeUser && activeUser.plan !== 'Pro' && savedCredits <= 2 && savedCredits > 0) {
          showToast(`${savedCredits} credits left — upgrade for unlimited.`, 'warn');
        }

        finishAnalysis(mockReport, savedCredits);
      }, stepDelay * 7);

    } else {
      // API Generation path
      const payload = {
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Generate a detailed product teardown for the product or URL: "${name}".` }]
      };

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const contentType = res.headers.get('content-type') || '';
        if (!res.ok) {
          let errorMsg = `Server error code ${res.status}`;
          if (contentType.includes('application/json')) {
            const errData = await res.json();
            errorMsg = errData.error || errData.message || errorMsg;
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();
        if (!data.content || !data.content[0] || !data.content[0].text) {
          throw new Error('Malformed Claude API response structure');
        }

        let cleanText = data.content[0].text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        }

        const report = JSON.parse(cleanText);
        
        // Prepare structured report details
        const structuredReport: Report = {
          ...report,
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
          ts: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          domain: resolveDomain(report.name),
          col: ['ic-o', 'ic-g', 'ic-b'][Math.floor(Math.random() * 3)],
          saved: false,
          note: ''
        };

        // Post to database to decrement credit and save history
        let savedCredits = activeUser ? activeUser.credits : 10;
        if (isLoggedIn) {
          const saveRes = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(structuredReport)
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            savedCredits = saveData.credits !== undefined ? saveData.credits : savedCredits;
          }
        }

        if (activeUser && activeUser.plan !== 'Pro' && savedCredits <= 2 && savedCredits > 0) {
          showToast(`${savedCredits} credits left — upgrade for unlimited.`, 'warn');
        }

        finishAnalysis(structuredReport, savedCredits);

      } catch (err: any) {
        console.warn('AI engine generation failed, falling back to local fallback simulation:', err.message);
        showToast(`AI Engine Error: ${err.message} (Running offline fallback)`, 'warn');
        
        // Local simulation fallback
        setTimeout(async () => {
          const mockReport: Report = {
            name: name,
            tagline: `AI generated PM blueprint for ${name}`,
            problem: `Users face core strategic mapping difficulties that ${name} attempts to optimize through intuitive interface layers.`,
            users: `Founders, Product Teams, Project Leaders`,
            value: `Accelerated digital workflows providing real-time team synchronization and architecture blueprints.`,
            revenue: `SaaS Premium - Tiered monthly seat limits`,
            competitors: [
              { name: 'Competitor A', threat: 'high', ux: 75, features: 80, pricing: 60, market: 70 },
              { name: 'Competitor B', threat: 'medium', ux: 68, features: 62, pricing: 75, market: 50 },
              { name: 'Competitor C', threat: 'high', ux: 82, features: 78, pricing: 55, market: 85 },
              { name: 'Competitor D', threat: 'low', ux: 55, features: 50, pricing: 90, market: 35 },
              { name: 'Competitor E', threat: 'medium', ux: 70, features: 68, pricing: 70, market: 55 }
            ],
            score: 76,
            score_ux: 78,
            score_market: 72,
            score_moat: 70,
            score_growth: 74,
            score_revenue: 80,
            score_retention: 82,
            strengths: [`Robust interface speed`, `Highly customizable fields`, `Simple initial setup flow`],
            weaknesses: [`High visual complexity`, `Muted mobile browser capabilities`, `Friction in data migrations`],
            opportunities: [`AI structural assistance templates`, `Direct Jira/Linear sync exports`, `Team multiplayer canvas views`],
            threats: [`Rapid platform copying by incumbents`, `Price erosion from open source variants`, `SaaS budget consolidation trends`],
            persona_primary: {
              name: 'Siddharth M.',
              role: 'Product Lead at High-Growth Startup',
              age: '28-36',
              goals: ['Build specs faster', 'Align stakeholders', 'Maintain roadmap logs'],
              pains: ['Too many spreadsheets', 'Friction in documentation reviews', 'Losing visual scope details'],
              triggers: ['Initiating new feature lifecycle spec', 'Preparing quarterly board review presentations']
            },
            persona_secondary: {
              name: 'Riya K.',
              role: 'Founder & Head of Operations',
              age: '24-32',
              goals: ['Validate market opportunity', 'Prioritize limited dev cycles', 'Minimize scope creep'],
              pains: ['Limited resource buffers', 'Conflicting roadmap arguments', 'Unclear ROI metrics'],
              triggers: ['Allocating dev budget sprints', 'Pre-seeding customer pilot programs']
            },
            journey: [
              { stage: 'Discovery', title: 'Product Hunt & Twitter', desc: 'Discovers startup recommendation posts on tech feeds.', actions: ['Click refer links', 'Browse homepage'] },
              { stage: 'Onboarding', title: 'OAuth & Workspace Setup', desc: 'Sets up workspace in under 3 steps via Google OAuth.', actions: ['Sign in', 'Select initial template'] },
              { stage: 'Activation', title: 'First Board Creation', desc: 'Aha moment: maps first custom data stream visualization.', actions: ['Import spreadsheet', 'Save custom map'] },
              { stage: 'Retention', title: 'Daily Backlog Sprints', desc: 'Integrates board as primary bookmark for morning updates.', actions: ['Log daily ticket', 'Review team progress'] },
              { stage: 'Referral', title: 'Multi-seat Invitation', desc: 'Invites engineering lead to collaborate on current spec.', actions: ['Invite team email', 'Share PDF log'] }
            ],
            metrics: [
              { name: 'North Star', value: 'W1 Active Teams', importance: 92, priority: 'high' },
              { name: 'Board Creation', value: 'First 24 hrs %', importance: 88, priority: 'high' },
              { name: 'Multiplayer Invites', value: 'Avg invites / user', importance: 84, priority: 'high' },
              { name: 'D30 Retention', value: 'Daily active %', importance: 80, priority: 'high' },
              { name: 'CSV Imports', value: 'Data setup count', importance: 74, priority: 'medium' },
              { name: 'Premium Upgrades', value: 'Quota limit trigger %', importance: 70, priority: 'medium' },
              { name: 'Exports Ran', value: 'PDF/Share triggers', importance: 62, priority: 'medium' },
              { name: 'Help Docs Read', value: 'Faq click count', importance: 48, priority: 'low' }
            ],
            rice: [
              { feature: 'Multiplayer Real-time Collaboration', reach: 9, impact: 3, confidence: 90, effort: 3 },
              { feature: 'One-click Jira Sync Integration', reach: 8, impact: 2, confidence: 85, effort: 2 },
              { feature: 'Offline Mobile Editing Mode', reach: 7, impact: 2, confidence: 70, effort: 4 },
              { feature: 'AI Spec Template Drafter', reach: 9, impact: 3, confidence: 80, effort: 2 },
              { feature: 'Custom Theme/Style Editor', reach: 5, impact: 1, confidence: 90, effort: 1 }
            ],
            prd: {
              feature: 'AI Spec Template Drafter',
              objective: 'Reduce functional spec drafting friction to boost onboarding activation cycles.',
              user_story: 'As a startup Product Lead, I want AI assistance during draft writing so that I can align the engineering sprint faster.',
              acceptance_criteria: ['Loads in under 5 seconds', 'Supports custom feature prompt overrides', 'Provides markdown source exports', 'Integrates RICE scoring cells'],
              success_metrics: ['15% boost in draft conversions', '5% churn reduction', 'NPS score +5'],
              open_questions: ['How do we verify token pricing margins?', 'Can users override prompts locally?']
            },
            features: [
              'Visual Multiplayer Board Canvas',
              'AI Spec Drafter Assistant',
              'RICE Scoring Prioritizer',
              'Team Activity Timeline Log',
              'One-click PDF Report exporter'
            ],
            id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
            ts: Date.now(),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            domain: resolveDomain(name),
            col: 'ic-o',
            saved: false,
            note: ''
          };

          let savedCredits = activeUser ? activeUser.credits : 10;
          if (isLoggedIn) {
            try {
              const saveRes = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(mockReport)
              });
              if (saveRes.ok) {
                const saveData = await saveRes.json();
                savedCredits = saveData.credits !== undefined ? saveData.credits : savedCredits;
              }
            } catch (e) {
              console.error('Error saving fallback report:', e);
            }
          }

          if (activeUser && activeUser.plan !== 'Pro' && savedCredits <= 2 && savedCredits > 0) {
            showToast(`${savedCredits} credits left — upgrade for unlimited.`, 'warn');
          }

          finishAnalysis(mockReport, savedCredits);
        }, 800);
      }
    }
  }, [isRunning, user, token, showToast, fetchReports]);

  // Session API Call
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session');
      let sessionUser = null;
      if (res.ok) {
        const data = await res.json();
        sessionUser = {
          name: data.name,
          email: data.email,
          plan: data.plan,
          credits: data.credits,
          maxCreds: data.maxCreds,
          team: data.team || []
        };
        setToken('session');
        setUser(sessionUser);
        fetchReports();
      } else {
        setToken(null);
        setUser(null);
      }

      // Check URL parameters after session fetch completes (regardless of success/fail)
      const params = new URLSearchParams(window.location.search);
      const queryQ = params.get('q');
      if (queryQ) {
        setSearchQuery(queryQ);
        triggerAnalysis(queryQ, res.ok, sessionUser);
      }
    } catch (err) {
      console.error('Session validation error:', err);
    }
  }, [fetchReports, triggerAnalysis]);

  // Load configuration and session
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

    // Check session on mount
    fetchSession();

    // URL Query Routing
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'true') {
      setIsAuthModalOpen(true);
      setAuthTab('login');
    }

    // Dynamic stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.teardowns && data.users) {
          setStats({
            teardowns: data.teardowns.toLocaleString() + '+',
            users: data.users.toLocaleString() + '+'
          });
        }
      })
      .catch(() => {});
  }, [fetchSession]);

  // Curated teaser runner
  const loadSample = (name: string) => {
    setSearchQuery(name);
    triggerAnalysis(name);
  };

  // Toggle notes saved
  const saveNotes = async () => {
    if (!currentReport) return;
    const updatedReport = { ...currentReport, note: reportNotes };
    setCurrentReport(updatedReport);

    if (token) {
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedReport)
        });
        if (res.ok) {
          showToast('Notes saved successfully!', 'ok');
          fetchReports();
        }
      } catch (err) {
        showToast('Error saving notes.', 'warn');
      }
    } else {
      showToast('Notes saved (Guest mode)', 'ok');
    }
  };

  // Score explainer overlay triggers
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'var(--acc2)';
    if (s >= 60) return 'var(--acc3)';
    return '#be123c';
  };

  const getScoreBadgeText = (s: number) => {
    if (s >= 80) return `Strong product (${s}/100)`;
    if (s >= 60) return `Solid foundations (${s}/100)`;
    return `Needs work (${s}/100)`;
  };

  const getScoreBadgeClass = (s: number) => {
    if (s >= 80) return 'r-badge-g';
    if (s >= 60) return 'r-badge-o';
    return 'r-badge-r';
  };

  const toggleScoreExplainer = (key: string) => {
    const explainers: Record<string, { title: string; desc: string }> = {
      ux: { title: 'UX Quality Score', desc: 'Evaluates layouts, onboarding speed, clear typography scales, interaction speeds, and layout shifts.' },
      market: { title: 'Market Fit Score', desc: 'Measures product relevance to the target demographic, audience sizes, and demand trends.' },
      moat: { title: 'Moat Defensibility', desc: 'Analyzes intellectual property strengths, competitive integrations, and high switching costs.' },
      growth: { title: 'Growth & Virality', desc: 'Measures organic invitation loops, network effects, and viral acquisition hooks.' },
      revenue: { title: 'Revenue Viability', desc: 'Measures packaging options, user pricing models, and upsell capabilities.' },
      retention: { title: 'Retention Habits', desc: 'Evaluates habit triggers, user lock-in milestones, and recurring usage drivers.' }
    };
    if (scoreExplainer && scoreExplainer.key === key) {
      setScoreExplainer(null);
    } else if (explainers[key]) {
      setScoreExplainer({ key, ...explainers[key] });
    }
  };

  return (
    <>
      {/* Toast Alert stack */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Navigation header */}
      <nav>
        <div className="logo" onClick={resetPage} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href={token ? "/portal" : "#"} onClick={(e) => {
            if (!token) {
              e.preventDefault();
              setIsAuthModalOpen(true);
              setAuthTab('login');
            }
          }}>Portal</a>
        </div>

        <div className="nav-right">
          <button id="theme-toggle-btn" className="ti-btn" style={{ padding: '6px', borderRadius: '8px', marginRight: '8px', cursor: 'pointer', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? (
              <Sun size={16} style={{ color: 'var(--muted)' }} />
            ) : (
              <Moon size={16} style={{ color: 'var(--muted)' }} />
            )}
          </button>
          
          {token ? (
            <button className="btn-nav" onClick={() => router.push('/portal')}>Dashboard</button>
          ) : (
            <button className="btn-nav" onClick={() => { setIsAuthModalOpen(true); setAuthTab('login'); }}>Sign In</button>
          )}

          <button className={`hamburger ${isMobNavOpen ? 'open' : ''}`} id="ham" aria-label="Menu" onClick={() => setIsMobNavOpen(!isMobNavOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`mob-nav ${isMobNavOpen ? 'open' : ''}`} id="mob-nav">
        <a href="#features" className="mob-link" onClick={() => setIsMobNavOpen(false)}>
          <span className="ico"><BookOpen size={16} /></span> Features
        </a>
        <a href="#how" className="mob-link" onClick={() => setIsMobNavOpen(false)}>
          <span className="ico"><Activity size={16} /></span> How it works
        </a>
        <a href="#pricing" className="mob-link" onClick={() => setIsMobNavOpen(false)}>
          <span className="ico"><TrendingUp size={16} /></span> Pricing
        </a>
        <a href={token ? "/portal" : "#"} className="mob-link" onClick={(e) => {
          setIsMobNavOpen(false);
          if (!token) {
            e.preventDefault();
            setIsAuthModalOpen(true);
            setAuthTab('login');
          }
        }}>
          <span className="ico"><Users size={16} /></span> Portal
        </a>
        
        <div className="mob-divider"></div>
        {token ? (
          <button className="mob-cta" onClick={handleLogout}>Log Out</button>
        ) : (
          <button className="mob-cta" onClick={() => { setIsMobNavOpen(false); setIsAuthModalOpen(true); setAuthTab('register'); }}>Get started free →</button>
        )}
      </div>

      {/* Hero section */}
      <div className="hero-wrapper">
        <div className="hero-spotlight"></div>
        <div className="hero">
          <div className="hero-badge">
            <span className="ico" style={{ fontSize: '12px', marginRight: '6px' }}><Zap size={12} fill="var(--muted)" /></span> Real AI · Real PM insights
          </div>
          <h1>Teardown any product like a Senior PM.</h1>
          <p>Instant AI-powered product SWOT, user personas, and roadmaps in under 30 seconds.</p>
          <div className="hero-btns">
            <button className="btn-ink" onClick={() => analyzerRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="ico" style={{ fontSize: '15px', marginRight: '6px' }}><Activity size={15} /></span> Try Live Demo
            </button>
          </div>

          <div className="hero-stats" style={{ marginTop: '2rem' }}>
            <div className="stat"><span className="stat-n">{stats.teardowns}</span> teardowns generated</div>
            <div className="dot"></div>
            <div className="stat"><span className="stat-n">{stats.users}</span> PMs &amp; founders</div>
            <div className="dot"></div>
            <div className="stat"><span className="stat-n">&lt;30s</span> analysis time</div>
            <div className="dot"></div>
            <div className="stat"><span className="stat-n">Any</span> product or URL</div>
          </div>

          {/* Social Proof */}
          <div style={{ marginTop: '36px', textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>Built on PM frameworks from</div>
            <div style={{ display: 'flex', gap: 'clamp(1.5rem, 6vw, 3.5rem)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.65 }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.2px' }}>Google</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.8px' }}>Meta</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.3px' }}>airbnb</span>
              <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink)', fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.5px', fontStyle: 'italic' }}>stripe</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--fh)', letterSpacing: '-0.2px' }}>Notion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analyzer Body */}
      <div ref={analyzerRef} id="analyzer" style={{ padding: 'clamp(0.5rem,2vw,1rem) clamp(1rem,4vw,2rem) 0', maxWidth: '900px', margin: '0 auto' }}>
        <div className="kicker">Live demo</div>
        <div className="sec-title">Analyze any product right now</div>
        <div className="sec-sub">Paste any product name, company, or URL. Our research engine generates a full PM teardown instantly — no sign-up needed.</div>
      </div>

      <div className="az-wrap">
        <div className="az">
          <div className="az-bar">
            <div className="wbs">
              <div className="wb wb1"></div>
              <div className="wb wb2"></div>
              <div className="wb wb3"></div>
            </div>
            <span>TeardownAI — Product Analysis Engine</span>
          </div>
          <div className="az-body">
            {/* Quick Picks */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px', fontWeight: 600 }}>Quick picks — or type any product / URL below:</div>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }} id="quick-picks">
                {['Notion', 'Stripe', 'Figma', 'Netflix', 'Airbnb', 'Linear', 'Spotify'].map((item, idx) => (
                  <button key={idx} className={`ftag ${idx < 3 ? 'trending-tag' : ''}`} style={{ cursor: 'pointer' }} onClick={() => loadSample(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="az-inputs">
              <input
                className="inp"
                id="pname"
                placeholder="Any product, company, or URL (e.g. Notion, tesla.com, Linear)…"
                autoComplete="off"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && triggerAnalysis(searchQuery)}
                aria-label="Product, company, or URL to analyze"
              />
              <button className="run-btn" id="run-btn" disabled={isRunning} onClick={() => triggerAnalysis(searchQuery)}>
                {isRunning ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin-svg" style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }}>
                      <path d="M12 3a9 9 0 1 0 9 9" />
                    </svg>
                    Researching…
                  </span>
                ) : (
                  <>
                    <span className="ico" style={{ fontSize: '15px', marginRight: '6px' }}><Search size={15} /></span> Generate Teardown
                  </>
                )}
              </button>
            </div>

            {/* Teaser empty state Netflix preview */}
            {!currentReport && !isRunning && (
              <div id="az-empty-state" style={{ marginTop: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div className="empty-tag"><span className="ico" style={{ fontSize: '12px', marginRight: '4px' }}><Zap size={11} fill="var(--acc3)" style={{ color: 'var(--acc3)' }} /></span>💡 Pick a sample below to preview</div>
                </div>
                
                <div className="empty-grid">
                  <div className="empty-card" onClick={() => loadSample('Notion')} title="Click to view sample Notion Personas">
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>👤</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>User Personas</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Analyze user segments, target pain points, goals and discovery hooks.</div>
                  </div>
                  <div className="empty-card" onClick={() => loadSample('Stripe')} title="Click to view sample Stripe SWOT Matrix">
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛡️</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>SWOT Matrix</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Assess competitive positioning, market opportunities, weaknesses and threats.</div>
                  </div>
                  <div className="empty-card" onClick={() => loadSample('Figma')} title="Click to view sample Figma Competitor Map">
                    <div style={{ fontSize: '20px', marginBottom: '8px' }}>📊</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>Competitor Map</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Bubble chart mapping competitor UX fits, feature footprints and pricing.</div>
                  </div>
                </div>

                {/* Premium Netflix teaser card */}
                <div className="netflix-teaser" style={{ marginTop: '24px', background: 'linear-gradient(135deg, var(--bg2), var(--bg3))', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'transform 0.3s ease, border 0.3s ease' }} onClick={() => loadSample('Netflix')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ padding: '4px 8px', background: '#be123c', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>SAMPLE TEASER</span>
                      <strong style={{ color: 'var(--ink)', fontSize: '15px' }}>Netflix product teardown</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--acc2)', fontWeight: 600 }}>92/100 PM Score</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 14px 0', lineHeight: '1.5' }}>Explore the growth loops, RICE feature prioritisation metrics, and structured PRD blueprints that keep Netflix at the top of streaming entertainment.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--dim)' }}>Inspired by streaming market analysis</span>
                    <button className="r-btn r-btn-p" style={{ fontSize: '11px', padding: '4px 10px' }}>⚡ Click to load full interactive report →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Checklist */}
            {isRunning && (
              <div id="az-progress" style={{ marginTop: '20px' }}>
                <div className="prog-track">
                  <div className="prog-fill" id="prog-fill" style={{ width: `${progressPct}%` }}></div>
                </div>
                <div className="chk">
                  {progressSteps.map((step, idx) => (
                    <div key={idx} className="chk-step" id={`chk-step-${idx + 1}`} style={{ color: step.status === 'active' ? 'var(--ink)' : (step.status === 'done' ? 'var(--acc2-t)' : 'var(--muted)'), fontWeight: step.status === 'active' ? '600' : 'normal' }}>
                      <span className="chk-bullet" style={{ color: step.status === 'active' ? 'var(--acc)' : (step.status === 'done' ? 'var(--acc2)' : 'var(--dim)'), marginRight: '6px' }}>
                        {step.status === 'done' ? '✓' : (step.status === 'active' ? '●' : '○')}
                      </span>
                      {step.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Teardown Report container */}
            {currentReport && !isRunning && (
              <div id="az-report" style={{ marginTop: '24px' }}>
                {/* Report Header */}
                <div className="rep-head">
                  <div className="rep-head-left">
                    <div className="rep-head-logo">
                      {currentReport.domain ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${currentReport.domain}&sz=32`}
                          style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          alt={currentReport.name}
                        />
                      ) : (
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{currentReport.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="rep-head-title">{currentReport.name}</div>
                      <div className="rep-head-sub">{currentReport.domain || `${currentReport.name.toLowerCase()}.com`}</div>
                    </div>
                  </div>

                  <div className="rep-head-right">
                    <div className={`r-badge ${getScoreBadgeClass(currentReport.score)}`} id="r-badge">
                      {getScoreBadgeText(currentReport.score)}
                    </div>
                    <div className="rep-head-kicker">Generated {currentReport.date}</div>
                  </div>
                </div>

                {/* Sticky Report Sub-Header Controls */}
                <div className="rep-bar">
                  <div className="rep-bar-title">{currentReport.name} Report</div>
                  <div className="rep-bar-actions">
                    <button className="r-btn" onClick={focusNotes}>✍ Notes</button>
                    <button className="r-btn" onClick={exportPDF}>⬇ PDF</button>
                    <button className="r-btn" onClick={shareReport}>↗ Share</button>
                    <button className="r-btn r-btn-p" onClick={resetAnalyzer}>+ New</button>
                  </div>
                </div>

                {/* Score Grid & Explainers */}
                <div className="score-explainer-row">
                  <div className="score-desc-box">Click any metric below to view criteria description:</div>
                  {scoreExplainer && (
                    <div className="score-exp-panel" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px' }}>
                      <strong style={{ color: 'var(--ink)' }}>{scoreExplainer.title}</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.45' }}>{scoreExplainer.desc}</p>
                    </div>
                  )}
                </div>

                <div className="rep-scores">
                  {[
                    { label: 'UX', val: currentReport.score_ux, key: 'ux' },
                    { label: 'Market', val: currentReport.score_market, key: 'market' },
                    { label: 'Moat', val: currentReport.score_moat, key: 'moat' },
                    { label: 'Growth', val: currentReport.score_growth, key: 'growth' },
                    { label: 'Revenue', val: currentReport.score_revenue, key: 'revenue' },
                    { label: 'Retention', val: currentReport.score_retention, key: 'retention' }
                  ].map((dim) => (
                    <div
                      key={dim.key}
                      className={`sdim ${scoreExplainer?.key === dim.key ? 'sdim-active' : ''}`}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => toggleScoreExplainer(dim.key)}
                    >
                      <span className="sdim-lbl">{dim.label}</span>
                      <span className="sdim-n" style={{ color: getScoreColor(dim.val) }}>{dim.val}</span>
                    </div>
                  ))}
                </div>

                {/* Tab select drop down (Mobile) */}
                <div className="rep-tabs-select-wrap">
                  <select
                    className="rep-tabs-select"
                    value={activeReportTab}
                    onChange={(e) => setActiveReportTab(e.target.value)}
                  >
                    <optgroup label="❶ Core Research">
                      <option value="Overview">Product Overview</option>
                      <option value="Personas">User Personas</option>
                      <option value="SWOT">SWOT Matrix</option>
                    </optgroup>
                    <optgroup label="❷ Competitive & Strategy">
                      <option value="Competitors">Competitor Positioning</option>
                      <option value="Journey">User Journey Map</option>
                    </optgroup>
                    <optgroup label="❸ Execution Outputs">
                      <option value="Metrics">Priority Metrics</option>
                      <option value="RICE">RICE Matrix</option>
                      <option value="PRD">Mini-PRD Spec</option>
                    </optgroup>
                  </select>
                </div>

                {/* Tabs bar navigator (Desktop) */}
                <div className="rep-tabs">
                  <span className="rep-tab-cat">❶ Core Research:</span>
                  {['Overview', 'Personas', 'SWOT'].map(t => (
                    <button key={t} className={`rep-tab ${activeReportTab === t ? 'on' : ''}`} onClick={() => setActiveReportTab(t)}>
                      {t === 'Overview' ? 'Overview' : (t === 'Personas' ? 'Personas' : 'SWOT')}
                    </button>
                  ))}
                  
                  <span className="rep-tab-cat">❷ Strategy:</span>
                  {['Competitors', 'Journey'].map(t => (
                    <button key={t} className={`rep-tab ${activeReportTab === t ? 'on' : ''}`} onClick={() => setActiveReportTab(t)}>
                      {t === 'Competitors' ? 'Competitors' : 'Journey'}
                    </button>
                  ))}
                  
                  <span className="rep-tab-cat">❸ Execution:</span>
                  {['Metrics', 'RICE', 'PRD'].map(t => (
                    <button key={t} className={`rep-tab ${activeReportTab === t ? 'on' : ''}`} onClick={() => setActiveReportTab(t)}>
                      {t === 'Metrics' ? 'Metrics' : (t === 'RICE' ? 'RICE' : 'Mini PRD')}
                    </button>
                  ))}
                </div>

                {/* Reports Tab Content Panels */}
                <div id="report-output">
                  {activeReportTab === 'Overview' && <OverviewTab report={currentReport} />}
                  {activeReportTab === 'Personas' && <PersonasTab report={currentReport} />}
                  {activeReportTab === 'SWOT' && <SwotTab report={currentReport} />}
                  {activeReportTab === 'Competitors' && <CompetitorsTab report={currentReport} animate={animateBars} />}
                  {activeReportTab === 'Journey' && <JourneyTab report={currentReport} />}
                  {activeReportTab === 'Metrics' && <MetricsTab report={currentReport} animate={animateBars} />}
                  {activeReportTab === 'RICE' && <RiceTab report={currentReport} animate={animateBars} />}
                  {activeReportTab === 'PRD' && <PrdTab report={currentReport} />}
                </div>

                {/* Workspace Research Notes card */}
                <div className={`notes-section ${showNotesGlow ? 'notes-section-active' : ''}`} style={{ marginTop: '24px', border: showNotesGlow ? '1.5px solid var(--acc)' : '1.5px solid var(--border)', transition: 'border 0.3s ease, box-shadow 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--ink)' }}>✍ Research Notes & Workspace Comments</strong>
                    <button className="r-btn r-btn-p" style={{ fontSize: '11px', padding: '4px 12px' }} onClick={saveNotes}>Save notes</button>
                  </div>
                  <textarea
                    ref={notesRef}
                    className="inp"
                    style={{ width: '100%', height: '80px', background: 'var(--bg2)', fontSize: '13px', resize: 'vertical', minHeight: '60px' }}
                    placeholder="Type comments, team feedback, or product insights here..."
                    value={reportNotes}
                    onChange={e => setReportNotes(e.target.value)}
                    onBlur={() => setShowNotesGlow(false)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>
                    <span>Saves comments to product teardown history logs.</span>
                    <span style={{ color: 'var(--acc2)' }}>Ready to export</span>
                  </div>
                </div>

                {/* Portal workspace redirect row */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="r-btn" onClick={() => router.push(token ? '/portal?view=reports' : '/?auth=true')}>View in portal</button>
                  <button className="r-btn" onClick={exportPDF}>Export PDF</button>
                  <button className="r-btn r-btn-p" onClick={resetAnalyzer}>+ New teardown</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Checklist Deliverables Section */}
      <div className="section" id="features">
        <div className="kicker">Features</div>
        <div className="sec-title">Deep product teardowns, unpacked module by module</div>
        <div className="sec-sub">Our analysis engine covers the full product strategy lifecycle, providing scannable PM deliverables.</div>

        <div className="feat-grid2" style={{ marginTop: '2rem' }}>
          {[
            { title: 'Product Overview Generator', icon: '📝', items: ['User Segments', 'Core Features', 'Value Proposition'] },
            { title: 'Target User Profiler', icon: '👥', items: ['Core Personas', 'User Goals', 'User Pain Points'] },
            { title: 'SWOT Matrix Architect', icon: '🛡️', items: ['Product Strengths', 'Weaknesses/Risks', 'Growth Opportunities'] },
            { title: 'Competitor Map Visualizer', icon: '📊', items: ['Positioning Graph', 'Threat Level Analysis', 'Feature Comparison'] },
            { title: 'User Journey Mapping', icon: '🗺️', items: ['Discovery funnel', 'Activation milestones', 'Retention loops'] },
            { title: 'Strategic Metrics Planner', icon: '📈', items: ['North Star Metric', 'Priority KPIs', 'Feature Adoption tracking'] },
            { title: 'RICE Prioritization Matrix', icon: '⚖️', items: ['Reach & Impact', 'Confidence rating', 'Dev Effort estimate'] },
            { title: 'Mini-PRD Spec Writer', icon: '📄', items: ['Functional Scope', 'Acceptance Criteria', 'Success KPIs'] },
            { title: 'PDF & Sharing Exports', icon: '📤', items: ['Print-ready layouts', 'Local HTML download', 'Team shared links'] },
            { title: 'Collaborative Workspace', icon: '💻', items: ['Multi-seat workspace', 'Shared report history', 'Team admin panels'] }
          ].map((feat, idx) => (
            <div key={idx} className="fc2 card">
              <div className="fc2-top">
                <div className="fc2-title">{feat.title}</div>
                <span className="fc2-badge" style={{ fontSize: '18px' }}>{feat.icon}</span>
              </div>
              <ul className="fc2-checks">
                {feat.items.map((item, id) => (
                  <li key={id}>
                    <span className="fcheck">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="section" id="how">
        <div className="kicker">How it works</div>
        <div className="sec-title">From input to senior-level product analysis</div>
        <div className="sec-sub">Three automated research steps generate complete product strategies.</div>

        <div className="steps" style={{ marginTop: '2rem' }}>
          <div className="steps-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="step">
              <div className="snum">01</div>
              <h3>Input Product Name or URL</h3>
              <p>Enter any consumer app, SaaS dashboard, or URL. Our scraper instantly extracts site copy and metadata.</p>
            </div>
            <div className="step">
              <div className="snum">02</div>
              <h3>AI Research Scanning</h3>
              <p>Our engine gathers social signals, App Store feedback, and industry benchmarks, feeding Claude with context.</p>
            </div>
            <div className="step">
              <div className="snum">03</div>
              <h3>Strategic Synthesis</h3>
              <p>Claude generates SWOT frameworks, RICE matrices, and user story drafts structured exactly like senior PM blueprints.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="section" id="pricing">
        <div className="kicker">Pricing</div>
        <div className="sec-title">Plans that scale with your research needs</div>
        <div className="sec-sub">Start free to test the engine, then unlock unlimited teardowns and team workspace collaboration.</div>

        <div className="pricing-toggle-wrap">
          <span className={`tog-lbl ${billingPeriod === 'monthly' ? 'on' : ''}`} id="tog-monthly">Billed Monthly</span>
          <button className={`p-toggle ${billingPeriod === 'annual' ? 'annual' : ''}`} id="billing-toggle" onClick={() => setBillingPeriod(p => p === 'monthly' ? 'annual' : 'monthly')}></button>
          <span className={`tog-lbl ${billingPeriod === 'annual' ? 'on' : ''}`} id="tog-annual">Billed Annually <span className="discount">Save 30%</span></span>
        </div>

        <div className="price-grid" style={{ marginTop: '2rem' }}>
          {/* Free / Guest Plan */}
          <div className="pc card" id="plan-starter">
            <div className="p-tier">Starter</div>
            <div className="p-amt">₹0<sub>/month</sub></div>
            <div className="p-desc">Test-drive the engine with basic PM modules.</div>
            <ul className="p-feats">
              <li><span className="ti-check">✓</span> 10 teardowns total</li>
              <li><span className="ti-check">✓</span> Core research overview</li>
              <li><span className="ti-check">✓</span> SWOT frameworks</li>
              <li><span className="ti-check">✓</span> Export HTML reports</li>
            </ul>
            <button className="p-btn" onClick={() => {
              if (token) {
                router.push('/portal');
              } else {
                setIsAuthModalOpen(true);
                setAuthTab('register');
              }
            }}>Get Started Free</button>
          </div>

          {/* Student Plan */}
          <div className="pc card" id="plan-student">
            <div className="p-tier">Student</div>
            <div className="p-amt">
              {billingPeriod === 'monthly' ? '₹199' : '₹139'}
              <sub>/month</sub>
            </div>
            <div className="p-desc">For APMs and students mapping visual cases.</div>
            <ul className="p-feats">
              <li><span className="ti-check">✓</span> 15 teardowns/month</li>
              <li><span className="ti-check">✓</span> All 8 report views</li>
              <li><span className="ti-check">✓</span> Export print-ready PDFs</li>
              <li><span className="ti-check">✓</span> RICE prioritisation matrices</li>
            </ul>
            <button className="p-btn" onClick={() => {
              if (token) {
                router.push('/portal?view=billing');
              } else {
                setIsAuthModalOpen(true);
                setAuthTab('login');
              }
            }}>Upgrade to Student</button>
          </div>

          {/* Pro Plan */}
          <div className="pc card pop" id="plan-pro">
            <span className="pop-chip">MOST POPULAR</span>
            <div className="p-tier">Pro</div>
            <div className="p-amt">
              {billingPeriod === 'monthly' ? '₹1,499' : '₹1,049'}
              <sub>/month</sub>
            </div>
            <div className="p-desc">Unlimited generation, custom scraping and team features.</div>
            <ul className="p-feats">
              <li><span className="ti-check">✓</span> Unlimited teardown runs</li>
              <li><span className="ti-check">✓</span> Advanced web scraping integrations</li>
              <li><span className="ti-check">✓</span> Custom prompt override parameters</li>
              <li><span className="ti-check">✓</span> Add up to 3 team members</li>
            </ul>
            <button className="p-btn fill" onClick={() => {
              if (token) {
                router.push('/portal?view=billing');
              } else {
                setIsAuthModalOpen(true);
                setAuthTab('login');
              }
            }}>Upgrade to Pro</button>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="section" id="faq">
        <div className="kicker">FAQ</div>
        <div className="sec-title">Common questions answered</div>
        <div className="sec-sub">Everything you need to know about our analysis engine and security details.</div>

        <div className="faq-grid" style={{ marginTop: '2rem', maxWidth: '800px', margin: '2rem auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { q: 'How does the AI research engine analyze products?', a: 'Our engine performs structured web searches, parses company landing page metadata, reviews tech specifications, and reads public forum feedbacks (like Reddit and G2). It feeds this context to Claude 3.5 Sonnet to map strategic user journeys and prioritize feature requirements.' },
            { q: 'Are these frameworks industry-standard?', a: 'Yes! All templates (SWOT, user journey funnel, RICE matrix prioritization, and product requirements specs) follow standard strategic playbooks deployed inside major product operations teams globally.' },
            { q: 'Can I invite other team members?', a: 'Yes! Pro plan workspaces allow team invite links, letting team leads invite up to 3 members to read history logs, make reviews, and add notes comments.' }
          ].map((faq, idx) => (
            <FaqItem key={idx} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>&copy; 2025 TeardownAI. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#features" onClick={resetPage}>Home</a>
          <a href="#pricing">Pricing</a>
          <a href="/portal">Portal</a>
        </div>
      </footer>

      {/* Auth modal overlay */}
      {isAuthModalOpen && (
        <div className="modal-backdrop" id="auth-modal" onClick={(e) => e.target === e.currentTarget && setIsAuthModalOpen(false)}>
          <div className="auth-card">
            <div className="auth-tabs">
              <button className={`auth-tab-btn ${authTab === 'login' ? 'on' : ''}`} onClick={() => setAuthTab('login')}>Login</button>
              <button className={`auth-tab-btn ${authTab === 'register' ? 'on' : ''}`} onClick={() => setAuthTab('register')}>Register</button>
              <button className="auth-close" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            </div>

            {authTab === 'login' ? (
              <form id="login-form" onSubmit={(e) => handleAuthSubmit(e, 'login')}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="auth-lbl" htmlFor="login-email">Email Address</label>
                  <input className="inp" id="login-email" type="email" placeholder="you@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoComplete="username" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="auth-lbl" style={{ marginBottom: 0 }} htmlFor="login-password">Password</label>
                    <a href="#" onClick={(e) => { e.preventDefault(); showToast('Please contact support to reset your password.', 'warn'); }} style={{ fontSize: '11px', color: 'var(--acc)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
                  </div>
                  <input className="inp" id="login-password" type="password" placeholder="••••••••" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <button className="auth-submit-btn" type="submit">Log In</button>
              </form>
            ) : (
              <form id="register-form" onSubmit={(e) => handleAuthSubmit(e, 'register')}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="auth-lbl" htmlFor="reg-name">Full Name</label>
                  <input className="inp" id="reg-name" type="text" placeholder="John Doe" required value={regName} onChange={e => setRegName(e.target.value)} autoComplete="name" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="auth-lbl" htmlFor="reg-email">Email Address</label>
                  <input className="inp" id="reg-email" type="email" placeholder="you@example.com" required value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="auth-lbl" htmlFor="reg-password">Password</label>
                  <input className="inp" id="reg-password" type="password" placeholder="Min. 8 characters" required minLength={8} value={regPassword} onChange={e => setRegPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <button className="auth-submit-btn" type="submit">Create Account</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}



// ────────────────────────────────────────────────────────────────
// FAQ SUB-COMPONENT
// ────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg2)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '16px 20px', background: 'none', border: 'none', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', outline: 'none' }}
      >
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{q}</span>
        <ChevronRight size={18} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: 'var(--muted)' }} />
      </button>
      {isOpen && (
        <div style={{ padding: '0 20px 16px 20px', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6' }}>
          {a}
        </div>
      )}
    </div>
  );
}
