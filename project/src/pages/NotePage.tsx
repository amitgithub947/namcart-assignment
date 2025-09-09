import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Share2, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useNote, useUpdateNote, useDeleteNote, useShareNote, useUnshareNote } from '../hooks/useNotes';
import { Layout } from '../components/Layout';

export function NotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data, isLoading, error, refetch } = useNote(id!);
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const shareNoteMutation = useShareNote();
  const unshareNoteMutation = useUnshareNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  const note = data?.note;
  const etag = data?.etag;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasUnsavedChanges(false);
      setConflictError(null);
      
      if (note.is_public && note.public_slug) {
        setShareUrl(`${window.location.origin}/s/${note.public_slug}`);
      } else {
        setShareUrl('');
      }
    }
  }, [note]);

  const handleSave = async () => {
    if (!note || !etag) return;

    try {
      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: { title, content },
        etag,
      });
      setHasUnsavedChanges(false);
      setConflictError(null);
    } catch (error: any) {
      if (error.isConflict) {
        setConflictError(
          'This note was modified by another session. Please refresh to see the latest version.'
        );
      } else {
        console.error('Failed to save note:', error);
      }
    }
  };

  const handleArchiveToggle = async () => {
    if (!note || !etag) return;

    try {
      await updateNoteMutation.mutateAsync({
        id: note.id,
        data: { is_archived: !note.is_archived },
        etag,
      });
    } catch (error: any) {
      if (error.isConflict) {
        setConflictError(
          'This note was modified by another session. Please refresh to see the latest version.'
        );
      }
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await deleteNoteMutation.mutateAsync(note.id);
        navigate('/');
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!note) return;

    try {
      const result = await shareNoteMutation.mutateAsync({
        id: note.id,
        data: { expires_in_hours: 24 * 7 }, // 7 days
      });
      setShareUrl(result.public_url);
    } catch (error) {
      console.error('Failed to share note:', error);
    }
  };

  const handleUnshare = async () => {
    if (!note) return;

    try {
      await unshareNoteMutation.mutateAsync(note.id);
      setShareUrl('');
    } catch (error) {
      console.error('Failed to unshare note:', error);
    }
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
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

  if (error || !note) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">Failed to load note. Please try again.</p>
          <Link to="/" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to notes
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {conflictError && (
          <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-yellow-700">{conflictError}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-3 py-1 text-sm text-yellow-700 hover:text-yellow-800"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to notes
          </Link>
          
          <div className="flex items-center space-x-2">
            {shareUrl ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  <Share2 className="h-3 w-3" />
                  <span>Shared</span>
                </div>
                <button
                  onClick={handleCopyShareUrl}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Copy share URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Open shared note"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={handleUnshare}
                  disabled={unshareNoteMutation.isPending}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Unshare
                </button>
              </div>
            ) : (
              <button
                onClick={handleShare}
                disabled={shareNoteMutation.isPending}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            )}
            
            <button
              onClick={handleArchiveToggle}
              disabled={updateNoteMutation.isPending}
              className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {note.is_archived ? (
                <>
                  <ArchiveRestore className="h-4 w-4 mr-1" />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </>
              )}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={deleteNoteMutation.isPending}
              className="inline-flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </button>
            
            <button
              onClick={handleSave}
              disabled={updateNoteMutation.isPending || !hasUnsavedChanges || !!conflictError}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Note title..."
              className="w-full text-2xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none"
            />
            
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Start writing your note..."
              rows={20}
              className="w-full text-gray-700 placeholder-gray-400 border-none outline-none resize-none"
            />
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center">
          Last updated: {new Date(note.updated_at).toLocaleString()}
          {hasUnsavedChanges && (
            <span className="ml-2 text-yellow-600">• Unsaved changes</span>
          )}
        </div>
      </div>
    </Layout>
  );
}