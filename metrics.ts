import type { RawLog, MetricPoint, DailySummary } from './types';
import { getMinutes, startOfMinute } from 'date-fns';

const METRIC_CALCULATION_WINDOW_MINUTES = 10;
const MAX_SWITCHES_PER_HOUR = 60; // A plausible maximum for normalization

export function getDefaultProductiveApps(): string[] {
  return ['Code', 'WebStorm', 'Figma', 'Terminal', 'iTerm2', 'Obsidian', 'Notion'];
}

function calculateStandardDeviation(arr: number[]): number {
  const n = arr.length;
  if (n === 0) return 0;
  const mean = arr.reduce((a, b) => a + b) / n;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

export function calculateMetrics(logs: RawLog[], productiveApps: string[]): { metrics: MetricPoint[], dailySummary: DailySummary, weeklyAverage: { focus: number, stress: number } } {
  const metrics: MetricPoint[] = [];
  if (logs.length === 0) {
    const defaultSummary = { 
        current: { focus: 0, stress: 0 }, 
        weeklyAverage: { focus: 0, stress: 0 }, 
        headline: "Not enough data for a summary."
    };
    return { metrics: [], dailySummary: defaultSummary, weeklyAverage: { focus: 0, stress: 0 } };
  }

  const firstLogTime = logs[0].timestamp;
  const lastLogTime = logs[logs.length - 1].timestamp;
  let currentTime = firstLogTime;

  while (currentTime <= lastLogTime) {
    const windowEndTime = new Date(currentTime.getTime() + METRIC_CALCULATION_WINDOW_MINUTES * 60 * 1000);
    const windowLogs = logs.filter(log => log.timestamp >= currentTime && log.timestamp < windowEndTime);

    if (windowLogs.length > 0) {
      // Focus Score Calculation
      const appSwitches = windowLogs.reduce((acc, log, index) => {
        if (index > 0 && log.appName !== windowLogs[index - 1].appName) {
          return acc + 1;
        }
        return acc;
      }, 0);
      const appSwitchesPerHour = appSwitches * (60 / METRIC_CALCULATION_WINDOW_MINUTES);

      const timeInProductiveApps = windowLogs.filter(log => productiveApps.includes(log.appName)).length;
      const totalTime = windowLogs.length;
      const productiveRatio = totalTime > 0 ? timeInProductiveApps / totalTime : 0;
      
      const focusScore = ((1 - (appSwitchesPerHour / MAX_SWITCHES_PER_HOUR)) * 0.6 + productiveRatio * 0.4) * 100;

      // Stress Score Calculation
      const keystrokesPerMinute: { [minute: number]: number } = {};
      let totalBackspace = 0;
      let totalKeystrokes = 0;
      let totalMouseMovement = 0;

      windowLogs.forEach(log => {
        const minute = getMinutes(log.timestamp);
        if (!keystrokesPerMinute[minute]) {
          keystrokesPerMinute[minute] = 0;
        }
        keystrokesPerMinute[minute] += log.keystrokes;
        totalBackspace += log.backspaceCount;
        totalKeystrokes += log.keystrokes;
        totalMouseMovement += log.mouseMovement;
      });

      const keystrokeVariance = calculateStandardDeviation(Object.values(keystrokesPerMinute));
      const backspaceRatio = totalKeystrokes > 0 ? totalBackspace / totalKeystrokes : 0;
      const mouseSpeed = totalMouseMovement / totalTime; // pixels per second

      // Normalize and combine for stress score
      const keystrokeFactor = Math.min(keystrokeVariance / 50, 1); // 50 is an arbitrary normalization factor
      const mouseSpeedFactor = Math.min(mouseSpeed / 1000, 1); // 1000px/s is fast

      const stressScore = Math.min((keystrokeFactor * 0.5 + backspaceRatio * 0.3 + mouseSpeedFactor * 0.2) * 100, 100);

      metrics.push({
        timestamp: currentTime,
        focusScore: Math.max(0, Math.min(100, focusScore)),
        stressScore: Math.max(0, Math.min(100, stressScore)),
      });
    }

    currentTime = windowEndTime;
  }

  const totalFocus = metrics.reduce((sum, m) => sum + m.focusScore, 0);
  const totalStress = metrics.reduce((sum, m) => sum + m.stressScore, 0);
  const avgFocus = metrics.length > 0 ? totalFocus / metrics.length : 0;
  const avgStress = metrics.length > 0 ? totalStress / metrics.length : 0;

  const currentFocus = metrics.length > 0 ? metrics[metrics.length - 1].focusScore : 0;
  const currentStress = metrics.length > 0 ? metrics[metrics.length - 1].stressScore : 0;

  const dailySummary: DailySummary = {
    current: {
        focus: Math.round(currentFocus),
        stress: Math.round(currentStress)
    },
    weeklyAverage: {
        focus: Math.round(avgFocus),
        stress: Math.round(avgStress)
    },
    headline: `Focus at ${Math.round(avgFocus)}%, Stress at ${Math.round(avgStress)}% today.`
  };
  
  return { metrics, dailySummary, weeklyAverage: {focus: avgFocus, stress: avgStress } };
}
