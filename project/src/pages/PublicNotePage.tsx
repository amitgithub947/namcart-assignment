import { useParams } from 'react-router-dom';
import { FileText, Calendar, ExternalLink } from 'lucide-react';
import { usePublicNote } from '../hooks/useNotes';

export function PublicNotePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: note, isLoading, error } = usePublicNote(slug!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Note not found</h2>
          <p className="mt-2 text-gray-600">
            This note may have been removed or the link may have expired.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 text-xl font-semibold text-gray-900">
              <FileText className="h-6 w-6" />
              <span>Shared Note</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Read-only</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {note.title || 'Untitled Note'}
              </h1>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(note.created_at)}</span>
                </div>
                {note.updated_at !== note.created_at && (
                  <div className="flex items-center space-x-1">
                    <span>•</span>
                    <span>Updated {formatDate(note.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {note.content || 'This note is empty.'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This is a shared note. Create your own notes at{' '}
            <a 
              href={window.location.origin} 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {window.location.host}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}