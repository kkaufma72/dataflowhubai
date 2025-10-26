import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

interface DataUploaderProps {
  onClose?: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onClose }) => {
  const { currentProject, addDataset } = useMLContext();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_NAME_LENGTH = 50;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/plain'
    ];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type || `text/${fileExtension}`;
    
    if (!validTypes.includes(fileType) && !['csv', 'xlsx', 'xls', 'json', 'txt'].includes(fileExtension || '')) {
      setError('Please upload a CSV, Excel, JSON, or TXT file');
      setFile(null);
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const truncateFileName = (name: string): string => {
    if (name.length <= MAX_NAME_LENGTH) return name;
    
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.slice(0, -(extension.length + 1));
    const maxBaseLength = MAX_NAME_LENGTH - (extension.length + 4);
    
    return `${nameWithoutExt.slice(0, maxBaseLength)}...${extension}`;
  };

  const parseCSV = (content: string): { columns: string[], rows: any[][] } => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          console.log('📊 CSV Parsed:', results);
          
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
          }
          
          const columns = results.meta.fields || [];
          const rows = results.data.map((row: any) => 
            columns.map(col => row[col] ?? '')
          );
          
          console.log('✅ Columns:', columns);
          console.log('✅ Sample rows:', rows.slice(0, 3));
          
          resolve({ columns, rows });
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
  };

  const parseJSON = (content: string): { columns: string[], rows: any[][] } => {
    const data = JSON.parse(content);
    
    if (Array.isArray(data) && data.length > 0) {
      const columns = Object.keys(data[0]);
      const rows = data.map(item => 
        columns.map(col => item[col] ?? '')
      );
      
      console.log('✅ JSON Columns:', columns);
      console.log('✅ JSON Sample rows:', rows.slice(0, 3));
      
      return { columns, rows };
    }
    
    throw new Error('JSON must be an array of objects');
  };

  const parseFile = async (content: string, fileName: string): Promise<{ columns: string[], rows: any[][] }> => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    console.log('📄 Parsing file:', fileName, 'Extension:', extension);
    
    if (extension === 'csv' || extension === 'txt') {
      return await parseCSV(content);
    } else if (extension === 'json') {
      return parseJSON(content);
    }
    
    throw new Error('Unsupported file format');
  };

  const handleUpload = async () => {
    console.log('🎯 handleUpload called');
    
    if (!file || !currentProject || !user) {
      console.log('❌ Missing requirements:', { file: !!file, currentProject: !!currentProject, user: !!user });
      setError('Missing file, project, or user authentication');
      return;
    }

    console.log('🚀 Starting upload for:', file.name);
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Read file content
      const fileContent = await file.text();
      console.log('📖 File content read, length:', fileContent.length);
      
      // Parse file
      const { columns, rows } = await parseFile(fileContent, file.name);
      
      if (!columns || columns.length === 0) {
        throw new Error('No columns found in file');
      }
      
      if (!rows || rows.length === 0) {
        throw new Error('No data rows found in file');
      }

      console.log('✅ Parsed successfully:', {
        columns: columns.length,
        rows: rows.length,
        sampleColumns: columns.slice(0, 5),
        sampleRow: rows[0]
      });

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      const fileSize = (file.size / 1024).toFixed(1);
      const fileSizeUnit = file.size < 1024 * 1024 ? 'KB' : 'MB';
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${fileSize} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // Prepare preview data - take first 100 rows
      const previewData = {
        columns: columns,
        rows: rows.slice(0, 100)
      };

      console.log('💾 Preparing to save to Supabase:', {
        name: truncateFileName(file.name),
        columns: columns.length,
        rows: rows.length,
        previewRows: previewData.rows.length
      });

      // Insert into Supabase using direct fetch (Supabase client hangs)
      const { supabaseInsert } = await import('../../lib/supabaseHelpers');
      
      const datasetData = {
        name: truncateFileName(file.name),
        description: `Uploaded ${file.name.split('.').pop()?.toUpperCase()} file`,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        file_size: fileSizeFormatted,
        row_count: rows.length,
        column_count: columns.length,
        preview_data: previewData,
        project_id: currentProject.id,
        user_id: user.id
      };

      console.log('💾 Inserting dataset:', datasetData);
      console.log('📡 About to call supabaseInsert...');
      
      const { data: insertedDatasets, error: insertError } = await supabaseInsert('datasets', datasetData);
      
      console.log('📡 supabaseInsert returned:', { data: insertedDatasets, error: insertError });

      clearInterval(interval);

      if (insertError) {
        console.error('❌ Insert failed:', insertError);
        throw insertError;
      }

      if (!insertedDatasets || insertedDatasets.length === 0) {
        throw new Error('No data returned from insert');
      }

      const newDataset = insertedDatasets[0];
      
      console.log('✅ Dataset saved to Supabase:', newDataset);
      
      // Add to local state
      const datasetForContext: any = {
        id: newDataset.id,
        name: newDataset.name,
        description: newDataset.description || '',
        rows: newDataset.row_count,
        columns: newDataset.column_count,
        row_count: newDataset.row_count,
        column_count: newDataset.column_count,
        dateUploaded: newDataset.created_at,
        created_at: newDataset.created_at,
        fileType: newDataset.file_type,
        file_type: newDataset.file_type,
        fileSize: newDataset.file_size,
        file_size: newDataset.file_size,
        projectId: newDataset.project_id,
        project_id: newDataset.project_id,
        preview_data: newDataset.preview_data
      };
      
      await addDataset(datasetForContext);
      console.log('✅ Dataset added to local context');
      
      console.log('🔄 About to set upload progress to 100...');
      setUploadProgress(100);
      
      toast.success(`Dataset "${file.name}" uploaded successfully!`, {
        duration: 4000,
        icon: '✅'
      });

      // Reset form
      setFile(null);
      setUploading(false);
      setUploadProgress(0);

      // Close modal after short delay
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      console.error('❌ Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="h-full">
      <div
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
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
            <p className="text-xs text-gray-500">
              CSV, JSON, Excel, or TXT (MAX. 50MB)
            </p>
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <File className="w-8 h-8 text-indigo-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
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
            <p className="text-sm text-yellow-800">
              Please select a project before uploading datasets.
            </p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {uploadProgress < 100
                ? `Uploading ${file?.name}...`
                : 'Processing...'}
            </span>
          </div>
          <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {uploadProgress.toFixed(0)}%
            </span>
            {uploadProgress < 100 && file && (
              <span className="text-xs text-gray-500">
                {((file.size * (uploadProgress / 100)) / (1024 * 1024)).toFixed(2)} MB / {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadProgress === 100 && (
        <div className="flex items-center mt-4 p-3 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>Upload complete!</span>
        </div>
      )}

      <div className="mt-6 flex space-x-3">
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleUpload();
          }}
          disabled={!file || uploading || !currentProject}
          className="flex-1"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
        {onClose && (
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={uploading}
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DataUploader;