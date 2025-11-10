import { useEffect, useRef, useState } from 'react'
import { useKnowledgeBase } from './services/knowledge-service'

export type PromptGuide = {
  sections: string[]
  lastUpdated: number
}

export function usePromptGuide() {
  const [guide, setGuide] = useState<PromptGuide>({ sections: [], lastUpdated: Date.now() })
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch('http://localhost:4001/prompt')
        const data = await res.json()
        if (data.ok) {
          const sections = data.prompt.split(/\n\n+/)
          setGuide({ sections, lastUpdated: Date.now() })
        }
      } catch (e) {
        // noop
      }
    }
    fetchPrompt()

    const ws = new WebSocket('ws://localhost:4001')
    wsRef.current = ws
    ws.onmessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse((evt as any).data as string)
        if (payload.type === 'prompt_update') {
          const sections = String(payload.prompt).split(/\n\n+/)
          setGuide({ sections, lastUpdated: Date.now() })
        }
      } catch {}
    }
    return () => ws.close()
  }, [])

  return guide
}

export function useMulfaSubagent() {
  const guide = usePromptGuide();
  const { searchConcepts, formatConceptForConversation, isLoading: isKnowledgeLoading } = useKnowledgeBase();
  const systemPrompt = guide.sections.join('\n\n');
  
  const formatPrompt = (userText: string) => {
    if (!systemPrompt) return userText;
    
    // Search for relevant concepts based on user query
    const relevantConcepts = !isKnowledgeLoading ? searchConcepts(userText) : [];
    
    // Format up to 2 most relevant concepts for context without verbatim copying
    let contextualKnowledge = '';
    if (relevantConcepts.length > 0) {
      const topConcepts = relevantConcepts.slice(0, 2);
      contextualKnowledge = '\n\nRelevant Context:\n' + 
        topConcepts.map((concept: any) => formatConceptForConversation(concept)).join('\n\n');
    }
    
    return `System:\n${systemPrompt}${contextualKnowledge}\n\nUser:\n${userText}`;
  };
  
  return { 
    systemPrompt, 
    lastUpdated: guide.lastUpdated, 
    formatPrompt,
    hasKnowledge: !isKnowledgeLoading
  };
}