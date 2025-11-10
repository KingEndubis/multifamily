import { useKnowledgeBase } from '../knowledge-service';
import { usePuter } from '../puter-service';
import { Evidence, ResearchFinding } from './types';

// Hook to research topics using the local knowledge base and optionally Puter AI
export const useSubagentResearch = () => {
  const kb = useKnowledgeBase();
  const puter = usePuter();

  const researchTopics = async (topics: string[]): Promise<ResearchFinding[]> => {
    const findings: ResearchFinding[] = [];

    for (const topic of topics) {
      const evidences: Evidence[] = [];

      // Knowledge base search
      if (!kb.isLoading && kb.concepts.length > 0) {
        const results = kb.searchConcepts(topic).slice(0, 3);
        for (const c of results) {
          evidences.push({
            id: `kb:${c.id}`,
            title: c.title,
            detail: kb.formatConceptForConversation(c),
            source: 'knowledge',
            score: 0.7,
          });
        }
      }

      // Optional AI chat-based research via Puter
      try {
        if (puter && puter.chatWithAI) {
          const aiResp = await puter.chatWithAI(
            `Research the topic: "${topic}". Provide a concise, validated checklist and key considerations. Avoid hallucinations and emphasize steps that can be verified.`
          );
          if (aiResp) {
            evidences.push({
              id: `ai:${Date.now()}:${Math.random().toString(36).slice(2)}`,
              title: `AI research for ${topic}`,
              detail: typeof aiResp === 'string' ? aiResp : JSON.stringify(aiResp),
              source: 'ai',
              score: 0.6,
            });
          }
        }
      } catch (e) {
        // Ignore AI errors; continue with KB results
      }

      findings.push({
        id: `finding:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        topic,
        summary:
          evidences.length > 0
            ? `Collected ${evidences.length} evidences for ${topic}`
            : `No evidences found for ${topic}`,
        evidences,
      });
    }

    return findings;
  };

  return { researchTopics };
};