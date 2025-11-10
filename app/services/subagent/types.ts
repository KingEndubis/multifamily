// Subagent core types for research, validation, and implementation oversight

export type SubagentState =
  | 'idle'
  | 'questioning'
  | 'researching'
  | 'validating'
  | 'planning'
  | 'implementing'
  | 'completed'
  | 'blocked';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface SubagentQuestion {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'multi-choice' | 'boolean';
  options?: QuestionOption[];
  required?: boolean;
  askedAt?: number;
}

export interface SubagentAnswer {
  questionId: string;
  value: string | string[] | boolean;
  answeredAt: number;
}

export interface Evidence {
  id: string;
  title: string;
  detail: string;
  source: 'knowledge' | 'ai' | 'validation' | 'user' | 'system';
  score?: number; // confidence or relevance score
}

export interface ResearchFinding {
  id: string;
  topic: string;
  summary: string;
  evidences: Evidence[];
}

export interface ValidationCheck {
  id: string;
  name: string;
  description?: string;
}

export interface ValidationResult {
  checkId: string;
  passed: boolean;
  detail?: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface SubagentTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface SubagentPlan {
  id: string;
  goal: string;
  tasks: SubagentTask[];
}

export interface SubagentSnapshot {
  state: SubagentState;
  goal?: string;
  questions: SubagentQuestion[];
  answers: SubagentAnswer[];
  findings: ResearchFinding[];
  validations: ValidationResult[];
  plan?: SubagentPlan;
  lastUpdated: number;
}