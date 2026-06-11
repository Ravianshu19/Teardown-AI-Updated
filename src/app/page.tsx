'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface Competitor {
  name: string;
  threat: string;
  ux: number;
  features: number;
  pricing: number;
  market: number;
}

interface Report {
  id?: string;
  name: string;
  tagline?: string;
  problem?: string;
  users?: string;
  value?: string;
  revenue?: string;
  competitors?: Competitor[];
  score: number;
  score_ux: number;
  score_market: number;
  score_moat: number;
  score_growth: number;
  score_revenue: number;
  score_retention: number;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  persona_primary?: any;
  persona_secondary?: any;
  journey?: any[];
  metrics?: any[];
  rice?: any[];
  prd?: any;
  features?: string[];
  date: string;
  ts: number;
  domain?: string;
  col: string;
  saved: boolean;
  note: string;
}

interface UserState {
  name: string;
  email: string;
  plan: string;
  credits: number;
  maxCreds: number;
  team: any[];
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

  // Load configuration and session
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

    // Token
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchSession(savedToken);
    }

    // URL Query Routing
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'true') {
      setIsAuthModalOpen(true);
      setAuthTab('login');
    }
    const queryQ = params.get('q');
    if (queryQ) {
      setSearchQuery(queryQ);
      // Auto run analysis after brief delay to allow page loads
      setTimeout(() => {
        triggerAnalysis(queryQ, savedToken);
      }, 500);
    }
  }, []);

  // Sync theme to body
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.classList.toggle('dark-theme', nextTheme === 'dark');
  };

  // Toast Helper
  const showToast = (msg: string, type: string = 'ok') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Session API Call
  const fetchSession = async (authToken: string) => {
    try {
      const res = await fetch('/api/session', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser({
          name: data.name,
          email: data.email,
          plan: data.plan,
          credits: data.credits,
          maxCreds: data.maxCreds,
          team: data.team || []
        });
        fetchReports(authToken);
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Session validation error:', err);
    }
  };

  // Fetch Reports list
  const fetchReports = async (authToken: string) => {
    try {
      const res = await fetch('/api/reports', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.reports || []);
      }
    } catch (err) {
      console.error('Fetch reports error:', err);
    }
  };

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
      
      localStorage.setItem('auth_token', data.token);
      setToken(data.token);
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
      fetchReports(data.token);
      
      // Redirect to portal
      setTimeout(() => {
        router.push('/portal');
      }, 500);

    } catch (err: any) {
      showToast('Error during connection.', 'warn');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
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
  const triggerAnalysis = async (queryVal: string, activeAuthToken: string | null = token) => {
    if (isRunning) return;
    const name = queryVal.trim();
    if (!name) {
      showToast('Enter a product name or URL', 'warn');
      return;
    }

    // Credits checking
    if (user && user.plan !== 'Pro' && user.credits <= 0) {
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

        if (user && activeAuthToken) {
          setUser(prev => prev ? { ...prev, credits: userCredits } : null);
          fetchReports(activeAuthToken);
        }
      }, 300);
    };

    // Curated/Offline path
    if (isCurated) {
      setTimeout(() => {
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

        // Simulated credit deduct
        let nextCredits = user ? user.credits : 10;
        if (user && user.plan !== 'Pro' && nextCredits > 0) {
          nextCredits--;
        }

        // If credits left goes to exactly 2, alert user
        if (user && user.plan !== 'Pro' && nextCredits <= 2 && nextCredits > 0) {
          showToast(`${nextCredits} credits left — upgrade for unlimited.`, 'warn');
        }

        finishAnalysis(mockReport, nextCredits);
      }, stepDelay * 7);

    } else {
      // API Generation path
      const systemPrompt = `You are a Senior Product Manager. Your task is to perform a detailed product teardown for the requested product.
You must return your response ONLY as a single valid JSON object with NO markdown wrapper, NO code blocks, and NO leading/trailing text.

The JSON object must strictly match the following structure:
{
  "name": "Exact Name of the Product",
  "tagline": "A compelling 1-sentence tagline describing what the product does",
  "problem": "A detailed 2-3 sentence paragraph explaining the core problem this product solves for its users",
  "users": "A comma-separated list of target user groups (e.g., 'SMEs, Freelancers, Developers')",
  "value": "A detailed 2-3 sentence paragraph describing the unique value proposition of the product",
  "revenue": "Description of the revenue model (e.g., 'Freemium SaaS - $8/user/month')",
  "competitors": [
    { "name": "Competitor 1 Name", "threat": "high", "ux": 85, "features": 78, "pricing": 70, "market": 82 },
    { "name": "Competitor 2 Name", "threat": "medium", "ux": 62, "features": 60, "pricing": 80, "market": 45 },
    { "name": "Competitor 3 Name", "threat": "high", "ux": 80, "features": 85, "pricing": 65, "market": 75 },
    { "name": "Competitor 4 Name", "threat": "low", "ux": 50, "features": 55, "pricing": 90, "market": 30 },
    { "name": "Competitor 5 Name", "threat": "medium", "ux": 72, "features": 70, "pricing": 75, "market": 60 }
  ],
  "score": 85,
  "score_ux": 88,
  "score_market": 84,
  "score_moat": 80,
  "score_growth": 86,
  "score_revenue": 82,
  "score_retention": 85,
  "strengths": [
    "Strength 1 description (1 sentence)",
    "Strength 2 description (1 sentence)",
    "Strength 3 description (1 sentence)"
  ],
  "weaknesses": [
    "Weakness 1 description (1 sentence)",
    "Weakness 2 description (1 sentence)",
    "Weakness 3 description (1 sentence)"
  ],
  "opportunities": [
    "Opportunity 1 description (1 sentence)",
    "Opportunity 2 description (1 sentence)",
    "Opportunity 3 description (1 sentence)"
  ],
  "threats": [
    "Threat 1 description (1 sentence)",
    "Threat 2 description (1 sentence)",
    "Threat 3 description (1 sentence)"
  ],
  "persona_primary": {
    "name": "Primary Persona Name",
    "role": "Job Role or Profile",
    "age": "Age Range (e.g., '25-35')",
    "goals": ["Goal 1 (short phrase)", "Goal 2", "Goal 3"],
    "pains": ["Pain point 1 (short phrase)", "Pain point 2", "Pain point 3"],
    "triggers": ["Trigger event 1", "Trigger event 2"]
  },
  "persona_secondary": {
    "name": "Secondary Persona Name",
    "role": "Job Role or Profile 2",
    "age": "Age Range 2",
    "goals": ["Goal 1", "Goal 2", "Goal 3"],
    "pains": ["Pain point 1", "Pain point 2", "Pain point 3"],
    "triggers": ["Trigger event 1", "Trigger event 2"]
  },
  "journey": [
    { "stage": "Discovery", "title": "Discovery Stage Title", "desc": "1-2 sentence description of discovery", "actions": ["Action 1", "Action 2"] },
    { "stage": "Onboarding", "title": "Onboarding Stage Title", "desc": "1-2 sentence description of onboarding", "actions": ["Action 1", "Action 2"] },
    { "stage": "Activation", "title": "Activation Stage Title", "desc": "1-2 sentence description of activation/aha moment", "actions": ["Action 1", "Action 2"] },
    { "stage": "Retention", "title": "Retention Stage Title", "desc": "1-2 sentence description of daily usage habits", "actions": ["Action 1", "Action 2"] },
    { "stage": "Referral", "title": "Referral Stage Title", "desc": "1-2 sentence description of how referrals occur", "actions": ["Action 1", "Action 2"] }
  ],
  "metrics": [
    { "name": "Metric 1 Name", "value": "Metric 1 Definition", "importance": 95, "priority": "high" },
    { "name": "Metric 2 Name", "value": "Metric 2 Definition", "importance": 90, "priority": "high" },
    { "name": "Metric 3 Name", "value": "Metric 3 Definition", "importance": 85, "priority": "high" },
    { "name": "Metric 4 Name", "value": "Metric 4 Definition", "importance": 80, "priority": "high" },
    { "name": "Metric 5 Name", "value": "Metric 5 Definition", "importance": 75, "priority": "medium" },
    { "name": "Metric 6 Name", "value": "Metric 6 Definition", "importance": 70, "priority": "medium" },
    { "name": "Metric 7 Name", "value": "Metric 7 Definition", "importance": 60, "priority": "medium" },
    { "name": "Metric 8 Name", "value": "Metric 8 Definition", "importance": 50, "priority": "low" }
  ],
  "rice": [
    { "feature": "Feature 1 description", "reach": 8, "impact": 3, "confidence": 90, "effort": 2 },
    { "feature": "Feature 2 description", "reach": 7, "impact": 2, "confidence": 85, "effort": 1 },
    { "feature": "Feature 3 description", "reach": 9, "impact": 2, "confidence": 80, "effort": 3 },
    { "feature": "Feature 4 description", "reach": 6, "impact": 3, "confidence": 75, "effort": 4 },
    { "feature": "Feature 5 description", "reach": 5, "impact": 3, "confidence": 70, "effort": 5 }
  ],
  "prd": {
    "feature": "Name of the highest priority feature",
    "objective": "Objective statement for the feature (1 sentence)",
    "user_story": "As a... I want to... so that...",
    "acceptance_criteria": [
      "Criteria 1",
      "Criteria 2",
      "Criteria 3",
      "Criteria 4"
    ],
    "success_metrics": [
      "Metric 1 description",
      "Metric 2 description",
      "Metric 3 description"
    ],
    "open_questions": [
      "Open question 1",
      "Open question 2"
    ]
  },
  "features": [
    "Core Feature 1 Name",
    "Core Feature 2 Name",
    "Core Feature 3 Name",
    "Core Feature 4 Name",
    "Core Feature 5 Name"
  ]
}

Ensure all numerical scores and ratings are realistic (0-100). Competitor arrays must contain exactly 5 competitors. Strengths, weaknesses, opportunities, threats lists must contain exactly 3 items. Features must contain exactly 5 items. Acceptance criteria must contain exactly 4 items, success metrics exactly 3, and open questions exactly 2. All journey stages must be in the correct order: Discovery, Onboarding, Activation, Retention, Referral.`;

      const payload = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
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
        let savedCredits = user ? user.credits : 10;
        if (activeAuthToken) {
          const saveRes = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeAuthToken}`
            },
            body: JSON.stringify(structuredReport)
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            savedCredits = saveData.credits !== undefined ? saveData.credits : savedCredits;
          }
        }

        if (user && user.plan !== 'Pro' && savedCredits <= 2 && savedCredits > 0) {
          showToast(`${savedCredits} credits left — upgrade for unlimited.`, 'warn');
        }

        finishAnalysis(structuredReport, savedCredits);

      } catch (err: any) {
        console.warn('AI engine generation failed, falling back to local fallback simulation:', err.message);
        showToast(`AI Engine Error: ${err.message} (Running offline fallback)`, 'warn');
        
        // Local simulation fallback
        setTimeout(() => {
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

          let nextCredits = user ? user.credits : 10;
          if (user && user.plan !== 'Pro' && nextCredits > 0) {
            nextCredits--;
          }
          finishAnalysis(mockReport, nextCredits);
        }, 800);
      }
    }
  };

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
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(updatedReport)
        });
        if (res.ok) {
          showToast('Notes saved successfully!', 'ok');
          fetchReports(token);
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
            <div className="stat"><span className="stat-n">14,000+</span> teardowns generated</div>
            <div className="dot"></div>
            <div className="stat"><span className="stat-n">5,400+</span> PMs &amp; founders</div>
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
                    <span>Auto-saves to browser session local storage history.</span>
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
            <div key={idx} className="feat-card2">
              <div className="feat-header">
                <span className="feat-icon">{feat.icon}</span>
                <div className="feat-title">{feat.title}</div>
              </div>
              <div className="feat-checklist">
                {feat.items.map((item, id) => (
                  <div key={id} className="feat-chk-item">
                    <span className="feat-chk-bullet">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="section" id="how">
        <div className="kicker">How it works</div>
        <div className="sec-title">From input to senior-level product analysis</div>
        <div className="sec-sub">Three automated research steps generate complete product strategies.</div>

        <div className="steps-grid" style={{ marginTop: '2rem' }}>
          <div className="step-card">
            <div className="step-num">01</div>
            <div className="step-title">Input Product Name or URL</div>
            <p className="step-desc">Enter any consumer app, SaaS dashboard, or URL. Our scraper instantly extracts site copy and metadata.</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <div className="step-title">AI Research Scanning</div>
            <p className="step-desc">Our engine gathers social signals, App Store feedback, and industry benchmarks, feeding Claude with context.</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <div className="step-title">Strategic Synthesis</div>
            <p className="step-desc">Claude generates SWOT frameworks, RICE matrices, and user story drafts structured exactly like senior PM blueprints.</p>
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

        <div className="pricing-grid" style={{ marginTop: '2rem' }}>
          {/* Free / Guest Plan */}
          <div className="p-card" id="plan-starter">
            <div className="p-card-top">
              <div className="p-tag">Starter</div>
              <div className="p-amt">₹0<sub>/month</sub></div>
              <div className="p-desc">Test-drive the engine with basic PM modules.</div>
            </div>
            <div className="p-features">
              <div className="pf"><span className="ico">✓</span> 10 teardowns total</div>
              <div className="pf"><span className="ico">✓</span> Core research overview</div>
              <div className="pf"><span className="ico">✓</span> SWOT frameworks</div>
              <div className="pf"><span className="ico">✓</span> Export HTML reports</div>
            </div>
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
          <div className="p-card" id="plan-student">
            <div className="p-card-top">
              <div className="p-tag">Student</div>
              <div className="p-amt">
                {billingPeriod === 'monthly' ? '₹199' : '₹139'}
                <sub>/month</sub>
              </div>
              <div className="p-desc">For APMs and students mapping visual cases.</div>
            </div>
            <div className="p-features">
              <div className="pf"><span className="ico">✓</span> 15 teardowns/month</div>
              <div className="pf"><span className="ico">✓</span> All 8 report views</div>
              <div className="pf"><span className="ico">✓</span> Export print-ready PDFs</div>
              <div className="pf"><span className="ico">✓</span> RICE prioritisation matrices</div>
            </div>
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
          <div className="p-card p-card-popular" id="plan-pro" style={{ border: '1.5px solid var(--ink)' }}>
            <div className="p-card-top">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="p-tag" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>Pro</div>
                <span className="p-badge" style={{ background: 'var(--ink)', color: 'var(--bg)' }}>MOST POPULAR</span>
              </div>
              <div className="p-amt">
                {billingPeriod === 'monthly' ? '₹1,499' : '₹1,049'}
                <sub>/month</sub>
              </div>
              <div className="p-desc">Unlimited generation, custom scraping and team features.</div>
            </div>
            <div className="p-features">
              <div className="pf"><span className="ico">✓</span> Unlimited teardown runs</div>
              <div className="pf"><span className="ico">✓</span> Advanced web scraping integrations</div>
              <div className="pf"><span className="ico">✓</span> Custom prompt override parameters</div>
              <div className="pf"><span className="ico">✓</span> Add up to 3 team members</div>
            </div>
            <button className="p-btn p-btn-primary" onClick={() => {
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
                  <label className="auth-lbl">Email Address</label>
                  <input className="inp" type="email" placeholder="you@example.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoComplete="username" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="auth-lbl" style={{ marginBottom: 0 }}>Password</label>
                    <a href="#" onClick={(e) => { e.preventDefault(); showToast('Password reset link sent to your email (simulated).', 'ok'); }} style={{ fontSize: '11px', color: 'var(--acc)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
                  </div>
                  <input className="inp" type="password" placeholder="••••••••" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <button className="auth-submit-btn" type="submit">Log In</button>
              </form>
            ) : (
              <form id="register-form" onSubmit={(e) => handleAuthSubmit(e, 'register')}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="auth-lbl">Full Name</label>
                  <input className="inp" type="text" placeholder="John Doe" required value={regName} onChange={e => setRegName(e.target.value)} autoComplete="name" />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label className="auth-lbl">Email Address</label>
                  <input className="inp" type="email" placeholder="you@example.com" required value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label className="auth-lbl">Password</label>
                  <input className="inp" type="password" placeholder="Min. 6 characters" required value={regPassword} onChange={e => setRegPassword(e.target.value)} autoComplete="new-password" />
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
// REPORT SUB-TAB COMPONENTS (JSX replicas matching css classes)
// ────────────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: Report }) {
  const comps = (report.competitors || []).map(c => typeof c === 'object' ? c.name : c);
  const feats = (report.features || []).map((f, i) => <span key={i} className="pill">{f}</span>);

  // Radar logic
  const dims = [
    { label: 'UX', val: report.score_ux || report.score, color: '#2a5fa5' },
    { label: 'Market', val: report.score_market || report.score, color: '#1a6b4a' },
    { label: 'Moat', val: report.score_moat || report.score, color: '#6366f1' },
    { label: 'Growth', val: report.score_growth || report.score, color: '#10b981' },
    { label: 'Revenue', val: report.score_revenue || report.score, color: '#7c3aed' },
    { label: 'Retention', val: report.score_retention || report.score, color: '#be123c' }
  ];
  const cx = 130, cy = 130, R = 90, n = dims.length;
  const angle = (i: number) => (Math.PI * 2 * (i / n)) - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map((f, ringIdx) => {
    const dStr = Array.from({ length: n }, (_, i) => pt(i, R * f))
      .map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ' ' + p[1])
      .join(' ') + 'Z';
    return <path key={ringIdx} d={dStr} fill="none" stroke="#e0ded8" strokeWidth="1" />;
  });

  // Spokes
  const spokes = Array.from({ length: n }, (_, i) => {
    const [x, y] = pt(i, R);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e0ded8" strokeWidth="1" />;
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
      <text key={i} x={x} y={y + 4} textAnchor={anchor} fontSize="11" fill="#6b6860" fontFamily="DM Sans, sans-serif" fontWeight="600">
        {d2.label}
        <tspan x={x} dy="13" fontWeight="700" fill="#1a1916">{Math.min(d2.val, 100)}</tspan>
      </text>
    );
  });

  // Dots
  const dots = dims.map((d2, i) => {
    const r = R * (Math.min(d2.val, 100) / 100);
    const [x, y] = pt(i, r);
    return <circle key={i} cx={x} cy={y} r="4" fill={d2.color} stroke="#fff" strokeWidth="1.5" />;
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
        <div className="ov-label">📌 Sources &amp; Citations</div>
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

function PersonasTab({ report }: { report: Report }) {
  const renderCard = (p: any, cls: string, bg: string, fg: string, emoji: string) => {
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

function SwotTab({ report }: { report: Report }) {
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
          <line x1={P} y1={P + iH / 2} x2={P + iW} y2={P + iH / 2} stroke="#e0ded8" strokeWidth="1" strokeDasharray="4" />
          <line x1={P + iW / 2} y1={P} x2={P + iW / 2} y2={P + iH} stroke="#e0ded8" strokeWidth="1" strokeDasharray="4" />
          <rect x={P} y={P} width={iW} height={iH} fill="none" stroke="#e0ded8" strokeWidth="1" />
          {dots}
          <text x={P + iW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#a8a59e" fontWeight="600">Impact →</text>
          <text x="12" y={P + iH / 2} textAnchor="middle" fontSize="10" fill="#a8a59e" fontWeight="600" transform={`rotate(-90,12,${P + iH / 2})`}>Likelihood →</text>
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

function CompetitorsTab({ report, animate }: { report: Report; animate: boolean }) {
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
    <text key={i} x={scX(v)} y={H - 8} textAnchor="middle" fontSize="10" fill="#a8a59e">{v}</text>
  ));
  const yLabels = [0, 25, 50, 75, 100].map((v, i) => (
    <text key={i} x={PL - 6} y={scY(v) + 4} textAnchor="end" fontSize="10" fill="#a8a59e">{v}</text>
  ));
  const gridX = [25, 50, 75].map((v, i) => (
    <line key={i} x1={scX(v)} y1={PT} x2={scX(v)} y2={PT + iH} stroke="#e0ded8" strokeWidth="1" strokeDasharray="3" />
  ));
  const gridY = [25, 50, 75].map((v, i) => (
    <line key={i} x1={PL} y1={scY(v)} x2={PL + iW} y2={scY(v)} stroke="#e0ded8" strokeWidth="1" strokeDasharray="3" />
  ));

  return (
    <div className="tab-panel">
      <div className="comp-layout">
        <div className="comp-chart-panel" style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>
            Competitive Positioning Map
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, height: 'auto' }} xmlns="http://www.w3.org/2000/svg">
            <rect x={PL} y={PT} width={iW} height={iH} fill="none" stroke="#e0ded8" strokeWidth="1" />
            {gridX}
            {gridY}
            {bubbles}
            {xLabels}
            {yLabels}
            <text x={PL + iW / 2} y={H} textAnchor="middle" fontSize="10" fill="#6b6860" fontWeight="600">UX Quality →</text>
            <text x="10" y={PT + iH / 2} textAnchor="middle" fontSize="10" fill="#6b6860" fontWeight="600" transform={`rotate(-90,10,${PT + iH / 2})`}>Market Fit →</text>
            <text x={PL + iW - 4} y={PT + 14} textAnchor="end" fontSize="9" fill="#a8a59e">Bubble size = Features</text>
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

function JourneyTab({ report }: { report: Report }) {
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

function MetricsTab({ report, animate }: { report: Report; animate: boolean }) {
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
        <circle cx="35" cy="35" r={r} fill="none" stroke="#e0ded8" strokeWidth="7" />
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
        <text x="35" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a1916">{val}</text>
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

function RiceTab({ report, animate }: { report: Report; animate: boolean }) {
  const items = report.rice || (report.features || []).slice(0, 5).map((f, i) => ({ feature: f, reach: 9 - i, impact: i < 2 ? 3 : 2, confidence: 90 - i * 5, effort: i < 2 ? 2 : 3 }));
  const scored = items.map(r => ({ ...r, score: Math.round((r.reach * r.impact * (r.confidence / 100)) / r.effort * 10) })).sort((a, b) => b.score - a.score);
  const maxScore = scored[0]?.score || 1;
  const colors = ['#1a6b4a', '#2a5fa5', '#7c3aed', '#6366f1', '#6b6860'];

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
                  { label: 'Effort', val: r.effort, max: 5, bg: '#e0ded8' }
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

function PrdTab({ report }: { report: Report }) {
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
