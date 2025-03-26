export interface JenkinsBuild {
  number: number;
  result: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'IN_PROGRESS';
  timestamp: number;
  duration: number;
  url: string;
  building: boolean;
  jobName: string;
}

export interface JenkinsJob {
  name: string;
  url: string;
  lastBuild: JenkinsBuild | null;
  healthReport?: Array<{
    score: number;
    description: string;
  }>;
}

export interface JenkinsStage {
  id: string;
  name: string;
  status: 'SUCCESS' | 'FAILURE' | 'IN_PROGRESS' | 'NOT_EXECUTED';
  startTimeMillis: number;
  durationMillis: number;
  pauseDurationMillis: number;
}

export interface JenkinsPipeline {
  id: string;
  name: string;
  status: 'SUCCESS' | 'FAILURE' | 'IN_PROGRESS' | 'NOT_EXECUTED';
  startTimeMillis: number;
  durationMillis: number;
  pauseDurationMillis: number;
  stages: JenkinsStage[];
}

export interface JenkinsTestResults {
  passCount: number;
  failCount: number;
  skipCount: number;
  totalCount: number;
}

export interface JenkinsCoverageReport {
  lineCoverage: number;
  branchCoverage: number;
  complexityCoverage: number;
}

export interface JenkinsSuggestion {
  type: 'Build';
  name: string;
  description: string;
}
