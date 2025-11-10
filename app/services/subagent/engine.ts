import { useEffect, useMemo, useRef, useState } from 'react';
import { useSubagentResearch } from './research';
import { validateEndpoints, validateBuilderConfigText } from './validation';
import { generateInitialQuestions } from './questions';
import {
  Evidence,
  ResearchFinding,
  SubagentAnswer,
  SubagentPlan,
  SubagentQuestion,
  SubagentSnapshot,
  SubagentState,
  SubagentTask,
  ValidationResult,
} from './types';
import { usePuter } from '../puter-service';

export interface UseSubagentEngineOptions {
  goal?: string;
  defaultPreviewUrl?: string; // e.g. http://localhost:8080/
}

export const useSubagentEngine = (opts?: UseSubagentEngineOptions) => {
  const goal = opts?.goal || '';
  const defaultPreviewUrl = opts?.defaultPreviewUrl || 'http://localhost:8080/';

  const { researchTopics } = useSubagentResearch();
  const puter = usePuter();

  const [state, setState] = useState<SubagentState>('idle');
  const [questions, setQuestions] = useState<SubagentQuestion[]>([]);
  const [answers, setAnswers] = useState<SubagentAnswer[]>([]);
  const [findings, setFindings] = useState<ResearchFinding[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [plan, setPlan] = useState<SubagentPlan | undefined>(undefined);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      const qs = generateInitialQuestions(goal);
      setQuestions(qs.map(q => ({ ...q, askedAt: Date.now() })));
      setState('questioning');
      startedRef.current = true;
    }
  }, [goal]);

  const answerQuestion = (questionId: string, value: string | string[] | boolean) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId);
      const now = Date.now();
      if (existing) {
        return prev.map(a => (a.questionId === questionId ? { ...a, value, answeredAt: now } : a));
      }
      return [...prev, { questionId, value, answeredAt: now }];
    });
  };

  const runResearch = async () => {
    setState('researching');
    const topics: string[] = [];

    // Seed topics based on answers and default goal
    const valScope = answers.find(a => a.questionId === 'validation_scope');
    const needsPackaging = answers.find(a => a.questionId === 'needs_packaging');
    const needsCi = answers.find(a => a.questionId === 'needs_ci');

    if (String(goal).toLowerCase().includes('nsis')) topics.push('Electron Builder NSIS best practices');
    if (String(goal).toLowerCase().includes('electron')) topics.push('Electron packaging on Windows');
    if (needsPackaging && needsPackaging.value === true) {
      topics.push('Disable asar to avoid file locking in NSIS');
      topics.push('Silent installation switches for NSIS');
    }
    if (needsCi && needsCi.value === true) {
      topics.push('CI pipeline for Electron NSIS with silent install');
    }
    topics.push('Puter.js integration in React Native Web');

    const f = await researchTopics(Array.from(new Set(topics)));
    setFindings(f);
    setState('validating');
  };

  const runValidation = async () => {
    setState('validating');
    const vals: ValidationResult[] = [];

    // UI health check
    const uiVals = await validateEndpoints([defaultPreviewUrl], 'GET');
    vals.push(...uiVals);

    // Electron builder config (if accessible via Puter fs)
    try {
      const raw = await puter.readFile?.('app/dist_electron_new/builder-effective-config.yaml');
      if (raw) {
        vals.push(...validateBuilderConfigText(String(raw)));
      }
    } catch (e) {
      // If not accessible, note an info result
      vals.push({ checkId: 'builder:read', passed: false, detail: 'builder config not accessible via Puter fs', severity: 'warning' });
    }

    setValidations(vals);
    setState('planning');
  };

  const proposePlan = () => {
    setState('planning');
    const tasks: SubagentTask[] = [];

    const wantsPackaging = answers.find(a => a.questionId === 'needs_packaging');
    const wantsCi = answers.find(a => a.questionId === 'needs_ci');

    if (!wantsPackaging || wantsPackaging.value === true) {
      tasks.push({ id: 'pkg_nsis', title: 'Package Electron app for Windows (NSIS) with asar disabled', status: 'pending', priority: 'high' });
      tasks.push({ id: 'silent_install', title: 'Run silent installation of generated NSIS installer', status: 'pending', priority: 'high' });
    }
    if (!wantsCi || wantsCi.value === true) {
      tasks.push({ id: 'ci_script', title: 'Generate CI script to automate packaging and validation', status: 'pending', priority: 'medium' });
    }
    tasks.push({ id: 'ui_health', title: 'Confirm local UI health-check responds correctly', status: 'pending', priority: 'medium' });

    const p: SubagentPlan = { id: `plan:${Date.now()}`, goal: goal || 'Ensure fully functioning packaging and installation', tasks };
    setPlan(p);
    return p;
  };

  const snapshot: SubagentSnapshot = {
    state,
    goal,
    questions,
    answers,
    findings,
    validations,
    plan,
    lastUpdated: Date.now(),
  };

  return {
    state,
    questions,
    answers,
    findings,
    validations,
    plan,
    answerQuestion,
    runResearch,
    runValidation,
    proposePlan,
    snapshot,
  };
};