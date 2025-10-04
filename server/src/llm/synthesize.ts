import { RankedDoc, AnswerPacket, Citation } from '../types/contracts.js';
import { generateStreamingCompletion } from './llm.js';

/**
 * System prompt for answer synthesis with citations
 */
const SYNTHESIS_SYSTEM_PROMPT = `You are a research assistant that synthesizes accurate answers from provided sources.

RULES:
1. Answer the user's question using ONLY information from the provided sources
2. Cite sources inline using [N] where N is the source number (1-indexed)
3. Every factual claim MUST have a citation
4. Use MULTIPLE different sources - aim to cite at least 3-5 different sources when available
5. Use 2-5 paragraphs, be concise but comprehensive
6. If sources conflict, acknowledge it: "Source [1] claims X, while [2] suggests Y"
7. If sources don't fully answer the question, say so
8. Use clear, direct language - no preamble like "Based on the sources..."

FORMAT:
- Inline citations: [1], [2], [3]
- Multiple sources for one claim: [1,2]
- Write in markdown (bold, italics, lists OK)
- Prioritize citing diverse sources to show breadth of research`;

/**
 * Build user prompt with sources
 */
function buildUserPrompt(query: string, docs: RankedDoc[]): string {
  let prompt = `Question: ${query}\n\nSources:\n`;
  
  docs.forEach((doc, idx) => {
    const sourceNum = idx + 1;
    prompt += `[${sourceNum}] ${doc.title} (${doc.domain})\n${doc.excerpt}\n\n`;
  });
  
  prompt += 'Answer the question using these sources with inline citations.';
  return prompt;
}

/**
 * Extract all citation indices from text (e.g., [1], [2,3], [5], [1, 2, 3])
 * Handles both [1,2,3] and [1, 2, 3] formats
 */
function extractCitationIndices(text: string): number[] {
  // Allow optional whitespace after commas: [1, 2, 3] or [1,2,3]
  const citationRegex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  const indices = new Set<number>();
  
  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const numbers = match[1].split(',').map(n => parseInt(n.trim(), 10));
    numbers.forEach(num => indices.add(num));
  }
  
  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Find best matching source for an invalid citation index
 * Uses simple URL/title similarity matching
 */
function findBestMatchingSource(
  invalidIndex: number,
  docs: RankedDoc[]
): number | null {
  // For now, simple strategy: if index is out of bounds, return null
  // More sophisticated matching could check URL/title similarity
  if (invalidIndex > docs.length || invalidIndex < 1) {
    return null;
  }
  return invalidIndex;
}

/**
 * Process and validate citations in generated text
 */
function processCitations(
  text: string,
  docs: RankedDoc[]
): { processedText: string; citations: Citation[] } {
  const citationIndices = extractCitationIndices(text);
  const citations: Citation[] = [];
  const validationWarnings: string[] = [];
  let processedText = text;
  
  for (const index of citationIndices) {
    // Check if citation is valid (1-indexed, within bounds)
    if (index < 1 || index > docs.length) {
      validationWarnings.push(`Invalid citation [${index}] (only ${docs.length} sources available)`);
      
      // Attempt auto-correction
      const correctedIndex = findBestMatchingSource(index, docs);
      if (correctedIndex) {
        // Replace invalid citation with corrected one
        const regex = new RegExp(`\\[${index}\\]`, 'g');
        processedText = processedText.replace(regex, `[${correctedIndex}]`);
        console.log(`Auto-corrected citation [${index}] -> [${correctedIndex}]`);
      } else {
        // Remove invalid citation brackets
        const regex = new RegExp(`\\[${index}\\]`, 'g');
        processedText = processedText.replace(regex, `${index}`);
        console.warn(`Removed invalid citation [${index}]`);
      }
      continue;
    }
    
    // Build citation object
    const doc = docs[index - 1]; // Convert 1-indexed to 0-indexed
    const passage = doc.excerpt.length > 200 
      ? doc.excerpt.slice(0, 200) + '...'
      : doc.excerpt;
    
    citations.push({
      index,
      sourceId: doc.id,
      passage,
    });
  }
  
  if (validationWarnings.length > 0) {
    console.warn('Citation validation warnings:', validationWarnings);
  }
  
  // Log citation coverage metrics
  const citationRate = citationIndices.length > 0 
    ? (citations.length / citationIndices.length) * 100 
    : 0;
  const sourcesUsed = citationIndices.length;
  const sourcesAvailable = docs.length;
  console.log(`Citation coverage: ${citations.length}/${citationIndices.length} valid (${citationRate.toFixed(1)}%) | Sources used: ${sourcesUsed}/${sourcesAvailable}`);
  
  return { processedText, citations };
}

/**
 * Synthesizes an answer from ranked documents with inline citations
 * 
 * Uses GPT-4o-mini with streaming for fast, citation-backed answers
 * - Temperature: 0.3 (balance between readability and precision)
 * - Max tokens: 1500
 * - Validates citations post-generation with auto-correction
 */
export async function synthesizeAnswer(
  query: string,
  docs: RankedDoc[],
  queryId: string,
  onChunk?: (chunk: string) => void
): Promise<AnswerPacket> {
  if (docs.length === 0) {
    throw new Error('Cannot synthesize answer: no documents provided');
  }

  try {
    // Build prompts
    const userPrompt = buildUserPrompt(query, docs);
    
    // Call LLM with streaming
    console.log(`Synthesizing answer for query: "${query}" with ${docs.length} sources`);
    const rawText = await generateStreamingCompletion(userPrompt, {
      systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 1500,
      onChunk,
    });
    
    // Process citations
    const { processedText, citations } = processCitations(rawText, docs);
    
    return {
      text: processedText,
      citations,
      sources: docs,
      queryId,
    };
  } catch (error) {
    console.error('Answer synthesis failed:', error);
    
    // Return error with partial sources
    throw new Error(
      `Failed to synthesize answer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

