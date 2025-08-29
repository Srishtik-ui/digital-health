export interface RawLog {
  timestamp: Date;
  appName: string;
  windowTitle: string; // Sanitized
  mouseMovement: number; // pixels
  clicks: number;
  keystrokes: number;
  backspaceCount: number;
}

export interface MetricPoint {
  timestamp: Date;
  focusScore: number;
  stressScore: number;
}

export interface DailySummary {
  current: {
    focus: number;
    stress: number;
  };
  weeklyAverage: {
    focus: number;
    stress: number;
  };
  headline: string;
}

export interface DashboardData {
  rawLogs: RawLog[];
  productiveApps: string[];
}
