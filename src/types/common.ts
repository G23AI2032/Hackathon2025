export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ServiceDependency {
  name: string;
  type: 'upstream' | 'downstream';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

export interface HealthCheckItem {
  category: string;
  status: 'healthy' | 'warning' | 'critical';
  details: {
    podCount: number;
    readyPods: number;
    cpuUsage: number;
    memoryUsage: number;
    restarts: number;
    uptime: string;
    nodeStatus: string;
  };
  namespace: string;
  timestamp: string;
}

export interface RCAReport {
  issueId: string;
  summary: string;
  impact: string;
  rootCause: string;
  timeline: string;
  resolution: string;
  preventiveMeasures: string[];
}

export interface SplunkLog {
  timestamp: string;
  source: string;
  level: string;
  message: string;
  host: string;
  index: string;
}

export interface KibanaMetric {
  timestamp: string;
  type: string;
  value: number;
  metadata: {
    service: string;
    environment: string;
    cluster: string;
  };
}

export interface PreventiveMeasure {
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
  dueDate?: string;
}
