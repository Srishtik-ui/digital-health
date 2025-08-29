'use server';
/**
 * @fileOverview A personalized insights AI agent.
 *
 * - generateInsight - A function that handles the insight generation process.
 * - PersonalizedInsightsInput - The input type for the generateInsight function.
 * - PersonalizedInsightsOutput - The return type for the generateInsight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedInsightsInputSchema = z.object({
  peakFocusTime: z.string().describe('The time of day when focus was highest.'),
  peakStressTime: z.string().describe('The time of day when stress was highest.'),
  dailyFocusAverage: z.number().describe('The average focus score for the day.'),
  dailyStressAverage: z.number().describe('The average stress score for the day.'),
  weeklyFocusScoreAverage: z.number().describe('The average focus score for the current week.'),
  lastWeekFocusScoreAverage: z.number().describe('The average focus score for the previous week.'),
});
export type PersonalizedInsightsInput = z.infer<typeof PersonalizedInsightsInputSchema>;

const PersonalizedInsightsOutputSchema = z.object({
  dailyInsight: z.string().describe('A plain-English insight for the day.'),
  weeklyInsight: z.string().describe('A plain-English insight for the week.'),
});
export type PersonalizedInsightsOutput = z.infer<typeof PersonalizedInsightsOutputSchema>;

export async function generateInsight(input: PersonalizedInsightsInput): Promise<PersonalizedInsightsOutput> {
  return personalizedInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedInsightsPrompt',
  input: {schema: PersonalizedInsightsInputSchema},
  output: {schema: PersonalizedInsightsOutputSchema},
  prompt: `You are an AI assistant that analyzes focus and stress metrics to provide personalized insights to the user.

  Here's a summary of the user's data for the day:
  Peak Focus Time: {{peakFocusTime}}
  Peak Stress Time: {{peakStressTime}}
  Daily Average Focus: {{dailyFocusAverage}}
  Daily Average Stress: {{dailyStressAverage}}
  
  And here is their weekly data:
  Weekly Focus Score Average: {{weeklyFocusScoreAverage}}
  Last Week Focus Score Average: {{lastWeekFocusScoreAverage}}

  Based on this data, generate a daily insight and a weekly insight.
  The insights should be in plain English and should be actionable.

  Example Daily Insight: "You were most focused around {{peakFocusTime}}, which is great for tackling complex tasks."
  Example Weekly Insight: "Your average focus score this week was 15% higher than last week. Well done!"

  Make sure the insights are concise and easy to understand.`,
});

const personalizedInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedInsightsFlow',
    inputSchema: PersonalizedInsightsInputSchema,
    outputSchema: PersonalizedInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
