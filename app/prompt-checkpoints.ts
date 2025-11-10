import { usePromptGuide } from './prompt-agent';
import { useKnowledgeBase } from './services/knowledge-service';

// Dedicated checkpoint sub-agent for multifamily underwriting
export function useCheckpointSubagent() {
  const guide = usePromptGuide();
  const { searchConcepts, formatConceptForConversation, isLoading: isKnowledgeLoading } = useKnowledgeBase();
  const systemPrompt = guide.sections.join('\n\n');

  // Multifamily underwriting checkpoints
  const checkpoints = [
    { id: 'property_overview', label: 'Property Overview', items: ['Units', 'Year Built', 'Construction Type', 'Occupancy', 'Class (A/B/C)', 'Location & Submarket'] },
    { id: 'income', label: 'Income', items: ['Gross Potential Rent', 'Other Income', 'Loss-to-Lease', 'Vacancy Allowance', 'Effective Gross Income'] },
    { id: 'expenses', label: 'Operating Expenses', items: ['Taxes', 'Insurance', 'Utilities', 'Repairs & Maintenance', 'Payroll/Management', 'Turnover/Make-ready', 'Admin/Marketing', 'Total OpEx'] },
    { id: 'noi', label: 'NOI', items: ['Net Operating Income (TTM / Pro Forma)', 'Annualization assumptions'] },
    { id: 'financing', label: 'Financing', items: ['Loan Amount', 'Interest Rate', 'Amort/IO', 'Term', 'Debt Service', 'DSCR'] },
    { id: 'valuation', label: 'Valuation', items: ['Market Cap Rate', 'Purchase Price', 'Entry Cap', 'Price per Unit'] },
    { id: 'business_plan', label: 'Business Plan', items: ['Value-Add Scope', 'Renovation Budget', 'Rent Upside', 'Expense Optimizations', 'Timeline'] },
    { id: 'market', label: 'Market', items: ['Rent Growth Assumptions', 'Supply/Demand', 'Emerging Market Signals', 'Employment Drivers', 'Median Income/AMI'] },
    { id: 'exit', label: 'Exit', items: ['Exit Cap', 'Hold Period', 'Sale Price', 'IRR Targets'] },
    { id: 'risk', label: 'Risk & Sensitivity', items: ['Stress tests (Rent -5%, Expense +10%, Rate +100bps)', 'Break-even occupancy', 'Contingency'] }
  ];

  const buildContext = (userText: string) => {
    const relevantConcepts = !isKnowledgeLoading ? searchConcepts(userText) : [];
    const topConcepts = relevantConcepts.slice(0, 3);
    const contextualKnowledge = topConcepts.length
      ? '\n\nRelevant Context:\n' + topConcepts.map(c => formatConceptForConversation(c)).join('\n\n')
      : '';
    return contextualKnowledge;
  };

  const formatCheckpointPrompt = (userText: string, opts?: { attachments?: string[]; dataSummary?: string }) => {
    const contextualKnowledge = buildContext(userText);
    const attachText = (opts?.attachments || []).length
      ? `\n\nAttachments provided (names only for privacy):\n${(opts!.attachments as string[]).map(n => `- ${n}`).join('\n')}`
      : '';
    const parsedData = opts?.dataSummary ? `\n\nAttachment-derived structured data:\n${opts.dataSummary}` : '';

    const checkpointText = checkpoints
      .map(cp => `# ${cp.label}\n${cp.items.map(i => `- ${i}`).join('\n')}`)
      .join('\n\n');

    const instructions = [
      'You are Mulfa, a multifamily underwriting companion.',
      'Task:',
      '- Parse the user info and attempt to answer each checkpoint with specific numbers if present.',
      '- If data is missing, ask concise follow-up questions needed to complete the underwriting.',
      '- Where appropriate, propose reasonable best-case assumptions (clearly labeled as assumptions), grounded in market signals and value-add principles without verbatim citation.',
      '- Compute headline metrics: Cap Rate, DSCR, Cash-on-Cash (assume 25% down if financing terms are absent).',
      '- Provide a clean, structured output with four sections.',
      'Output Sections:',
      '1) Summary of known numbers and sources',
      '2) Checkpoint Q&A (each checkpoint answered or marked Missing with follow-ups)',
      '3) Best-case execution plan (bulleted actions and sequencing)',
      '4) Missing info and next actions (list)',
    ].join('\n');

    const fullSystem = systemPrompt ? `System:\n${systemPrompt}${contextualKnowledge}\n\n` : '';
    return `${fullSystem}${instructions}\n\nCheckpoints:\n${checkpointText}${attachText}${parsedData}\n\nUser:\n${userText}`;
  };

  return { checkpoints, formatCheckpointPrompt, systemPrompt, lastUpdated: guide.lastUpdated };
}