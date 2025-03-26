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

class JenkinsService {
  private baseUrl: string;
  private apiToken: string;
  private jobName: string = '';

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_JENKINS_URL || 'http://localhost:8080';
    this.apiToken = process.env.NEXT_PUBLIC_JENKINS_API_TOKEN || '';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`Jenkins API error: ${response.statusText}`);
    }
    return response.json();
  }

  async getJobs(): Promise<JenkinsJob[]> {
    const data = await this.fetchWithAuth('/api/json?tree=jobs[name,url,lastBuild[number,result,timestamp,duration],healthReport[score,description]]');
    return data.jobs.map((job: any) => ({
      name: job.name,
      url: job.url,
      lastBuild: job.lastBuild ? {
        number: job.lastBuild.number,
        result: job.lastBuild.result || 'IN_PROGRESS',
        timestamp: job.lastBuild.timestamp,
        duration: job.lastBuild.duration,
        url: job.url,
        building: false,
        jobName: job.name
      } : null,
      healthReport: job.healthReport
    }));
  }

  async getLatestBuild(jobName: string): Promise<JenkinsBuild | null> {
    try {
      const data = await this.fetchWithAuth(`/job/${jobName}/lastBuild/api/json`);
      return {
        number: data.number,
        result: data.result || 'IN_PROGRESS',
        timestamp: data.timestamp,
        duration: data.duration,
        url: data.url,
        building: data.building,
        jobName: jobName
      };
    } catch (error) {
      console.error(`Error fetching latest build for ${jobName}:`, error);
      return null;
    }
  }

  async getTestResults(jobName: string, buildNumber: number): Promise<JenkinsTestResults | null> {
    try {
      const data = await this.fetchWithAuth(`/job/${jobName}/${buildNumber}/testReport/api/json`);
      return {
        passCount: data.passCount,
        failCount: data.failCount,
        skipCount: data.skipCount,
        totalCount: data.totalCount
      };
    } catch (error) {
      console.error(`Error fetching test results for ${jobName} #${buildNumber}:`, error);
      return null;
    }
  }

  async getCoverageReport(jobName: string, buildNumber: number): Promise<JenkinsCoverageReport | null> {
    try {
      const data = await this.fetchWithAuth(`/job/${jobName}/${buildNumber}/coverage/result/api/json`);
      return {
        lineCoverage: data.lineCoverage,
        branchCoverage: data.branchCoverage,
        complexityCoverage: data.complexityCoverage
      };
    } catch (error) {
      console.error(`Error fetching coverage report for ${jobName} #${buildNumber}:`, error);
      return null;
    }
  }

  async getBuildLog(jobName: string, buildNumber: number): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/job/${jobName}/${buildNumber}/consoleText`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });
      return response.text();
    } catch (error) {
      console.error(`Error fetching build log for ${jobName} #${buildNumber}:`, error);
      return '';
    }
  }

  async getBuild(jobName: string, buildNumber: number): Promise<JenkinsBuild> {
    return this.fetchWithAuth(`/job/${jobName}/${buildNumber}/api/json`);
  }

  async getLastBuild(jobName: string): Promise<JenkinsBuild> {
    return this.fetchWithAuth(`/job/${jobName}/lastBuild/api/json`);
  }

  async getPipeline(jobName: string, buildNumber: number): Promise<JenkinsPipeline> {
    const data = await this.fetchWithAuth(`/job/${jobName}/${buildNumber}/wfapi/describe`);
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      startTimeMillis: data.startTimeMillis,
      durationMillis: data.durationMillis,
      pauseDurationMillis: data.pauseDurationMillis,
      stages: data.stages.map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        status: stage.status,
        startTimeMillis: stage.startTimeMillis,
        durationMillis: stage.durationMillis,
        pauseDurationMillis: stage.pauseDurationMillis
      }))
    };
  }

  async getStage(jobName: string, buildNumber: number, stageId: string): Promise<JenkinsStage> {
    const data = await this.fetchWithAuth(`/job/${jobName}/${buildNumber}/execution/node/${stageId}/wfapi/describe`);
    return {
      id: data.id,
      name: data.name,
      status: data.status,
      startTimeMillis: data.startTimeMillis,
      durationMillis: data.durationMillis,
      pauseDurationMillis: data.pauseDurationMillis
    };
  }

  async triggerBuild(jobName: string, parameters: Record<string, string> = {}): Promise<void> {
    const queryParams = new URLSearchParams(parameters).toString();
    await this.fetchWithAuth(`/job/${jobName}/build${queryParams ? '?' + queryParams : ''}`, {
      method: 'POST',
    });
  }

  async stopBuild(jobName: string, buildNumber: number): Promise<void> {
    await this.fetchWithAuth(`/job/${jobName}/${buildNumber}/stop`, {
      method: 'POST',
    });
  }

  async getBuildArtifacts(jobName: string, buildNumber: number) {
    return this.fetchWithAuth(`/job/${jobName}/${buildNumber}/api/json?tree=artifacts[*]`);
  }

  async getJobHealth(jobName: string): Promise<{ score: number; description: string }[]> {
    const data = await this.fetchWithAuth(`/job/${jobName}/api/json?tree=healthReport[description,score]`);
    return data.healthReport;
  }

  async searchBuilds(query: string): Promise<JenkinsBuild[]> {
    const data = await this.fetchWithAuth(`/search/suggest?query=${encodeURIComponent(query)}`);
    return data.suggestions.filter((s: any) => s.type === 'Build');
  }

  async getTestResultsOld(): Promise<JenkinsTestResults> {
    return this.fetchWithAuth(`/job/${this.jobName}/lastBuild/testReport/api/json`);
  }

  async getCoverageReportOld(): Promise<JenkinsCoverageReport> {
    return this.fetchWithAuth(`/job/${this.jobName}/lastBuild/coverage/result/api/json`);
  }

  setJobName(jobName: string) {
    this.jobName = jobName;
  }

  getJobName(): string {
    return this.jobName;
  }
}

export const jenkinsService = new JenkinsService();
