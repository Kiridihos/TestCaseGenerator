
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This file now configures Genkit to use only Google AI (Gemini).
// The provider is determined by the GOOGLE_API_KEY environment variable.
// If the key is present, it will be used.
// If not, Genkit will fall back to Application Default Credentials (ADC),
// which is useful for managed environments like Firebase App Hosting.

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});

console.log('Genkit initialized successfully with provider: google');

// Export the configured 'ai' instance for use in flows.
export {ai};
