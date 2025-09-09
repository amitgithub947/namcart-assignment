import { 
  User, 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest, 
  ShareNoteRequest,
  LoginRequest, 
  RegisterRequest,
  ConflictError 
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw error;
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<User> {
    return this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<User> {
    return this.request<User>('/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Notes endpoints
  async getNotes(): Promise<Note[]> {
    return this.request<Note[]>('/api/notes');
  }

  async getNote(id: string): Promise<{ note: Note; etag: string }> {
    const response = await fetch(`${API_BASE}/api/notes/${id}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw error;
    }

    const note = await response.json();
    const etag = response.headers.get('ETag') || '';
    
    return { note, etag };
  }

  async createNote(data: CreateNoteRequest): Promise<Note> {
    return this.request<Note>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNote(
    id: string, 
    data: UpdateNoteRequest, 
    etag: string
  ): Promise<Note> {
    try {
      return await this.request<Note>(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'If-Match': etag,
        },
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      if (error.detail?.includes('version conflict')) {
        throw { ...error, isConflict: true } as ConflictError & { isConflict: true };
      }
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    return this.request<void>(`/api/notes/${id}`, {
      method: 'DELETE',
    });
  }

  async shareNote(id: string, data: ShareNoteRequest = {}): Promise<{ public_url: string }> {
    return this.request<{ public_url: string }>(`/api/notes/${id}/share`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async unshareNote(id: string): Promise<void> {
    return this.request<void>(`/api/notes/${id}/share`, {
      method: 'DELETE',
    });
  }

  async getPublicNote(slug: string): Promise<Note> {
    return this.request<Note>(`/public/${slug}`);
  }
}

export const apiClient = new ApiClient();