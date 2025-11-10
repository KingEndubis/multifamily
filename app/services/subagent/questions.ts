import { SubagentQuestion, QuestionOption } from './types';

// Generate an initial set of questions based on the user's goal/prompt
export const generateInitialQuestions = (goal: string): SubagentQuestion[] => {
  const g = (goal || '').toLowerCase();

  const questions: SubagentQuestion[] = [
    {
      id: 'goal_clarification',
      text: 'In one sentence, what outcome should the subagent achieve first?',
      type: 'text',
      required: true,
    },
    {
      id: 'environment_primary',
      text: 'Which environment should the subagent operate in primarily?',
      type: 'choice',
      options: [
        { id: 'env_web', label: 'Web (React Native Web / Browser)', value: 'web' },
        { id: 'env_desktop', label: 'Desktop (Electron)', value: 'desktop' },
        { id: 'env_ci', label: 'CI/Automation (scripts only)', value: 'ci' },
      ],
      required: true,
    },
    {
      id: 'needs_packaging',
      text: 'Should the subagent oversee Electron NSIS packaging and silent installation?',
      type: 'boolean',
      required: true,
    },
    {
      id: 'needs_ci',
      text: 'Should the subagent generate and maintain a CI script to automate packaging and validation?',
      type: 'boolean',
      required: true,
    },
    {
      id: 'validation_scope',
      text: 'Which validations should be prioritized?',
      type: 'multi-choice',
      options: [
        { id: 'val_ui', label: 'UI health-check (local preview)', value: 'ui' },
        { id: 'val_packaging', label: 'Packaging artifacts and config', value: 'packaging' },
        { id: 'val_env', label: 'Environment readiness (Node/NPM, Electron Builder)', value: 'environment' },
        { id: 'val_puter', label: 'Puter.js availability and authentication', value: 'puter' },
      ],
      required: true,
    },
  ];

  // If the goal mentions NSIS/electron, emphasize packaging
  if (g.includes('nsis') || g.includes('electron') || g.includes('installer')) {
    questions.unshift({
      id: 'packaging_priority',
      text: 'Packaging looks critical. Should NSIS be the immediate focus?',
      type: 'boolean',
      required: true,
    });
  }

  return questions;
};