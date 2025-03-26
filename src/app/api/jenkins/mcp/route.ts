import { NextResponse } from 'next/server';
import getConfig from 'next/config';

interface MCPQuery {
  context: string;
  query: string;
  parameters?: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const { context, query, parameters } = await request.json() as MCPQuery;
    const { serverRuntimeConfig } = getConfig();
    
    const baseUrl = process.env.JENKINS_URL || 'http://localhost:8080';
    const token = process.env.JENKINS_API_TOKEN;

    if (!token) {
      throw new Error('Jenkins API token not configured');
    }

    // Construct the authorization header
    const authHeader = `Basic ${Buffer.from(`admin:${token}`).toString('base64')}`;

    // Handle different MCP contexts
    switch (context) {
      case 'builds':
        const response = await fetch(`${baseUrl}/job/${parameters?.jobName || ''}/api/json?tree=builds[number,result,timestamp,duration,url,building]`, {
          headers: {
            'Authorization': authHeader,
          },
        });
        const data = await response.json();
        return NextResponse.json({ data: data.builds });

      case 'pipeline':
        const pipelineResponse = await fetch(`${baseUrl}/job/${parameters?.jobName || ''}/wfapi/runs`, {
          headers: {
            'Authorization': authHeader,
          },
        });
        const pipelineData = await pipelineResponse.json();
        return NextResponse.json({ data: pipelineData });

      case 'test_results':
        const testResponse = await fetch(`${baseUrl}/job/${parameters?.jobName || ''}/lastBuild/testReport/api/json`, {
          headers: {
            'Authorization': authHeader,
          },
        });
        const testData = await testResponse.json();
        return NextResponse.json({ data: testData });

      case 'health':
        const healthResponse = await fetch(`${baseUrl}/job/${parameters?.jobName || ''}/api/json?tree=healthReport[score,description]`, {
          headers: {
            'Authorization': authHeader,
          },
        });
        const healthData = await healthResponse.json();
        return NextResponse.json({ data: healthData.healthReport });

      default:
        throw new Error(`Unsupported MCP context: ${context}`);
    }
  } catch (error) {
    console.error('Error processing Jenkins MCP query:', error);
    return NextResponse.json(
      { error: 'Failed to process Jenkins MCP query' },
      { status: 500 }
    );
  }
}
