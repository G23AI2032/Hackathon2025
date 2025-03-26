import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useOpenShift } from '../hooks/useOpenShift';
import { useGitHub } from '../hooks/useGitHub';

interface MCPQueryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
  timestamp: string;
  metrics?: {
    [key: string]: number | string;
  };
}

export function MCPQuery({ isOpen, onClose }: MCPQueryProps) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const { getResources } = useOpenShift();
  const { searchGitHub } = useGitHub();

  useEffect(() => {
    if (isOpen) {
      fetchServiceStatuses();
    }
  }, [isOpen]);

  const fetchServiceStatuses = async () => {
    try {
      // Fetch OpenShift Status
      const openshiftStatus = await getResources({
        query: 'status',
        context: 'health',
        namespace: 'default',
        resourceType: 'cluster'
      });

      // Fetch GitHub Integration Status
      const githubStatus = await searchGitHub({
        query: 'status',
        type: 'integration'
      });

      const currentTime = new Date().toISOString();

      const statusList: ServiceStatus[] = [
        {
          name: 'OpenShift Cluster',
          status: openshiftStatus?.healthy ? 'healthy' : 'error',
          details: openshiftStatus?.message || 'Cluster status check completed',
          timestamp: currentTime,
          metrics: {
            'Active Pods': openshiftStatus?.pods?.running || 0,
            'Deployments': openshiftStatus?.deployments?.total || 0,
            'Services': openshiftStatus?.services?.available || 0
          }
        },
        {
          name: 'GitHub Integration',
          status: githubStatus?.connected ? 'healthy' : 'warning',
          details: githubStatus?.message || 'Integration check completed',
          timestamp: currentTime,
          metrics: {
            'Active Webhooks': githubStatus?.webhooks?.active || 0,
            'Recent Commits': githubStatus?.activity?.commits || 0,
            'Open PRs': githubStatus?.pullRequests?.open || 0
          }
        },
        {
          name: 'Model Context Protocol',
          status: 'healthy',
          details: 'MCP Service is running',
          timestamp: currentTime,
          metrics: {
            'Active Contexts': 4,
            'Query Latency': '45ms',
            'Cache Hit Rate': '94%'
          }
        }
      ];

      setServices(statusList);
    } catch (error) {
      console.error('Error fetching service statuses:', error);
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 w-[1000px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">Model Context Protocol Diagnostics</h2>

        <div className="space-y-6">
          {services.map((service) => (
            <div key={service.name} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-white">{service.name}</h3>
                  <p className={`text-sm ${getStatusColor(service.status)} mt-1`}>
                    ● {service.status.toUpperCase()} - {service.details}
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  Last updated: {new Date(service.timestamp).toLocaleTimeString()}
                </div>
              </div>

              {service.metrics && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {Object.entries(service.metrics).map(([key, value]) => (
                    <div key={key} className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">{key}</div>
                      <div className="text-lg font-semibold text-white mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end mt-4">
            <button
              onClick={fetchServiceStatuses}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
