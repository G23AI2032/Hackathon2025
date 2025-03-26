export interface OpenShiftResource {
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  status: {
    phase: string;
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime: string;
      reason?: string;
      message?: string;
    }>;
    readyReplicas?: number;
    availableReplicas?: number;
    unavailableReplicas?: number;
  };
}

export interface OpenShiftPod extends OpenShiftResource {
  kind: 'Pod';
  spec: {
    containers: Array<{
      name: string;
      image: string;
      ports?: Array<{
        containerPort: number;
        protocol: string;
      }>;
      resources?: {
        limits?: {
          cpu?: string;
          memory?: string;
        };
        requests?: {
          cpu?: string;
          memory?: string;
        };
      };
    }>;
  };
}

export interface OpenShiftDeployment extends OpenShiftResource {
  kind: 'Deployment';
  spec: {
    replicas: number;
    selector: {
      matchLabels: Record<string, string>;
    };
    template: {
      metadata: {
        labels: Record<string, string>;
      };
      spec: {
        containers: Array<{
          name: string;
          image: string;
        }>;
      };
    };
  };
}

export interface OpenShiftService extends OpenShiftResource {
  kind: 'Service';
  spec: {
    selector: Record<string, string>;
    ports: Array<{
      port: number;
      targetPort: number;
      protocol: string;
    }>;
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  };
}
