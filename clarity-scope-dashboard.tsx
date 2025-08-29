"use client";

import type { FC } from 'react';
import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Zap,
  Info,
  Settings,
  X,
  Plus,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { DashboardData, MetricPoint, RawLog } from '@/lib/types';
import { calculateMetrics } from '@/lib/metrics';
import { ClarityScopeLogo } from './icons';
import { generateInsight } from '@/ai/flows/personalized-insights';
import { analyzeDailyData } from '@/lib/pre-analysis';
import { subDays, startOfDay } from 'date-fns';
import { UploadDataButton } from './upload-data-button';

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}

const ScoreCard: FC<ScoreCardProps> = ({ title, score, icon, color }) => {
  const data = [
    { name: 'score', value: score },
    { name: 'remaining', value: 100 - score },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="relative flex h-40 w-full items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="90%"
                startAngle={90}
                endAngle={450}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={color} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tracking-tighter">
              {Math.round(score)}
            </span>
            <span className="text-xs text-muted-foreground">out of 100</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TrendsChartProps {
  data: MetricPoint[];
}

const TrendsChart: FC<TrendsChartProps> = ({ data }) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Daily Trends</CardTitle>
        <CardDescription>
          Focus and Stress scores throughout the day.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
              labelFormatter={(label) => new Date(label).toLocaleTimeString()}
            />
            <Line
              type="monotone"
              dataKey="focusScore"
              name="Focus"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="stressScore"
              name="Stress"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface SettingsDialogProps {
  productiveApps: string[];
  setProductiveApps: (apps: string[]) => void;
}

const SettingsDialog: FC<SettingsDialogProps> = ({ productiveApps, setProductiveApps }) => {
  const [newApp, setNewApp] = useState('');

  const handleAddApp = () => {
    if (newApp && !productiveApps.includes(newApp)) {
      setProductiveApps([...productiveApps, newApp]);
      setNewApp('');
    }
  };

  const handleRemoveApp = (appToRemove: string) => {
    setProductiveApps(productiveApps.filter((app) => app !== appToRemove));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Productive Applications</DialogTitle>
          <DialogDescription>
            Manage the list of applications you consider productive. This affects your Focus Score.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {productiveApps.map((app) => (
              <Badge key={app} variant="secondary" className="pl-3 pr-1">
                {app}
                <Button variant="ghost" size="icon" className="ml-1 h-4 w-4" onClick={() => handleRemoveApp(app)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              placeholder="e.g., Figma"
              onKeyDown={(e) => e.key === 'Enter' && handleAddApp()}
            />
            <Button onClick={handleAddApp}><Plus className="mr-2 h-4 w-4" /> Add</Button>
          </div>
        </div>
        <DialogFooter>
          <p className="text-xs text-muted-foreground">Changes are saved automatically.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function ClarityScopeDashboard({ initialData }: { initialData: DashboardData }) {
  const { toast } = useToast();
  const [productiveApps, setProductiveApps] = useState<string[]>(initialData.productiveApps);
  const [rawLogs, setRawLogs] = useState<RawLog[]>(initialData.rawLogs);
  const [insights, setInsights] = useState({ dailyInsight: '', weeklyInsight: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedApps = localStorage.getItem('productiveApps');
    if (storedApps) {
      setProductiveApps(JSON.parse(storedApps));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('productiveApps', JSON.stringify(productiveApps));
  }, [productiveApps]);
  
  const { metrics, dailySummary } = useMemo(() => {
    return calculateMetrics(rawLogs, productiveApps);
  }, [rawLogs, productiveApps]);

  useEffect(() => {
    const generateNewInsights = async () => {
      setIsLoading(true);
      if (metrics.length > 0) {
        try {
          // Generate data for the last week to calculate averages
          const today = new Date();
          const lastWeekStartDate = startOfDay(subDays(today, 7));
          const lastWeekLogs = rawLogs.filter(l => new Date(l.timestamp) > lastWeekStartDate);
          const { weeklyAverage: lastWeekFocusScoreAverage } = calculateMetrics(lastWeekLogs, productiveApps);
          const weeklyFocusScoreAverage = dailySummary.weeklyAverage.focus;
          
          const dailyAnalysis = analyzeDailyData(metrics);

          const aiInput = {
            ...dailyAnalysis,
            weeklyFocusScoreAverage: weeklyFocusScoreAverage,
            lastWeekFocusScoreAverage: lastWeekFocusScoreAverage.focus,
          };

          const newInsights = await generateInsight(aiInput);
          setInsights(newInsights);
        } catch (error) {
          console.error("Failed to generate insights:", error);
          setInsights({ dailyInsight: 'Could not generate daily insight.', weeklyInsight: 'Could not generate weekly insight.' });
          toast({
            variant: "destructive",
            title: "AI Insight Failed",
            description: "There was an error generating AI insights. Please check your API key and try again.",
          });
        }
      } else {
        setInsights({ dailyInsight: 'Not enough data for insights.', weeklyInsight: 'Not enough data for insights.' });
      }
      setIsLoading(false);
    };

    generateNewInsights();
  }, [metrics, dailySummary.weeklyAverage.focus, productiveApps, toast]);


  const { current, weeklyAverage } = dailySummary;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <ClarityScopeLogo className="h-6 w-6 text-primary" />
          <span className="">ClarityScope</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <UploadDataButton onDataUploaded={setRawLogs} />
          <SettingsDialog productiveApps={productiveApps} setProductiveApps={setProductiveApps} />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold md:text-3xl">Your Daily Dashboard</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <ScoreCard
                title="Live Focus"
                score={current.focus}
                icon={<BrainCircuit className="h-4 w-4 text-muted-foreground" />}
                color="hsl(var(--chart-1))"
              />
              <ScoreCard
                title="Live Stress"
                score={current.stress}
                icon={<Zap className="h-4 w-4 text-muted-foreground" />}
                color="hsl(var(--chart-2))"
              />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Focus Avg.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{Math.round(weeklyAverage.focus)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Stress Avg.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{Math.round(weeklyAverage.stress)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
             <TrendsChart data={metrics} />

            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Personalized Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <p className='text-sm text-muted-foreground'>Generating insights...</p> : (
                  <>
                    <div>
                      <h4 className="font-semibold">Daily Insight</h4>
                      <p className="text-sm text-muted-foreground">{insights.dailyInsight}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Weekly Insight</h4>
                      <p className="text-sm text-muted-foreground">{insights.weeklyInsight}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-start gap-4">
              <Info className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
              <div>
                <CardTitle className="text-primary">Your Data is Yours</CardTitle>
                <CardDescription className="text-primary/80">
                  All processing happens on your machine. Nothing is ever sent to the cloud. This web demo uses simulated data to showcase functionality.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
