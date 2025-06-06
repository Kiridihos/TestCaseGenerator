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

const TestCaseStepSchema = z.object({
  action: z.string().describe('La acción detallada a realizar para este paso de prueba.'),
  expectedResult: z.string().describe('El resultado esperado después de realizar la acción de este paso.')
});

const TestCaseSchema = z.object({
  title: z.string().describe('Un título conciso y descriptivo para este caso de prueba específico (ej: "Verificar inicio de sesión con credenciales válidas"). Debe ser único entre los casos de prueba generados para la misma historia.'),
  description: z.string().describe('Una breve descripción del propósito o resumen de este caso de prueba específico.'),
  steps: z.array(TestCaseStepSchema).min(1).describe('Una lista de pasos detallados para ejecutar el caso de prueba, cada uno con una acción y un resultado esperado.')
});
export type TestCase = z.infer<typeof TestCaseSchema>;

const GenerateTestCasesOutputSchema = z.object({
  testCases: z
    .array(TestCaseSchema)
    .describe('Un array de casos de prueba generados a partir de la historia de usuario, en ESPAÑOL. Cada caso de prueba debe tener un título, una descripción y una lista de pasos.'),
});
export type GenerateTestCasesOutput = z.infer<typeof GenerateTestCasesOutputSchema>;

export async function generateTestCases(
  input: GenerateTestCasesInput
): Promise<GenerateTestCasesOutput> {
  // Asegurarnos de que el output no sea null, sino un array vacío si no hay test cases.
  const result = await generateTestCasesFlow(input);
  return result || { testCases: [] };
}

const prompt = ai.definePrompt({
  name: 'generateTestCasesPrompt',
  input: {schema: GenerateTestCasesInputSchema},
  output: {schema: GenerateTestCasesOutputSchema},
  prompt: `Eres un experto generador de casos de prueba. Basándote en los detalles de la historia de usuario proporcionados, genera un conjunto completo de casos de prueba EN ESPAÑOL para asegurar que se cumplan los criterios de aceptación.
Cada caso de prueba debe ser un objeto con los siguientes campos:
- title: Un título breve y descriptivo para este caso de prueba específico (ej: "Verificar inicio de sesión con credenciales válidas"). Este título debe ser conciso.
- description: Una breve descripción o resumen del propósito de este caso de prueba.
- steps: Un array de objetos, donde cada objeto representa un paso de prueba y tiene los campos:
    - action: La acción detallada a realizar.
    - expectedResult: El resultado esperado después de realizar la acción.

Asegúrate de que todos los textos estén exclusivamente en idioma ESPAÑOL. Los pasos de prueba (action y expectedResult) deben ser claros y directos.

Historia de Usuario:
Título: {{{title}}}
Descripción: {{{description}}}
Criterios de Aceptación: {{{acceptanceCriteria}}}

Casos de Prueba (en ESPAÑOL, siguiendo la estructura JSON especificada en el esquema de salida):`,
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
