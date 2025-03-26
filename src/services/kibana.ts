interface KibanaMetric {
  timestamp: string;
  type: string;
  value: number;
  metadata: {
    service: string;
    environment: string;
    cluster: string;
  };
}

interface KibanaQuery {
  index: string;
  timeRange?: {
    from: string;
    to: string;
  };
  aggregations?: Record<string, any>;
  filters?: Array<{
    field: string;
    value: any;
    operator: 'eq' | 'gt' | 'lt' | 'contains';
  }>;
}

export class KibanaService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.KIBANA_API_URL || '';
    this.token = process.env.KIBANA_TOKEN || '';
  }

  async getMetrics(query: KibanaQuery): Promise<KibanaMetric[]> {
    try {
      const url = `${this.baseUrl}/api/metrics/${query.index}/_search`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'kbn-xsrf': 'true',
        },
        body: JSON.stringify(this.buildQuery(query)),
      });

      if (!response.ok) {
        throw new Error(`Kibana API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformMetrics(data.aggregations || {});
    } catch (error) {
      console.error('Error fetching Kibana metrics:', error);
      return [];
    }
  }

  async getDashboard(dashboardId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/dashboards/dashboard/${dashboardId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'kbn-xsrf': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Kibana dashboard: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching Kibana dashboard:', error);
      throw error;
    }
  }

  async createVisualization(params: {
    title: string;
    type: 'metric' | 'line' | 'bar' | 'area';
    index: string;
    field: string;
  }): Promise<void> {
    try {
      const url = `${this.baseUrl}/api/visualizations/create`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'kbn-xsrf': 'true',
        },
        body: JSON.stringify({
          attributes: {
            title: params.title,
            type: params.type,
            params: {
              index: params.index,
              field: params.field,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create Kibana visualization: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating Kibana visualization:', error);
      throw error;
    }
  }

  private buildQuery(query: KibanaQuery): any {
    return {
      size: 0,
      query: {
        bool: {
          must: [
            {
              range: {
                '@timestamp': {
                  gte: query.timeRange?.from || 'now-15m',
                  lte: query.timeRange?.to || 'now',
                },
              },
            },
            ...(query.filters || []).map(filter => ({
              match: {
                [filter.field]: filter.value,
              },
            })),
          ],
        },
      },
      aggs: query.aggregations || {
        metrics_over_time: {
          date_histogram: {
            field: '@timestamp',
            fixed_interval: '1m',
          },
        },
      },
    };
  }

  private transformMetrics(aggregations: any): KibanaMetric[] {
    const metrics: KibanaMetric[] = [];
    
    if (aggregations.metrics_over_time?.buckets) {
      aggregations.metrics_over_time.buckets.forEach((bucket: any) => {
        metrics.push({
          timestamp: new Date(bucket.key).toISOString(),
          type: 'system_metric',
          value: bucket.doc_count,
          metadata: {
            service: bucket.service?.buckets[0]?.key || 'unknown',
            environment: bucket.environment?.buckets[0]?.key || 'unknown',
            cluster: bucket.cluster?.buckets[0]?.key || 'unknown',
          },
        });
      });
    }

    return metrics;
  }
}

export const kibanaService = new KibanaService();
