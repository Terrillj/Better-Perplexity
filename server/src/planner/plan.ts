import { QueryPlan, QueryPlanSchema } from '../types/contracts.js';
import { callLLM } from '../llm/llm.js';
import { z } from 'zod';

/**
 * Creates a query plan by decomposing the query into 2-5 focused search sub-queries
 * 
 * Uses LLM with few-shot examples to generate comprehensive sub-queries
 * Temperature: 0.15 for predictable, focused plans
 */
export async function createQueryPlan(query: string): Promise<QueryPlan> {
  const systemPrompt = `You are a query planning expert. Decompose user queries into 2-5 focused search sub-queries that will find comprehensive answers.

Guidelines:
- Generate 2-5 sub-queries (depending on complexity)
- Each sub-query should target a specific aspect or perspective
- Include relevant date ranges when appropriate (e.g., 2023-2025, 1690-1715)
- Add domain hints for authoritative sources (.edu, .gov, .org) when relevant
- Make sub-queries specific enough to be useful but not so narrow they miss information`;

  const fewShotExamples = `EXAMPLE 1:
Query: "What caused the 2008 financial crisis?"
Sub-queries:
- 2008 financial crisis causes overview
- subprime mortgage securitization explanation (CDO, MBS)
- lehman brothers collapse timeline 2008
- role of credit default swaps (AIG) analysis
- regulatory context (glass-steagall repeal, 1999) .edu

EXAMPLE 2:
Query: "Do GLP-1 weight-loss drugs reduce heart-attack risk?"
Sub-queries:
- GLP-1 cardiovascular outcomes trial summary 2023–2025
- semaglutide MACE reduction randomized trial
- tirzepatide CVOT publication status
- adverse events GLP-1 long-term safety .gov .edu

EXAMPLE 3:
Query: "Best open-source vector DBs for a local RAG prototype?"
Sub-queries:
- open source vector database comparison (faiss, qdrant, milvus)
- ingestion + indexing speed benchmarks 2024–2025
- ANN search HNSW vs IVF explanations
- local deployment (docker, memory footprint)

EXAMPLE 4:
Query: "Was there piracy operating out of Barbados c. 1690–1715?"
Sub-queries:
- barbados privateers piracy 1690–1715 historical records
- caribbean piracy hubs (port royal, tortuga) relation to barbados
- british admiralty court barbados cases 1700s .edu archives

EXAMPLE 5:
Query: "How do I elect S-Corp status for a solo founder in NC?"
Sub-queries:
- form 2553 s corp election single owner timeline
- north carolina s corp requirements and state filing
- reasonable compensation s corp guidance 2024–2025 .gov

Now generate sub-queries for the user's query.`;

  const prompt = `${fewShotExamples}

User Query: "${query}"

Generate 2-5 focused sub-queries for this query. Return ONLY the sub-queries as a JSON array of strings.`;

  // Define a simple schema for the sub-queries array
  const SubQueriesSchema = z.object({
    subQueries: z.array(z.string()).min(2).max(5),
  });

  try {
    const result = await callLLM(prompt, SubQueriesSchema, {
      temperature: 0.15,
      maxTokens: 400,
      systemPrompt,
    });

    // Validate and construct the QueryPlan
    const plan: QueryPlan = {
      originalQuery: query,
      subQueries: result.subQueries.slice(0, 5), // Ensure max 5
      strategy: 'llm',
    };

    // Additional validation using QueryPlanSchema
    return QueryPlanSchema.parse(plan);
  } catch (error: any) {
    console.error('Query planning failed:', error.message);
    
    // Fallback to single query if LLM fails
    return {
      originalQuery: query,
      subQueries: [query],
      strategy: 'fallback',
    };
  }
}

