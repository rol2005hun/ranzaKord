export interface ClientSpeedSummary {
  _id: string;
  count: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
}

export interface StatusCountSummary {
  _id: 'hit' | 'resolved' | 'failed';
  count: number;
}

export interface StreamLogItem {
  _id: string;
  videoId: string;
  client: string;
  durationMs: number;
  status: 'hit' | 'resolved' | 'failed';
  isDeciphered: boolean;
  formatsCount: number;
  contentLength?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface StreamStatsResponse {
  totalCount: number;
  clientAverages: ClientSpeedSummary[];
  statusCounts: StatusCountSummary[];
  recentLogs: StreamLogItem[];
}
