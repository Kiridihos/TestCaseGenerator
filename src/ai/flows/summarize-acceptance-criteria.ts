'use server';
/**
 * @fileOverview Summarizes the acceptance criteria of a user story.
 *
 * - summarizeAcceptanceCriteria - A function that summarizes acceptance criteria.
 * - SummarizeAcceptanceCriteriaInput - The input type for the summarizeAcceptanceCriteria function.
 * - SummarizeAcceptanceCriteriaOutput - The return type for the summarizeAcceptAcceptanceCriteria function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAcceptanceCriteriaInputSchema = z.object({
  acceptanceCriteria: z
    .string()
    .describe('The acceptance criteria of the user story.'),
});

export type SummarizeAcceptanceCriteriaInput = z.infer<
  typeof SummarizeAcceptanceCriteriaInputSchema
>;

const SummarizeAcceptanceCriteriaOutputSchema = z.object({
  summary: z.string().describe('A summary of the acceptance criteria.'),
});

export type SummarizeAcceptanceCriteriaOutput = z.infer<
  typeof SummarizeAcceptanceCriteriaOutputSchema
>;

export async function summarizeAcceptanceCriteria(
  input: SummarizeAcceptanceCriteriaInput
): Promise<SummarizeAcceptanceCriteriaOutput> {
  return summarizeAcceptanceCriteriaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAcceptanceCriteriaPrompt',
  input: {schema: SummarizeAcceptanceCriteriaInputSchema},
  output: {schema: SummarizeAcceptanceCriteriaOutputSchema},
  prompt: `Summarize the following acceptance criteria:\n\n{{acceptanceCriteria}}`,
});

const summarizeAcceptanceCriteriaFlow = ai.defineFlow(
  {
    name: 'summarizeAcceptanceCriteriaFlow',
    inputSchema: SummarizeAcceptanceCriteriaInputSchema,
    outputSchema: SummarizeAcceptanceCriteriaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
