import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Share2, Archive, Trash2, Search } from 'lucide-react';
import { useNotes, useCreateNote, useDeleteNote } from '../hooks/useNotes';
import { Layout } from '../components/Layout';

export function NotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: notes = [], isLoading, error } = useNotes();
  const createNoteMutation = useCreateNote();
  const deleteNoteMutation = useDeleteNote();

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = showArchived ? note.is_archived : !note.is_archived;
    return matchesSearch && matchesArchived;
  });

  const handleCreateNote = async () => {
    try {
      await createNoteMutation.mutateAsync({
        title: 'New Note',
        content: '',
      });
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteNoteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load notes. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
            <p className="text-gray-600">
              {filteredNotes.length} {showArchived ? 'archived' : 'active'} notes
            </p>
          </div>
          
          <button
            onClick={handleCreateNote}
            disabled={createNoteMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
                showArchived
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No notes found' : showArchived ? 'No archived notes' : 'No notes yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : showArchived 
                ? 'Archived notes will appear here'
                : 'Get started by creating a new note'
              }
            </p>
            {!searchTerm && !showArchived && (
              <div className="mt-6">
                <button
                  onClick={handleCreateNote}
                  disabled={createNoteMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first note
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      to={`/note/${note.id}`}
                      className="flex-1 min-w-0"
                    >
                      <h3 className="text-lg font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {note.title || 'Untitled'}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {note.is_public && (
                        <Share2 className="h-4 w-4 text-green-500" title="Shared publicly" />
                      )}
                      {note.is_archived && (
                        <Archive className="h-4 w-4 text-gray-500" title="Archived" />
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/note/${note.id}`}>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3 hover:text-gray-800 transition-colors">
                      {note.content || 'No content'}
                    </p>
                  </Link>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(note.updated_at)}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteNote(note.id, note.title)}
                      disabled={deleteNoteMutation.isPending}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}