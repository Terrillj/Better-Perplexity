import { z } from 'zod';
import { callLLM } from '../llm/llm.js';

/**
 * Content Features Schema
 * 
 * Semantic features extracted from content for personalized ranking.
 * Each dimension captures different aspects of writing style and complexity.
 */
export const ContentFeaturesSchema = z.object({
  depth: z.enum(['introductory', 'intermediate', 'expert']),
  style: z.enum(['academic', 'technical', 'journalistic', 'conversational']),
  format: z.enum(['tutorial', 'research', 'opinion', 'reference']),
  approach: z.enum(['conceptual', 'practical', 'data-driven']),
  density: z.enum(['concise', 'moderate', 'comprehensive']),
});

export type ContentFeatures = z.infer<typeof ContentFeaturesSchema>;

/**
 * Default neutral features for error fallback
 */
const DEFAULT_FEATURES: ContentFeatures = {
  depth: 'intermediate',
  style: 'journalistic',
  format: 'reference',
  approach: 'practical',
  density: 'moderate',
};

/**
 * System prompt for feature extraction
 */
const SYSTEM_PROMPT = `You are an expert content analyzer that tags web articles with semantic features for personalized search ranking.

Your task is to analyze content and classify it across 5 dimensions:
1. **depth**: The technical/expertise level (introductory, intermediate, expert)
2. **style**: The writing style (academic, technical, journalistic, conversational)
3. **format**: The content type (tutorial, research, opinion, reference)
4. **approach**: The presentation method (conceptual, practical, data-driven)
5. **density**: Information density (concise, moderate, comprehensive)

Analyze carefully and choose the BEST fitting tag for each dimension based on the content's primary characteristics.`;

/**
 * Few-shot examples for consistent tagging
 */
const FEW_SHOT_EXAMPLES = `
Example 1:
Title: "Getting Started with React Hooks"
Content: "React Hooks let you use state and other React features without writing a class. In this guide, we'll walk through useState step by step with simple examples..."
Tags: {depth: "introductory", style: "conversational", format: "tutorial", approach: "practical", density: "moderate"}
Reasoning: Beginner-focused tutorial with practical examples and friendly tone.

Example 2:
Title: "Optimizing React Rendering Performance: A Deep Dive"
Content: "We benchmarked 15 optimization strategies using React Profiler. Results show memoization reduces renders by 73% in list scenarios (p<0.01)..."
Tags: {depth: "expert", style: "technical", format: "research", approach: "data-driven", density: "comprehensive"}
Reasoning: Expert-level analysis with quantitative data and detailed findings.

Example 3:
Title: "Why TypeScript Won Over JavaScript"
Content: "After five years of both languages, I believe TypeScript's type safety fundamentally changes how we think about code quality..."
Tags: {depth: "intermediate", style: "conversational", format: "opinion", approach: "conceptual", density: "concise"}
Reasoning: Personal perspective with conceptual arguments, assumes some background knowledge.
`;

/**
 * Extract content features using LLM analysis
 * 
 * @param content - The full text content to analyze
 * @param title - The article title for additional context
 * @returns Promise resolving to ContentFeatures object
 * 
 * @example
 * const features = await extractContentFeatures(
 *   "React is a JavaScript library for building user interfaces...",
 *   "Introduction to React"
 * );
 * // Expected: { depth: "introductory", style: "conversational", ... }
 */
export async function extractContentFeatures(
  content: string,
  title: string
): Promise<ContentFeatures> {
  try {
    // Truncate content to first 1500 characters for efficiency
    const truncatedContent = content.slice(0, 1500);
    
    // Build user prompt with context and examples
    const userPrompt = `${FEW_SHOT_EXAMPLES}

Now analyze this content:

Title: "${title}"
Content: "${truncatedContent}"

Provide the 5 semantic feature tags as a structured response.`;

    // Call LLM with low temperature for consistent tagging
    const features = await callLLM(
      userPrompt,
      ContentFeaturesSchema,
      {
        systemPrompt: SYSTEM_PROMPT,
        temperature: 0.1,
        maxTokens: 150,
      }
    );

    return features;
  } catch (error: any) {
    console.error('Feature extraction failed:', error.message);
    console.log(`Falling back to default features for: "${title}"`);
    
    // Return neutral default features on error
    return DEFAULT_FEATURES;
  }
}

/*
 * VALIDATION TESTS (for reference)
 * 
 * Test 1: Technical tutorial
 * Input: "Building a REST API with Node.js", "Learn how to create endpoints using Express..."
 * Expected: {depth: "introductory", style: "technical", format: "tutorial", approach: "practical", density: "moderate"}
 * 
 * Test 2: Academic paper
 * Input: "Neural Network Optimization", "We present a novel approach to gradient descent optimization..."
 * Expected: {depth: "expert", style: "academic", format: "research", approach: "data-driven", density: "comprehensive"}
 * 
 * Test 3: Blog opinion
 * Input: "Is Remote Work Dead?", "Companies are forcing return-to-office, but I think they're wrong..."
 * Expected: {depth: "intermediate", style: "conversational", format: "opinion", approach: "conceptual", density: "concise"}
 */

