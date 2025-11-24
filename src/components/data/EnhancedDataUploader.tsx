import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import Button from '../common/Button';

interface FilePreview {
  name: string;
  size: string;
  type: string;
  rows?: number;
  columns?: number;
  preview?: string[][];
}

interface EnhancedDataUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const EnhancedDataUploader: React.FC<EnhancedDataUploaderProps> = ({
  onUpload,
  accept = '.csv,.xlsx,.xls,.json',
  maxSize = 100,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} not supported. Please upload ${accept}`;
    }

    return null;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setPreview(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create preview
    const filePreview: FilePreview = {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'unknown'
    };

    // For CSV files, try to parse and show preview
    if (file.name.endsWith('.csv')) {
      try {
        const text = await file.text();
        const lines = text.split('\n').slice(0, 11); // Header + 10 rows
        const data = lines.map(line => line.split(','));
        
        if (data.length > 0) {
          filePreview.columns = data[0].length;
          filePreview.rows = lines.length - 1; // Exclude header
          filePreview.preview = data;
        }
      } catch (err) {
        console.warn('Could not parse CSV preview:', err);
      }
    }

    setPreview(filePreview);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConfirmUpload = async () => {
    if (!preview) return;

    // Get the actual file from input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('File not found. Please try again.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(file);
      setPreview(null);
      setIsUploading(false);
      // Reset file input
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={className}>
      {!preview ? (
        // Upload Area
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
            ${isDragging
              ? 'border-indigo-600 bg-indigo-50 scale-105 shadow-lg'
              : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-gray-100'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={accept}
            onChange={handleFileInputChange}
          />

          {isDragging ? (
            // Dragging State
            <>
              <Upload className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-bounce" />
              <p className="text-xl font-bold text-indigo-600">
                Drop it like it's hot! 🔥
              </p>
              <p className="text-sm text-indigo-500 mt-2">
                Release to upload your file
              </p>
            </>
          ) : (
            // Default State
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag & drop your file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or{' '}
                <label
                  htmlFor="file-upload"
                  className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-700"
                >
                  browse files
                </label>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span>✓ Supports CSV, Excel, JSON</span>
                <span>•</span>
                <span>Max {maxSize}MB</span>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 text-left">{error}</p>
            </div>
          )}
        </div>
      ) : (
        // Preview Area
        <div className="bg-white border-2 border-indigo-200 rounded-xl p-6">
          {/* File Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{preview.name}</p>
                  <p className="text-sm text-gray-600">
                    {preview.size}
                    {preview.rows && preview.columns && (
                      <> • {preview.rows.toLocaleString()} rows × {preview.columns} columns</>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          {preview.preview && preview.preview.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-700 mb-3">Preview (first 10 rows)</p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview.preview[0].map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.preview.slice(1, 11).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleConfirmUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Looks good, upload
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDataUploader;
