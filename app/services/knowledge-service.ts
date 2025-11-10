import { useEffect, useState } from 'react';
import { usePuter } from './puter-service';

// Types for our knowledge base
export interface ConceptSource {
  book: string;
  chapter: string;
}

export interface Concept {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  summary: string;
  key_points: string[];
  examples: string[];
  related_concepts: string[];
  source: ConceptSource;
}

export interface KnowledgeSchema {
  version: string;
  schema: {
    concept: any;
  };
  categories: string[];
  books: string[];
}

// Knowledge service hook
export const useKnowledgeBase = () => {
  const { isAuthenticated, isLoaded, readFile, listFiles } = usePuter();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [schema, setSchema] = useState<KnowledgeSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all concepts from the knowledge base
  const loadKnowledgeBase = async () => {
    if (!isLoaded || !isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First load the schema
      const schemaContent = await readFile('app/data/knowledge/schema.json');
      const schemaData = JSON.parse(String(schemaContent)) as KnowledgeSchema;
      setSchema(schemaData);

      // Load concepts from each category
      const allConcepts: Concept[] = [];
      
      for (const category of schemaData.categories) {
        try {
          const files = await listFiles(`app/data/knowledge/lindahl/${category}`);
          
          for (const file of files) {
            const fileName = (file as any)?.name ?? String(file);
            if (String(fileName).endsWith('.json')) {
              try {
                const conceptContent = await readFile(`app/data/knowledge/lindahl/${category}/${fileName}`);
                const conceptData = JSON.parse(String(conceptContent)) as Concept;
                allConcepts.push(conceptData);
              } catch (conceptError) {
                console.error(`Error loading concept from ${fileName}:`, conceptError);
              }
            }
          }
        } catch (categoryError) {
          console.error(`Error loading category ${category}:`, categoryError);
        }
      }

      setConcepts(allConcepts);
    } catch (e) {
      console.error('Error loading knowledge base:', e);
      setError('Failed to load knowledge base');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: basic relevance score for a concept against a query
  const scoreConcept = (concept: Concept, q: string) => {
    const query = q.toLowerCase();
    let score = 0;
    const boost = (found: boolean, weight: number) => { if (found) score += weight; };

    boost(concept.title.toLowerCase().includes(query), 5);
    boost(concept.category.toLowerCase().includes(query), 2);
    boost(concept.subcategory.toLowerCase().includes(query), 2);
    boost(concept.summary.toLowerCase().includes(query), 3);
    boost((concept.key_points || []).some(k => k.toLowerCase().includes(query)), 3);
    boost((concept.examples || []).some(e => e.toLowerCase().includes(query)), 1);

    const tokens = query.split(/\W+/).filter(Boolean);
    const hay = (
      concept.title + ' ' + concept.summary + ' ' + concept.category + ' ' + concept.subcategory + ' ' +
      (concept.key_points || []).join(' ') + ' ' + (concept.examples || []).join(' ')
    ).toLowerCase();
    for (const t of tokens) {
      if (t.length > 2 && hay.includes(t)) score += 1;
    }
    return score;
  };

  // Search concepts by query text
  const searchConcepts = (query: string): Concept[] => {
    if (!query.trim()) return [];
    const scored = concepts.map(c => ({ c, s: scoreConcept(c, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map(x => x.c);
    return scored;
  };

  // Get concepts by category
  const getConceptsByCategory = (category: string): Concept[] => {
    const q = category.toLowerCase();
    return concepts.filter(c => c.category.toLowerCase() === q);
  };

  // Get related concepts using explicit relations and lightweight semantic proximity
  const getRelatedConcepts = (conceptId: string): Concept[] => {
    const base = concepts.find(c => c.id === conceptId);
    if (!base) return [];
    const explicit = concepts.filter(c => (base.related_concepts || []).includes(c.id));
    const sameCat = concepts.filter(c => c.category === base.category && c.id !== base.id);
    const map = new Map<string, Concept>();
    for (const c of [...explicit, ...sameCat]) {
      if (!map.has(c.id)) map.set(c.id, c);
    }
    return Array.from(map.values());
  };

  // Format a concept into concise conversational context
  const formatConceptForConversation = (concept: Concept): string => {
    const header = `${concept.title} — ${concept.category}${concept.subcategory ? `/${concept.subcategory}` : ''}`;
    const points = (concept.key_points || []).slice(0, 4).map(p => `- ${p}`).join('\n');
    const example = (concept.examples || [])[0] ? `\nExample: ${(concept.examples || [])[0]}` : '';
    const src = concept.source ? `\nSource: ${concept.source.book}${concept.source.chapter ? `, ${concept.source.chapter}` : ''}` : '';
    return `${header}\nSummary: ${concept.summary}\nKey points:\n${points}${example}${src}`;
  };

  // Load knowledge base when Puter is ready
  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      loadKnowledgeBase();
    }
  }, [isLoaded, isAuthenticated]);

  return {
    concepts,
    schema,
    isLoading,
    error,
    searchConcepts,
    getConceptsByCategory,
    getRelatedConcepts,
    formatConceptForConversation,
    loadKnowledgeBase
  };
};