# Dave Lindahl/RE Mentor Knowledge Base

This knowledge base contains indexed concepts from Dave Lindahl's books and the RE Mentor program, structured for retrieval during conversations without verbatim copying.

## Structure

The knowledge base is organized into categories that reflect key areas of multifamily real estate investing:

```
knowledge/
├── schema.json            # Schema definition for concept entries
├── lindahl/               # Dave Lindahl's concepts
│   ├── emerging-markets/  # Market selection and analysis concepts
│   ├── underwriting/      # Financial analysis concepts
│   ├── acquisition/       # Deal structuring and purchase concepts
│   ├── operations/        # Property management concepts
│   └── exit-strategies/   # Exit and wealth-building concepts
```

## Adding New Concepts

To add a new concept to the knowledge base:

1. Create a new JSON file in the appropriate category directory
2. Follow the schema structure defined in `schema.json`
3. Focus on summarizing key principles and examples without verbatim copying

Example concept structure:

```json
{
  "id": "unique-concept-id",
  "title": "Concept Title",
  "category": "category-name",
  "subcategory": "subcategory-name",
  "summary": "A concise explanation of the concept in your own words.",
  "key_points": [
    "Important point 1",
    "Important point 2"
  ],
  "examples": [
    "Practical example 1",
    "Practical example 2"
  ],
  "related_concepts": [
    "related-concept-id-1",
    "related-concept-id-2"
  ],
  "source": {
    "book": "Book Title",
    "chapter": "Chapter X: Chapter Title"
  }
}
```

## How It Works

The knowledge base is used by the `useKnowledgeBase` hook in `knowledge-service.ts` to:

1. Load all concept entries when the app starts
2. Search for relevant concepts based on user queries
3. Format concepts for conversation without verbatim copying
4. Provide related concepts for deeper exploration

The `useMulfaSubagent` hook in `prompt-agent.ts` integrates this knowledge into conversations by:

1. Searching for concepts relevant to the user's query
2. Adding contextual knowledge to the system prompt
3. Formatting the final prompt for the AI service

## Expanding the Knowledge Base

To expand the knowledge base:

1. Add more concept entries in each category
2. Create new subcategories as needed
3. Ensure concepts are interconnected through `related_concepts`
4. Focus on principles, frameworks, and examples rather than exact text

Remember that the goal is to understand and articulate the concepts in a conversational context, not to reproduce the original text verbatim.