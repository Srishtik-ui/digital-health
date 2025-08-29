import type { MetricPoint } from './types';

export interface DailyAnalysis {
  peakFocusTime: string;
  peakStressTime: string;
  dailyFocusAverage: number;
  dailyStressAverage: number;
}

export function analyzeDailyData(metrics: MetricPoint[]): DailyAnalysis {
  if (metrics.length === 0) {
    return {
      peakFocusTime: 'N/A',
      peakStressTime: 'N/A',
      dailyFocusAverage: 0,
      dailyStressAverage: 0,
    };
  }

  let peakFocus = { score: -1, timestamp: new Date() };
  let peakStress = { score: -1, timestamp: new Date() };
  let totalFocus = 0;
  let totalStress = 0;

  for (const metric of metrics) {
    if (metric.focusScore > peakFocus.score) {
      peakFocus = { score: metric.focusScore, timestamp: metric.timestamp };
    }
    if (metric.stressScore > peakStress.score) {
      peakStress = { score: metric.stressScore, timestamp: metric.timestamp };
    }
    totalFocus += metric.focusScore;
    totalStress += metric.stressScore;
  }

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  return {
    peakFocusTime: formatTime(peakFocus.timestamp),
    peakStressTime: formatTime(peakStress.timestamp),
    dailyFocusAverage: totalFocus / metrics.length,
    dailyStressAverage: totalStress / metrics.length,
  };
}
