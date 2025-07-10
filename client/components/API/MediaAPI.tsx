// Media API Component
import React, { useState, useCallback, useRef } from 'react';
import { MediaFile, APIComponentProps, Pagination } from './types';
import { useUpload, useAPI } from './hooks';

interface MediaAPIProps extends APIComponentProps {
  children?: (props: MediaAPIRenderProps) => React.ReactNode;
  allowedTypes?: string[];
  maxFileSize?: number; // in bytes
  showUpload?: boolean;
  showPagination?: boolean;
  itemsPerPage?: number;
}

interface MediaAPIRenderProps {
  // Data
  mediaFiles: MediaFile[];
  pagination: Pagination | null;
  
  // Loading states
  loading: boolean;
  uploading: boolean;
  deleting: boolean;
  
  // Upload progress
  uploadProgress: number;
  
  // Error states
  error: string | null;
  uploadError: string | null;
  
  // Actions
  fetchMedia: (page?: number, limit?: number, filters?: Record<string, unknown>) => Promise<void>;
  uploadFile: (file: File) => Promise<MediaFile>;
  uploadFiles: (files: FileList | File[]) => Promise<MediaFile[]>;
  deleteFile: (id: string | number) => Promise<void>;
  deleteFiles: (ids: (string | number)[]) => Promise<void>;
  clearError: () => void;
  
  // File input helpers
  openFileDialog: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaAPI: React.FC<MediaAPIProps> = ({ 
  children, 
  className = '',
  theme = 'light',
  accentColor = '#3B82F6',
  onError,
  onSuccess,
  allowedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  showUpload = true,
  showPagination = true,
  itemsPerPage = 12
}) => {
  const [selectedFiles, setSelectedFiles] = useState<(string | number)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // API hooks
  const { 
    data: mediaData, 
    loading: mediaLoading, 
    error: mediaError, 
    execute: fetchMediaExecute 
  } = useAPI('/media', {
    immediate: true,
  });
  
  const { 
    upload: uploadExecute, 
    uploading, 
    error: uploadError 
  } = useUpload();
  
  const { 
    loading: deleting, 
    error: deleteError, 
    execute: deleteExecute 
  } = useAPI('/media', {
    method: 'DELETE',
    immediate: false,
  });

  // Combined error handling
  const error = mediaError || deleteError;
  const loading = mediaLoading;

  // Extract media files and pagination from response
  const mediaFiles = Array.isArray(mediaData) ? (mediaData as MediaFile[]) : (mediaData as { data?: MediaFile[] })?.data || [];

  // Actions
  const fetchMedia = useCallback(async (page: number = 1, limit: number = itemsPerPage, filters: Record<string, unknown> = {}) => {
    try {
      const params = { page, limit, ...filters };
      await fetchMediaExecute(undefined, { params });
      
      onSuccess?.('Media files fetched successfully');
    } catch (err: unknown) {
      onError?.((err as Error).message);
    }
  }, [fetchMediaExecute, itemsPerPage, onError, onSuccess]);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file type
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.match(type.replace('*', '.*'));
    });
    
    if (!isValidType) {
      const error = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
      onError?.(error);
      throw new Error(error);
    }
    
    // Validate file size
    if (file.size > maxFileSize) {
      const error = `File size too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`;
      onError?.(error);
      throw new Error(error);
    }
    
    try {
      const result = await uploadExecute(file);
      onSuccess?.(`File "${file.name}" uploaded successfully`);
      
      // Refresh media list
      await fetchMedia();
      
      return result.data;
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [allowedTypes, maxFileSize, uploadExecute, fetchMedia, onError, onSuccess]);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const results: MediaFile[] = [];
    
    for (const file of fileArray) {
      try {
        const result = await uploadFile(file);
        results.push(result);
      } catch (err) {
        // Continue with other files even if one fails
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
    
    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (id: string | number) => {
    try {
      await deleteExecute(undefined, {
        url: `/media/${id}`
      });
      onSuccess?.('File deleted successfully');
      
      // Refresh media list
      await fetchMedia();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchMedia, onError, onSuccess]);

  const deleteFiles = useCallback(async (ids: (string | number)[]) => {
    try {
      await deleteExecute({ ids }, {
        url: '/media/bulk'
      });
      onSuccess?.(`${ids.length} files deleted successfully`);
      
      // Clear selection and refresh media list
      setSelectedFiles([]);
      await fetchMedia();
    } catch (err: unknown) {
      onError?.((err as Error).message);
      throw err;
    }
  }, [deleteExecute, fetchMedia, onError, onSuccess]);

  const clearError = useCallback(() => {
    // This would need to be implemented in the hooks to clear errors
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [uploadFiles]);

  // Helper functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    if (mimeType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
    if (mimeType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return '📋';
    return '📁';
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const toggleFileSelection = (id: string | number) => {
    setSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
  };

  const renderProps: MediaAPIRenderProps = {
    // Data
    mediaFiles,
    pagination: paginationData,
    
    // Loading states
    loading,
    uploading,
    deleting,
    
    // Upload progress
    uploadProgress,
    
    // Error states
    error,
    uploadError,
    
    // Actions
    fetchMedia,
    uploadFile,
    uploadFiles,
    deleteFile,
    deleteFiles,
    clearError,
    
    // File input helpers
    openFileDialog,
    handleFileSelect,
  };

  // If children is a function, use render props pattern
  if (typeof children === 'function') {
    return (
      <div 
        className={`media-api ${theme} ${className}`}
        style={{ '--accent-color': accentColor } as React.CSSProperties}
      >
        {children(renderProps)}
      </div>
    );
  }

  // Default UI component
  return (
    <div 
      className={`media-api bg-white rounded-lg shadow-sm border ${className}`}
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Media Library</h3>
          <div className="flex space-x-2">
            {selectedFiles.length > 0 && (
              <button
                onClick={() => deleteFiles(selectedFiles)}
                disabled={deleting}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete Selected ({selectedFiles.length})
              </button>
            )}
            {showUpload && (
              <button
                onClick={openFileDialog}
                disabled={uploading}
                className="px-3 py-1 text-sm text-white rounded-md hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{uploadError}</p>
          </div>
        )}
        
        {/* Upload progress */}
        {uploading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-800">Uploading...</span>
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Media Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((file: MediaFile) => (
            <div 
              key={file.id} 
              className={`border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => toggleFileSelection(file.id)}
            >
              <div className="aspect-square mb-2 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {file.mime_type?.startsWith('image/') ? (
                  <img 
                    src={file.url} 
                    alt={file.original_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-4xl">
                    {getFileIcon(file.mime_type || '', file.original_name)}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-gray-900 truncate" title={file.original_name}>
                  {file.original_name}
                </h4>
                <p className="text-xs text-gray-600">
                  {formatFileSize(file.size)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(file.created_at)}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                  }}
                  disabled={deleting}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {showPagination && paginationData && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((paginationData.current_page - 1) * paginationData.per_page) + 1} to{' '}
              {Math.min(paginationData.current_page * paginationData.per_page, paginationData.total)} of{' '}
              {paginationData.total} files
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchMedia(paginationData.current_page - 1)}
                disabled={paginationData.current_page <= 1 || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-gray-100 rounded-md">
                {paginationData.current_page} of {paginationData.last_page}
              </span>
              <button
                onClick={() => fetchMedia(paginationData.current_page + 1)}
                disabled={paginationData.current_page >= paginationData.last_page || loading}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {mediaFiles.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📁</div>
            <p>No media files found</p>
            {showUpload && (
              <button
                onClick={openFileDialog}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Upload your first file
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaAPI;