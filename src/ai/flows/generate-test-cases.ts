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
    .describe('An array of test cases generated from the user story, in Spanish.'),
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
  prompt: `Eres un experto generador de casos de prueba. Basándote en los detalles de la historia de usuario proporcionados, genera un conjunto completo de casos de prueba EN ESPAÑOL para asegurar que se cumplan los criterios de aceptación. Cada caso de prueba debe ser lo suficientemente detallado para que un ingeniero de QA pueda implementarlo, incluyendo pasos y resultados esperados. Los casos de prueba deben estar exclusivamente en idioma ESPAÑOL.\n\nTítulo de la Historia de Usuario: {{{title}}}\nDescripción de la Historia de Usuario: {{{description}}}\nCriterios de Aceptación: {{{acceptanceCriteria}}}\n\nCasos de Prueba (en ESPAÑOL):`,
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
