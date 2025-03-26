interface SplunkLog {
  timestamp: string;
  source: string;
  level: string;
  message: string;
  host: string;
  index: string;
}

interface SplunkSearchParams {
  query: string;
  earliest?: string;
  latest?: string;
  limit?: number;
}

export class SplunkService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.SPLUNK_API_URL || '';
    this.token = process.env.SPLUNK_TOKEN || '';
  }

  async searchLogs(params: SplunkSearchParams): Promise<SplunkLog[]> {
    try {
      const searchQuery = this.buildSearchQuery(params);
      const url = `${this.baseUrl}/services/search/jobs/export`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          search: searchQuery,
          output_mode: 'json',
          earliest_time: params.earliest || '-24h',
          latest_time: params.latest || 'now',
          count: params.limit?.toString() || '100',
        }),
      });

      if (!response.ok) {
        throw new Error(`Splunk API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformLogs(data.results || []);
    } catch (error) {
      console.error('Error searching Splunk logs:', error);
      return [];
    }
  }

  async getRealtimeLogs(index: string): Promise<SplunkLog[]> {
    return this.searchLogs({
      query: `index=${index}`,
      earliest: '-5m',
      latest: 'now',
      limit: 50,
    });
  }

  async saveSearch(name: string, query: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/services/saved/searches`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name,
          search: query,
          output_mode: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save Splunk search: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving Splunk search:', error);
      throw error;
    }
  }

  private buildSearchQuery(params: SplunkSearchParams): string {
    let query = params.query;
    if (!query.includes('| table')) {
      query += ' | table _time, source, level, message, host, index';
    }
    return query;
  }

  private transformLogs(logs: any[]): SplunkLog[] {
    return logs.map(log => ({
      timestamp: new Date(log._time).toISOString(),
      source: log.source || '',
      level: this.getLogLevel(log),
      message: log.message || '',
      host: log.host || '',
      index: log.index || '',
    }));
  }

  private getLogLevel(log: any): string {
    if (log.level) return log.level.toUpperCase();
    if (log.severity) return log.severity.toUpperCase();
    
    const message = log.message?.toLowerCase() || '';
    if (message.includes('error')) return 'ERROR';
    if (message.includes('warn')) return 'WARNING';
    return 'INFO';
  }
}

export const splunkService = new SplunkService();
