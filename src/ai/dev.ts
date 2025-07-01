// This file is the entry point for the Genkit development server.
// It imports the flows that you want to be available in the development UI.
//
// By default, Next.js will automatically load environment variables from the root .env file
// for both the Next.js app and external tools like Genkit, so no extra configuration is needed here.

import '@/ai/flows/generate-test-cases.ts';
import '@/ai/flows/summarize-acceptance-criteria.ts';
