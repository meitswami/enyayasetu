import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  Bot,
  MessageSquare,
  FileText,
  Mic,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface AIUsageLog {
  id: string;
  user_id: string;
  session_id?: string;
  case_id?: string;
  model_used: string;
  action: string;
  tokens_input: number;
  tokens_output: number;
  created_at: string;
}

interface UsageSummary {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  modelBreakdown: Record<string, { count: number; tokens: number }>;
  actionBreakdown: Record<string, number>;
}

export const AIUsageDashboard: React.FC = () => {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [summary, setSummary] = useState<UsageSummary>({
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    modelBreakdown: {},
    actionBreakdown: {},
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsageLogs();
  }, []);

  const fetchUsageLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      setLogs(data || []);
      calculateSummary(data || []);
    } catch (error) {
      console.error('Error fetching AI usage logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSummary = (data: AIUsageLog[]) => {
    const modelBreakdown: Record<string, { count: number; tokens: number }> = {};
    const actionBreakdown: Record<string, number> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    data.forEach((log) => {
      // Model breakdown
      if (!modelBreakdown[log.model_used]) {
        modelBreakdown[log.model_used] = { count: 0, tokens: 0 };
      }
      modelBreakdown[log.model_used].count++;
      modelBreakdown[log.model_used].tokens += (log.tokens_input || 0) + (log.tokens_output || 0);

      // Action breakdown
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;

      // Totals
      totalInputTokens += log.tokens_input || 0;
      totalOutputTokens += log.tokens_output || 0;
    });

    setSummary({
      totalRequests: data.length,
      totalInputTokens,
      totalOutputTokens,
      modelBreakdown,
      actionBreakdown,
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('chat') || action.includes('intake')) return <MessageSquare className="w-4 h-4" />;
    if (action.includes('ocr') || action.includes('document')) return <FileText className="w-4 h-4" />;
    if (action.includes('voice') || action.includes('transcribe')) return <Mic className="w-4 h-4" />;
    if (action.includes('analyze') || action.includes('evidence')) return <Eye className="w-4 h-4" />;
    return <Bot className="w-4 h-4" />;
  };

  const getModelColor = (model: string): string => {
    if (model.includes('gemini')) return 'bg-blue-500';
    if (model.includes('gpt')) return 'bg-green-500';
    if (model.includes('claude')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  // AI Gateway supported models info
  const supportedModels = [
    { name: 'google/gemini-2.5-pro', description: 'Top-tier reasoning, multimodal', type: 'Premium' },
    { name: 'google/gemini-2.5-flash', description: 'Balanced cost & performance', type: 'Standard' },
    { name: 'google/gemini-2.5-flash-lite', description: 'Fast & economical', type: 'Economy' },
    { name: 'openai/gpt-5', description: 'Powerful all-rounder', type: 'Premium' },
    { name: 'openai/gpt-5-mini', description: 'Cost-effective performance', type: 'Standard' },
    { name: 'openai/gpt-5-nano', description: 'Speed & cost optimized', type: 'Economy' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI LLM Usage Dashboard
        </h2>
        <Button variant="outline" size="sm" onClick={fetchUsageLogs}>
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border-2 border-foreground rounded-xl p-4 bg-card shadow-[3px_3px_0_hsl(var(--foreground))]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalRequests.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total AI Requests</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-foreground rounded-xl p-4 bg-card shadow-[3px_3px_0_hsl(var(--foreground))]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalInputTokens.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Input Tokens</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-foreground rounded-xl p-4 bg-card shadow-[3px_3px_0_hsl(var(--foreground))]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalOutputTokens.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Output Tokens</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-foreground rounded-xl p-4 bg-card shadow-[3px_3px_0_hsl(var(--foreground))]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Object.keys(summary.modelBreakdown).length}</p>
              <p className="text-sm text-muted-foreground">Models Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Gateway Models Info */}
      <div className="border-2 border-foreground rounded-xl p-4 bg-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Gateway Supported Models
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportedModels.map((model) => (
            <div
              key={model.name}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <Bot className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-xs truncate">{model.name}</p>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {model.type}
              </Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Credits are managed by the AI Gateway service. API keys may be required depending on configuration.
        </p>
      </div>

      {/* Model Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border-2 border-foreground rounded-xl p-4 bg-card">
          <h3 className="font-semibold mb-4">Usage by Model</h3>
          <div className="space-y-3">
            {Object.entries(summary.modelBreakdown).map(([model, data]) => (
              <div key={model} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getModelColor(model)}`} />
                  <span className="text-sm font-mono">{model}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{data.count} requests</Badge>
                  <Badge variant="secondary">{data.tokens.toLocaleString()} tokens</Badge>
                </div>
              </div>
            ))}
            {Object.keys(summary.modelBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No usage data yet
              </p>
            )}
          </div>
        </div>

        <div className="border-2 border-foreground rounded-xl p-4 bg-card">
          <h3 className="font-semibold mb-4">Usage by Action</h3>
          <div className="space-y-3">
            {Object.entries(summary.actionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([action, count]) => (
                <div key={action} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionIcon(action)}
                    <span className="text-sm">{action}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            {Object.keys(summary.actionBreakdown).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No usage data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Logs Table */}
      <div className="border-2 border-foreground rounded-xl overflow-hidden bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent AI Operations
          </h3>
          <Badge variant="secondary">{logs.length} records</Badge>
        </div>
        <ScrollArea className="h-80">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Input</TableHead>
                <TableHead className="text-right">Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No AI usage logs recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.slice(0, 50).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getModelColor(log.model_used)} text-white`}
                      >
                        {log.model_used.split('/').pop()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {log.tokens_input?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {log.tokens_output?.toLocaleString() || 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
};
