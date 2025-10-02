import { z } from 'zod';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

/**
 * Schema-safe LLM wrapper with validation and retry
 * 
 * Features:
 * - Structured outputs with Zod schemas
 * - Exponential backoff retry (3 attempts: 1s, 2s, 4s)
 * - Temperature controls (0.15 for planning, 0.5 for synthesis)
 * - GPT-4o-mini model
 */

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// Lazy-initialize OpenAI client to ensure env vars are loaded
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  const delays = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = attempt === maxAttempts - 1;
      
      if (isLastAttempt) {
        console.error(`LLM call failed after ${maxAttempts} attempts:`, error.message);
        throw new Error(`LLM request failed: ${error.message}`);
      }
      
      const delay = delays[attempt];
      console.log(`LLM call failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw new Error('Retry logic error'); // Should never reach here
}

/**
 * Call LLM with structured output using Zod schema
 * 
 * @param prompt - User prompt
 * @param schema - Zod schema for response validation
 * @param options - LLM options (temperature, maxTokens, systemPrompt)
 * @returns Parsed response matching schema type
 */
export async function callLLM<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  options: LLMOptions = {}
): Promise<T> {
  const {
    temperature = 0.2,
    maxTokens = 1000,
    systemPrompt = 'You are a helpful assistant.',
  } = options;

  return withRetry(async () => {
    const openai = getOpenAIClient();
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: zodResponseFormat(schema, 'response'),
    });

    const parsed = response.choices[0].message.parsed;
    
    if (!parsed) {
      throw new Error('Failed to parse LLM response');
    }

    return parsed;
  });
}

/**
 * Generate text completion without structured output
 * 
 * @param prompt - User prompt
 * @param options - LLM options (temperature, maxTokens, systemPrompt)
 * @returns Generated text
 */
export async function generateCompletion(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const {
    temperature = 0.5,
    maxTokens = 2000,
    systemPrompt = 'You are a helpful assistant.',
  } = options;

  return withRetry(async () => {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    return content;
  });
}

/**
 * Generate streaming text completion
 * 
 * @param prompt - User prompt
 * @param options - LLM options (temperature, maxTokens, systemPrompt)
 * @returns Generated text (awaits full completion)
 */
export async function generateStreamingCompletion(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const {
    temperature = 0.5,
    maxTokens = 2000,
    systemPrompt = 'You are a helpful assistant.',
  } = options;

  return withRetry(async () => {
    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
      }
    }

    if (!fullContent) {
      throw new Error('Empty response from LLM');
    }

    return fullContent;
  });
}

