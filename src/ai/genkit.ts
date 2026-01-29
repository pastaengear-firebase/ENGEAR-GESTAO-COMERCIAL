// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin.
// This `ai` object will be used to define flows, prompts, and models.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
