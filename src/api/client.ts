import {
  N8nWorkflow,
  N8nWorkflowResponse,
  N8nCredential,
  N8nCredentialSchema,
  N8nExecution,
  N8nTag,
  N8nApiError,
} from "../types/index.js";

/**
 * n8n REST API client
 * Full coverage of n8n Cloud API for workflow, credential, execution, and tag management
 * @see https://docs.n8n.io/api/
 */
export class N8nApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(host: string, apiKey: string) {
    this.baseUrl = host.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  // ============================================================================
  // WORKFLOWS
  // ============================================================================

  /**
   * Create a new workflow
   * @see POST /workflows
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>("POST", "/workflows", workflow);
  }

  /**
   * List all workflows
   * @see GET /workflows
   */
  async listWorkflows(params?: {
    active?: boolean;
    tags?: string[];
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nWorkflowResponse[]; nextCursor?: string }> {
    const query = new URLSearchParams();
    if (params?.active !== undefined)
      query.append("active", params.active.toString());
    if (params?.tags) params.tags.forEach((tag) => query.append("tags", tag));
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.cursor) query.append("cursor", params.cursor);

    return this.request<{ data: N8nWorkflowResponse[]; nextCursor?: string }>(
      "GET",
      `/workflows${query.toString() ? `?${query.toString()}` : ""}`,
    );
  }

  /**
   * Get a specific workflow by ID
   * @see GET /workflows/{id}
   */
  async getWorkflow(id: string): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>("GET", `/workflows/${id}`);
  }

  /**
   * Update a workflow
   * @see PUT /workflows/{id}
   */
  async updateWorkflow(
    id: string,
    workflow: Partial<N8nWorkflow>,
  ): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>(
      "PUT",
      `/workflows/${id}`,
      workflow,
    );
  }

  /**
   * Delete a workflow
   * @see DELETE /workflows/{id}
   */
  async deleteWorkflow(id: string): Promise<void> {
    await this.request("DELETE", `/workflows/${id}`);
  }

  /**
   * Activate a workflow
   * @see POST /workflows/{id}/activate
   */
  async activateWorkflow(id: string): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>(
      "POST",
      `/workflows/${id}/activate`,
    );
  }

  /**
   * Deactivate a workflow
   * @see POST /workflows/{id}/deactivate
   */
  async deactivateWorkflow(id: string): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>(
      "POST",
      `/workflows/${id}/deactivate`,
    );
  }

  /**
   * Manually execute a workflow
   * @see POST /workflows/{id}/execute
   */
  async executeWorkflow(id: string): Promise<N8nExecution> {
    return this.request<N8nExecution>("POST", `/workflows/${id}/execute`);
  }

  /**
   * Update workflow tags
   * @see PUT /workflows/{id}/tags
   */
  async updateWorkflowTags(
    id: string,
    tagIds: string[],
  ): Promise<N8nWorkflowResponse> {
    return this.request<N8nWorkflowResponse>("PUT", `/workflows/${id}/tags`, {
      tags: tagIds,
    });
  }

  // ============================================================================
  // CREDENTIALS
  // ============================================================================

  /**
   * Create a credential
   * @see POST /credentials
   */
  async createCredential(credential: {
    name: string;
    type: string;
    data: Record<string, unknown>;
  }): Promise<N8nCredential> {
    return this.request<N8nCredential>("POST", "/credentials", credential);
  }

  /**
   * List credentials (filtered by type if provided)
   * @see GET /credentials
   */
  async listCredentials(params?: {
    type?: string;
  }): Promise<{ data: N8nCredential[] }> {
    const query = new URLSearchParams();
    if (params?.type) query.append("type", params.type);

    return this.request<{ data: N8nCredential[] }>(
      "GET",
      `/credentials${query.toString() ? `?${query.toString()}` : ""}`,
    );
  }

  /**
   * Get credential schema for a specific type
   * @see GET /credentials/schema/{type}
   */
  async getCredentialSchema(type: string): Promise<N8nCredentialSchema> {
    return this.request<N8nCredentialSchema>(
      "GET",
      `/credentials/schema/${type}`,
    );
  }

  /**
   * Delete a credential
   * @see DELETE /credentials/{id}
   */
  async deleteCredential(id: string): Promise<void> {
    await this.request("DELETE", `/credentials/${id}`);
  }

  // ============================================================================
  // EXECUTIONS
  // ============================================================================

  /**
   * List workflow executions
   * @see GET /executions
   */
  async listExecutions(params?: {
    workflowId?: string;
    status?: "success" | "error" | "running" | "waiting";
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nExecution[]; nextCursor?: string }> {
    const query = new URLSearchParams();
    if (params?.workflowId) query.append("workflowId", params.workflowId);
    if (params?.status) query.append("status", params.status);
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.cursor) query.append("cursor", params.cursor);

    return this.request<{ data: N8nExecution[]; nextCursor?: string }>(
      "GET",
      `/executions${query.toString() ? `?${query.toString()}` : ""}`,
    );
  }

  /**
   * Get execution details
   * @see GET /executions/{id}
   */
  async getExecution(id: string): Promise<N8nExecution> {
    return this.request<N8nExecution>("GET", `/executions/${id}`);
  }

  /**
   * Delete an execution
   * @see DELETE /executions/{id}
   */
  async deleteExecution(id: string): Promise<void> {
    await this.request("DELETE", `/executions/${id}`);
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  /**
   * List all tags
   * @see GET /tags
   */
  async listTags(): Promise<{ data: N8nTag[] }> {
    return this.request<{ data: N8nTag[] }>("GET", "/tags");
  }

  /**
   * Create a tag
   * @see POST /tags
   */
  async createTag(name: string): Promise<N8nTag> {
    return this.request<N8nTag>("POST", "/tags", { name });
  }

  /**
   * Get or create a tag by name (helper method)
   * Used for per-user workflow organization
   */
  async getOrCreateTag(name: string): Promise<N8nTag> {
    const { data: tags } = await this.listTags();
    const existing = tags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    return this.createTag(name);
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  /**
   * Generic request handler with error handling
   */
  private async request<T = void>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": this.apiKey,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Handle empty responses (DELETE, etc.)
      if (response.status === 204) {
        // 204 No Content - return undefined for void operations
        return undefined as T;
      }

      if (response.status === 200) {
        const text = await response.text();
        // Empty 200 response - return undefined for void operations
        if (!text) return undefined as T;
        // Non-empty response - parse JSON
        return JSON.parse(text) as T;
      }

      // For other status codes, try to parse JSON for error messages
      const data = await response.json();

      // Handle errors
      if (!response.ok) {
        throw new N8nApiError(
          data.message || `n8n API error: ${response.statusText}`,
          response.status,
          data,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof N8nApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new N8nApiError(
        `Failed to call n8n API: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error,
      );
    }
  }
}
