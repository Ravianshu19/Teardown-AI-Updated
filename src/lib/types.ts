export interface Competitor {
  name: string;
  threat: string;
  ux: number;
  features: number;
  pricing: number;
  market: number;
}

export interface Persona {
  name: string;
  role: string;
  age: string;
  goals: string[];
  pains: string[];
  triggers: string[];
}

export interface JourneyStage {
  stage: string;
  title: string;
  desc: string;
  actions: string[];
}

export interface Metric {
  name: string;
  value: string;
  importance: number;
  priority: string;
}

export interface RiceItem {
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

export interface PrdSpec {
  feature: string;
  objective: string;
  user_story: string;
  acceptance_criteria: string[];
  success_metrics: string[];
  open_questions: string[];
}

export interface Report {
  id?: string;
  name: string;
  score: number;
  score_ux: number;
  score_market: number;
  score_moat: number;
  score_growth: number;
  score_revenue: number;
  score_retention: number;
  date: string;
  ts: number;
  domain?: string;
  col: string;
  saved: boolean;
  note: string;
  tagline?: string;
  problem?: string;
  users?: string;
  value?: string;
  revenue?: string;
  competitors?: Competitor[];
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  persona_primary?: Persona;
  persona_secondary?: Persona;
  journey?: JourneyStage[];
  metrics?: Metric[];
  rice?: RiceItem[];
  prd?: PrdSpec;
  features?: string[];
  isComparison?: boolean;
}

export interface TeamMember {
  initials: string;
  name: string;
  email?: string;
  role: string;
  tears: number;
  lastActive: string;
  col: string;
}

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  token?: string;
  plan: string;
  credits: number;
  maxCreds: number;
  reports: Report[];
  team: TeamMember[];
}
