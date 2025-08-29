import type { RawLog } from './types';
import { addSeconds } from 'date-fns';

const apps = ['Code', 'Google Chrome', 'Slack', 'Figma', 'Spotify', 'Terminal', 'iTerm2', 'WebStorm', 'Notion', 'Obsidian'];
const titles = ['/src/app/page.tsx - clarity-scope', 'ClarityScope - Digital Health Monitor - Google Chrome', 'general - Slack', 'Design System - Figma', 'Lo-fi Beats', 'npm run dev', 'New Project', 'User Research Notes'];

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateLogEntry(timestamp: Date): RawLog {
  const backspaceCount = Math.floor(getRandom(0, 5));
  return {
    timestamp,
    appName: apps[Math.floor(Math.random() * apps.length)],
    windowTitle: titles[Math.floor(Math.random() * titles.length)],
    mouseMovement: Math.floor(getRandom(0, 500)),
    clicks: Math.floor(getRandom(0, 20)),
    keystrokes: Math.floor(getRandom(0, 100)),
    backspaceCount,
  };
}

export function generateDailyRawLogs(startDate: Date, hours: number = 8): RawLog[] {
  const logs: RawLog[] = [];
  const totalSeconds = hours * 60 * 60;
  
  for (let i = 0; i < totalSeconds; i++) {
    const timestamp = addSeconds(startDate, i);
    // Simulate work hours (more activity during 9-5)
    const hour = timestamp.getHours();
    if (hour >= 9 && hour < 17) {
        logs.push(generateLogEntry(timestamp));
    } else {
        // Simulate less activity outside work hours
        if(Math.random() < 0.1) {
            logs.push({
                ...generateLogEntry(timestamp),
                mouseMovement: Math.floor(getRandom(0, 50)),
                clicks: Math.floor(getRandom(0, 2)),
                keystrokes: Math.floor(getRandom(0, 10)),
            });
        }
    }
  }

  return logs;
}
