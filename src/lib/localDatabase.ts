// Local PostgreSQL Database Service
// Use this instead of Supabase for local development

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

interface LocalDBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const LOCAL_DB_CONFIG: LocalDBConfig = {
  host: 'localhost',
  port: 5432,
  database: 'dataflow_hub',
  user: 'dataflow_user',
  password: 'dataflow_secure_password'
};

// Check if local DB is enabled
export const isLocalDBEnabled = (): boolean => {
  return import.meta.env.VITE_USE_LOCAL_DB === 'true';
};

// API base URL for local backend
const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8000/api';

// Generic fetch wrapper for local API
async function localAPIFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<QueryResult<T>> {
  try {
    const response = await fetch(`${LOCAL_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Local API error:', error);
    return { data: null, error: error as Error };
  }
}

// Dataset operations
export const localDB = {
  datasets: {
    async insert(dataset: Record<string, any>): Promise<QueryResult<any>> {
      return localAPIFetch('/datasets', {
        method: 'POST',
        body: JSON.stringify(dataset),
      });
    },

    async select(options?: { userId?: string; projectId?: string }): Promise<QueryResult<any[]>> {
      const params = new URLSearchParams();
      if (options?.userId) params.append('user_id', options.userId);
      if (options?.projectId) params.append('project_id', options.projectId);
      
      const queryString = params.toString();
      return localAPIFetch(`/datasets${queryString ? `?${queryString}` : ''}`);
    },

    async getById(id: string): Promise<QueryResult<any>> {
      return localAPIFetch(`/datasets/${id}`);
    },

    async update(id: string, updates: Record<string, any>): Promise<QueryResult<any>> {
      return localAPIFetch(`/datasets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },

    async delete(id: string): Promise<QueryResult<any>> {
      return localAPIFetch(`/datasets/${id}`, {
        method: 'DELETE',
      });
    },
  },

  projects: {
    async insert(project: Record<string, any>): Promise<QueryResult<any>> {
      return localAPIFetch('/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    },

    async select(userId?: string): Promise<QueryResult<any[]>> {
      const queryString = userId ? `?user_id=${userId}` : '';
      return localAPIFetch(`/projects${queryString}`);
    },

    async getById(id: string): Promise<QueryResult<any>> {
      return localAPIFetch(`/projects/${id}`);
    },
  },

  models: {
    async insert(model: Record<string, any>): Promise<QueryResult<any>> {
      return localAPIFetch('/models', {
        method: 'POST',
        body: JSON.stringify(model),
      });
    },

    async select(options?: { userId?: string; projectId?: string }): Promise<QueryResult<any[]>> {
      const params = new URLSearchParams();
      if (options?.userId) params.append('user_id', options.userId);
      if (options?.projectId) params.append('project_id', options.projectId);
      
      const queryString = params.toString();
      return localAPIFetch(`/models${queryString ? `?${queryString}` : ''}`);
    },

    async update(id: string, updates: Record<string, any>): Promise<QueryResult<any>> {
      return localAPIFetch(`/models/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
  },
};

// Check if local database is available
export async function checkLocalDBConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default localDB;

