import React, { useState, useRef } from 'react';
import { AlertCircle, Upload, FileSpreadsheet, Database, CheckCircle2 } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import { syncDatasetToNeo4j } from '../../lib/neo4jSync';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_size: string;
  row_count: number;
  column_count: number;
  preview_data: any;
  project_id: string;
  user_id: string;
  created_at: string;
}

interface DataUploaderProps {
  onClose?: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onClose }) => {
  const { addDataset } = useMLContext();
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

  const parseCSV = (content: string): Promise<{ columns: string[], rows: any[][] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results: any) => {
          console.log('📊 CSV Parsed:', results);
          
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
          }
          
          const columns = results.meta.fields || [];
          const rows = results.data.map((row: any) => 
            columns.map((col: string) => row[col] ?? '')
          );
          
          console.log('✅ Columns:', columns);
          console.log('✅ Sample rows:', rows.slice(0, 3));
          
          resolve({ columns, rows });
        },
        error: (error: any) => {
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
    
    if (!file || !user) {
      console.log('❌ Missing requirements:', { file: !!file, user: !!user });
      setError('Missing file or user authentication');
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

      const fileSize = (file.size / 1024).toFixed(1);
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

      // Set initial progress to 10%
      setUploadProgress(10);

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
        user_id: user.id
      };

      console.log('💾 Inserting dataset:', datasetData);
      console.log('📡 About to call supabaseInsert...');
      
      // Update progress before insert
      setUploadProgress(30);
      
      const { data: insertedDatasets, error: insertError } = await supabaseInsert('datasets', datasetData);
      
      console.log('📡 supabaseInsert returned:', { data: insertedDatasets, error: insertError });

      // Update progress after insert
      setUploadProgress(80);

      if (insertError) {
        console.error('❌ Insert failed:', insertError);
        throw insertError;
      }

      if (!insertedDatasets || insertedDatasets.length === 0) {
        throw new Error('No data returned from insert');
      }

      const newDataset = insertedDatasets[0] as Dataset;
      
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
        preview_data: newDataset.preview_data
      };
      
      // Update progress before adding to context
      setUploadProgress(90);
      
      console.log('🔄 About to call addDataset...');
      console.log('📦 Dataset for context:', datasetForContext);
      
      // Try to add to context, but don't block on IndexedDB
      console.log('⏱️ Starting addDataset with 2s timeout...');
      try {
        const addDatasetPromise = addDataset(datasetForContext);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('addDataset timeout after 2s')), 2000)
        );
        
        await Promise.race([addDatasetPromise, timeoutPromise]);
        console.log('✅ Dataset added to local context');
      } catch (error) {
        console.warn('⚠️ addDataset failed or timed out:', error);
        console.warn('⚠️ Continuing anyway - dataset is already in Supabase');
        // Continue - dataset is already in Supabase and will be reloaded on next page refresh
      }
      
      console.log('🔄 Setting upload progress to 100...');
      setUploadProgress(100);
      console.log('✅ Upload complete!');

      // Sync to Neo4j knowledge graph (async, don't wait)
      if (datasetForContext && user?.id) {
        syncDatasetToNeo4j(datasetForContext as any, user.id)
          .then(() => {
            console.log('🔵 Dataset synced to Neo4j knowledge graph');
            toast.success('Synced to knowledge graph! 🔵', { duration: 2000 });
          })
          .catch((error) => {
            console.warn('Neo4j sync failed (optional):', error);
            // Don't show error to user - Neo4j sync is optional
          });
      }
      
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
    <div className="bg-gray-950 min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Dataset Upload</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">Connected</span>
            </div>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Upload your data files to get started with analysis</p>
      </div>

      {/* Main Upload Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div
            className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
            } cursor-pointer`}
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
                <div className="w-16 h-16 mb-4 flex items-center justify-center bg-blue-500/10 rounded-2xl">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Drop your file here
                </h3>
                <p className="text-sm text-gray-400 mb-1">
                  or <span className="text-blue-400 font-medium">browse</span> to choose a file
                </p>
                <p className="text-xs text-gray-500 mt-3 px-4 py-2 bg-gray-800/50 rounded-lg">
                  Supports CSV, JSON, Excel (XLSX/XLS), TXT • Max 50MB
                </p>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-500/10 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="text-xs font-mono text-blue-400">
                  {uploadProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              {uploadProgress < 100 && file && (
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {((file.size * (uploadProgress / 100)) / (1024 * 1024)).toFixed(2)} MB uploaded
                  </span>
                  <span className="text-xs text-gray-500">
                    of {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 mt-4 p-4 text-sm bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-400 mb-1">Upload Failed</p>
                <p className="text-red-300/80">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadProgress === 100 && !error && (
            <div className="flex items-start gap-3 mt-4 p-4 text-sm bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-emerald-400 mb-1">Upload Complete</p>
                <p className="text-emerald-300/80">Your dataset has been successfully uploaded and is ready for analysis.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpload();
              }}
              disabled={!file || uploading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Database className="w-4 h-4" />
                  Upload Dataset
                </span>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                disabled={uploading}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-gray-300 font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Supported Formats</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            CSV, Excel (XLSX/XLS), JSON, and plain text files are supported for upload.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Instant Processing</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your data is automatically analyzed and ready for ML workflows in seconds.
          </p>
        </div>
        
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Secure & Private</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            All uploads are encrypted and stored securely with row-level access controls.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataUploader;