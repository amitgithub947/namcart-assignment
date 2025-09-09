export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  is_archived: boolean;
  is_public: boolean;
  public_slug?: string;
  share_expires_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  is_archived?: boolean;
}

export interface ShareNoteRequest {
  expires_in_hours?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ApiError {
  detail: string;
}

export interface ConflictError extends ApiError {
  current_version: number;
}