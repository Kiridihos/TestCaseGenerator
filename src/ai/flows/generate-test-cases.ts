'use server';

/**
 * @fileOverview A test case generation AI agent.
 *
 * - generateTestCases - A function that handles the test case generation process.
 * - GenerateTestCasesInput - The input type for the generateTestCases function.
 * - GenerateTestCasesOutput - The return type for the generateTestCases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTestCasesInputSchema = z.object({
  title: z.string().describe('The title of the user story.'),
  description: z.string().describe('The description of the user story.'),
  acceptanceCriteria: z
    .string()
    .describe('The acceptance criteria for the user story.'),
});
export type GenerateTestCasesInput = z.infer<typeof GenerateTestCasesInputSchema>;

const GenerateTestCasesOutputSchema = z.object({
  testCases: z
    .array(z.string())
    .describe('An array of test cases generated from the user story.'),
});
export type GenerateTestCasesOutput = z.infer<typeof GenerateTestCasesOutputSchema>;

export async function generateTestCases(
  input: GenerateTestCasesInput
): Promise<GenerateTestCasesOutput> {
  return generateTestCasesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestCasesPrompt',
  input: {schema: GenerateTestCasesInputSchema},
  output: {schema: GenerateTestCasesOutputSchema},
  prompt: `You are an expert test case generator. Based on the user story details provided, generate a comprehensive set of test cases to ensure that the acceptance criteria are met.  Each test case must be detailed enough for a QA engineer to implement it, including steps and expected results.\n\nUser Story Title: {{{title}}}\nUser Story Description: {{{description}}}\nAcceptance Criteria: {{{acceptanceCriteria}}}\n\nTest Cases:`,
});

const generateTestCasesFlow = ai.defineFlow(
  {
    name: 'generateTestCasesFlow',
    inputSchema: GenerateTestCasesInputSchema,
    outputSchema: GenerateTestCasesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
