
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This will prioritize the API key if provided. Otherwise, it falls back to
// Application Default Credentials (ADC), which is used for service accounts
// and in managed environments like Firebase App Hosting.
const googleAiPlugin = googleAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const ai = genkit({
  plugins: [googleAiPlugin],
  model: 'googleai/gemini-2.0-flash',
});

console.log('Google AI (Gemini) plugin initialized.');

// Export the configured 'ai' instance for use in flows.
export {ai};
