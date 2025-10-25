import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DataUploaderProps {
  onClose?: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onClose }) => {
  const { currentProject, refreshDatasets } = useMLContext();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    const fileType = selectedFile.type || `text/${fileExtension}`;

    if (!validTypes.includes(fileType) && !['csv', 'xlsx', 'xls', 'json', 'txt'].includes(fileExtension || '')) {
      setError('Please upload a CSV, Excel, JSON, or TXT file');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !currentProject || !user) {
      setError('Missing file, project, or user authentication');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const filePath = `${user.id}/${currentProject.id}/${Date.now()}-${file.name}`;

    try {
      // 1. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('dataset_uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50); // File is uploaded, now process

      // 2. Call the Edge Function to process the file
      const { data, error: functionError } = await supabase.functions.invoke('create_dataset_from_upload', {
        body: { 
          project_id: currentProject.id,
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
      });

      if (functionError) throw functionError;

      setUploadProgress(100);
      toast.success(`Dataset "${file.name}" is being processed!`,
        { duration: 4000, icon: '✅' }
      );
      
      await refreshDatasets();

      setFile(null);
      setUploading(false);

      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <Card className="h-full">
      <div
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        } transition-colors cursor-pointer`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.xlsx,.xls,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {!file ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV, JSON, Excel, or TXT (MAX. 50MB)</p>
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <File className="w-8 h-8 text-indigo-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setError(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      {!currentProject && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
            <p className="text-sm text-yellow-800">Please select a project before uploading datasets.</p>
          </div>
        </div>
      )}
      {uploading && (
        <div className="mt-4">
          <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm mt-2">{uploadProgress < 100 ? 'Uploading...' : 'Processing...'}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {uploadProgress === 100 && !error && (
        <div className="flex items-center mt-4 p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Processing complete! Refreshing...</span>
        </div>
      )}
      <div className="mt-6 flex space-x-3">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || !currentProject}
          className="flex-1"
        >
          {uploading ? (uploadProgress < 50 ? 'Uploading...' : 'Processing...') : 'Upload and Process'}
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="outline" disabled={uploading}>Cancel</Button>
        )}
      </div>
    </Card>
  );
};

export default DataUploader;
