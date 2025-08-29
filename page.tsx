import { ClarityScopeDashboard } from '@/components/clarity-scope-dashboard';
import { generateDailyRawLogs } from '@/lib/data';
import { getDefaultProductiveApps } from '@/lib/metrics';
import type { DashboardData } from '@/lib/types';

export default async function Home() {
  const productiveApps = getDefaultProductiveApps();

  // Generate data for today
  const today = new Date();
  const todayLogs = generateDailyRawLogs(today);
  
  const dashboardData: DashboardData = {
    rawLogs: todayLogs,
    productiveApps
  };
  
  return (
    <main>
      <ClarityScopeDashboard initialData={dashboardData} />
    </main>
  );
}
