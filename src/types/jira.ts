export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
    };
    created: string;
  };
}
