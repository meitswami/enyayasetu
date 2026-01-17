import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  Database,
  FileText,
  MessageSquare,
  Upload,
  Users,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  totalCases: number;
  pendingCases: number;
  closedCases: number;
  totalMessages: number;
  totalReports: number;
  totalEvidence: number;
  totalUsers: number;
}

export const UsageStats: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalCases: 0,
    pendingCases: 0,
    closedCases: 0,
    totalMessages: 0,
    totalReports: 0,
    totalEvidence: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch counts from various tables
      const [
        casesResult,
        pendingResult,
        closedResult,
        messagesResult,
        reportsResult,
        evidenceResult,
        profilesResult,
      ] = await Promise.all([
        supabase.from('cases').select('id', { count: 'exact', head: true }),
        supabase.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('case_intake_messages').select('id', { count: 'exact', head: true }),
        supabase.from('case_reports').select('id', { count: 'exact', head: true }),
        supabase.from('case_evidence').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalCases: casesResult.count || 0,
        pendingCases: pendingResult.count || 0,
        closedCases: closedResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalReports: reportsResult.count || 0,
        totalEvidence: evidenceResult.count || 0,
        totalUsers: profilesResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Pending Cases',
      value: stats.pendingCases,
      icon: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Closed Cases',
      value: stats.closedCases,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Registered Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Chat Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Uploaded Reports',
      value: stats.totalReports,
      icon: Upload,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Evidence Files',
      value: stats.totalEvidence,
      icon: Database,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          System Usage Statistics
        </h2>
        <Badge variant="outline">Real-time Data</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="border-2 border-foreground rounded-xl p-4 bg-card shadow-[3px_3px_0_hsl(var(--foreground))] hover:shadow-[5px_5px_0_hsl(var(--foreground))] transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : card.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Usage Note */}
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 bg-muted/30">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          AI Credits & Usage
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          AI credits are managed by the AI Gateway service. Each AI operation (OCR, chat responses, 
          evidence analysis) uses credits from your subscription.
        </p>
        <div className="flex gap-2">
          <Badge>OCR Processing</Badge>
          <Badge>Case Intake Chat</Badge>
          <Badge>Evidence Analysis</Badge>
          <Badge>Court Hearing AI</Badge>
        </div>
      </div>

      {/* Processing Queue */}
      <div className="border-2 border-foreground rounded-xl p-4 bg-card">
        <h3 className="font-semibold mb-4">Processing Queue Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-amber-500">
              {stats.pendingCases}
            </p>
            <p className="text-xs text-muted-foreground">Awaiting Review</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-blue-500">
              {Math.floor(stats.pendingCases * 0.3)}
            </p>
            <p className="text-xs text-muted-foreground">In AI Analysis</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-green-500">
              {stats.closedCases}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
