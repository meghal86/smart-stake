import { useAuth } from '@/contexts/AuthContext';
import { useUserMetadata } from '@/hooks/useUserMetadata';

export const AuthDebug = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { metadata, loading: metadataLoading, error } = useUserMetadata();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div className="space-y-1">
        <div>Auth Loading: {authLoading ? 'true' : 'false'}</div>
        <div>User: {user ? 'authenticated' : 'null'}</div>
        <div>User ID: {user?.id || 'none'}</div>
        <div>User Email: {user?.email || 'none'}</div>
        <div>Session: {session ? 'exists' : 'null'}</div>
        <div>Metadata Loading: {metadataLoading ? 'true' : 'false'}</div>
        <div>Metadata: {metadata ? 'exists' : 'null'}</div>
        <div>Metadata Error: {error || 'none'}</div>
      </div>
    </div>
  );
};