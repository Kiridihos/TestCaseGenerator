import { config } from 'dotenv';

// This line ensures that environment variables from 'workspace/.env' are loaded for the Genkit server.
config({ path: 'workspace/.env' });

import '@/ai/flows/generate-test-cases.ts';
import '@/ai/flows/summarize-acceptance-criteria.ts';
