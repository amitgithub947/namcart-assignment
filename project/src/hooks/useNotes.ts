import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { CreateNoteRequest, UpdateNoteRequest, ShareNoteRequest } from '../types';

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: apiClient.getNotes,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => apiClient.getNote(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data, etag }: { id: string; data: UpdateNoteRequest; etag: string }) =>
      apiClient.updateNote(id, data, etag),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData(['notes', updatedNote.id], { 
        note: updatedNote, 
        etag: `"${updatedNote.version}"` 
      });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useShareNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ShareNoteRequest }) =>
      apiClient.shareNote(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUnshareNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.unshareNote,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function usePublicNote(slug: string) {
  return useQuery({
    queryKey: ['public-notes', slug],
    queryFn: () => apiClient.getPublicNote(slug),
    enabled: !!slug,
  });
}