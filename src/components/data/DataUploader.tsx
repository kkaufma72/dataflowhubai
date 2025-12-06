import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Upload, FileSpreadsheet, Database, CheckCircle2, Edit3, Check, X } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import ProgressStepper, { Step } from '../common/ProgressStepper';
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

interface ColumnSchema {
  name: string;
  originalName: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  inferredType: string;
  sampleValues: any[];
  dropped?: boolean;
}

interface ParsedData {
  columns: string[];
  rows: any[][];
  schema: ColumnSchema[];
  rowCount: number;
  columnCount: number;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onClose }) => {
  const { addDataset } = useMLContext();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [rowsProcessed, setRowsProcessed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Schema editor state
  const [showSchemaEditor, setShowSchemaEditor] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [editingSchema, setEditingSchema] = useState<ColumnSchema[]>([]);
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [columnNameInput, setColumnNameInput] = useState('');
  
  // Progress stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const steps: Step[] = [
    { id: 'upload', label: 'Upload', description: 'Choose your file' },
    { id: 'review', label: 'Review Schema', description: 'Verify column types' },
    { id: 'confirm', label: 'Confirm', description: 'Finalize dataset' }
  ];

  const MAX_NAME_LENGTH = 50;

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Type inference function
  const inferType = (values: any[]): 'text' | 'number' | 'boolean' | 'date' => {
    const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonEmpty.length === 0) return 'text';

    // Check for boolean
    const boolCount = nonEmpty.filter(v => 
      v === true || v === false || 
      String(v).toLowerCase() === 'true' || 
      String(v).toLowerCase() === 'false'
    ).length;
    if (boolCount / nonEmpty.length > 0.8) return 'boolean';

    // Check for numbers
    const numCount = nonEmpty.filter(v => !isNaN(Number(v)) && String(v).trim() !== '').length;
    if (numCount / nonEmpty.length > 0.8) return 'number';

    // Check for dates
    const dateCount = nonEmpty.filter(v => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && String(v).match(/\d{4}|\d{1,2}\/\d{1,2}/);
    }).length;
    if (dateCount / nonEmpty.length > 0.8) return 'date';

    return 'text';
  };

  // Parse CSV/TXT with Web Worker for non-blocking parsing
  const streamParseFile = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      // Terminate existing worker if any
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      // Create new worker
      try {
        workerRef.current = new Worker(
          new URL('../../workers/csvParser.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (err) {
        console.error('Worker creation failed, falling back to main thread:', err);
        return fallbackParseCSV(file).then(resolve).catch(reject);
      }

      const worker = workerRef.current;

      worker.onmessage = (e: MessageEvent) => {
        const message = e.data;

        switch (message.type) {
          case 'progress':
            // Update real-time progress
            const progress = (message.bytesRead / message.totalBytes) * 100;
            setParseProgress(Math.min(progress, 99)); // Cap at 99% until complete
            setRowsProcessed(message.rowsProcessed);
            break;

          case 'complete':
            setParseProgress(100);
            // Add originalName to schema
            const schemaWithOriginal = message.schema.map((col: any) => ({
              ...col,
              originalName: col.name
            }));
            resolve({
              ...message,
              schema: schemaWithOriginal
            });
            break;

          case 'error':
            reject(new Error(message.error));
            break;
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        reject(new Error('Worker failed'));
      };

      // Start parsing
      worker.postMessage({ type: 'parse', file });
    });
  };

  // Fallback to main thread parsing if Worker fails
  const fallbackParseCSV = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results: any) => {
          const columns = results.meta.fields || [];
          const rows = results.data.slice(0, 10000).map((row: any) => 
            columns.map((col: string) => row[col] ?? '')
          );
          
          const columnValues: { [key: string]: any[] } = {};
          columns.forEach((col: string) => {
            columnValues[col] = results.data.slice(0, 100).map((row: any) => row[col]);
          });

          const schema: ColumnSchema[] = columns.map((col: string) => ({
            name: col,
            originalName: col,
            type: inferType(columnValues[col]),
            inferredType: inferType(columnValues[col]),
            sampleValues: columnValues[col].slice(0, 5)
          }));

          resolve({
            columns,
            rows,
            schema,
            rowCount: results.data.length,
            columnCount: columns.length
          });
        },
        error: reject
      });
    });
  };

  // Parse JSON
  const parseJSON = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('JSON must be a non-empty array of objects');
          }

          const columns = Object.keys(data[0]);
          const rows = data.map(item => columns.map(col => item[col] ?? ''));
          const columnValues: { [key: string]: any[] } = {};
          
          columns.forEach(col => {
            columnValues[col] = data.slice(0, 100).map(item => item[col]);
          });

          const schema: ColumnSchema[] = columns.map((col: string) => ({
            name: col,
            originalName: col,
            type: inferType(columnValues[col]),
            inferredType: inferType(columnValues[col]),
            sampleValues: columnValues[col].slice(0, 5)
          }));

          resolve({
            columns,
            rows,
            schema,
            rowCount: data.length,
            columnCount: columns.length
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

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

  const validateAndSetFile = async (file: File) => {
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

    // Auto-parse and show schema editor for CSV/TXT/JSON
    if (['csv', 'txt', 'json'].includes(fileExtension || '')) {
      await parseAndShowSchema(file);
    }
  };

  const parseAndShowSchema = async (file: File) => {
    setParsing(true);
    setError(null);
    setParseProgress(0);
    setRowsProcessed(0);
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let parsed: ParsedData;

      if (extension === 'json') {
        parsed = await parseJSON(file);
      } else {
        // Use Web Worker for CSV/TXT parsing
        parsed = await streamParseFile(file);
      }

      setParsedData(parsed);
      setEditingSchema([...parsed.schema]);
      setShowSchemaEditor(true);
      setCurrentStep(1); // Move to review step
      const activeColumns = parsed.schema.filter(s => !s.dropped).length;
      toast.success(`Parsed ${parsed.rowCount.toLocaleString()} rows with ${activeColumns} columns`);
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || 'Failed to parse file');
      toast.error('Failed to parse file');
    } finally {
      setParsing(false);
      setParseProgress(0);
      setRowsProcessed(0);
    }
  };

  const updateColumnType = (index: number, newType: 'text' | 'number' | 'boolean' | 'date') => {
    setEditingSchema(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], type: newType };
      return updated;
    });
  };

  const startEditingColumn = (index: number) => {
    setEditingColumn(index);
    setColumnNameInput(editingSchema[index].name);
  };

  const saveColumnName = (index: number) => {
    if (columnNameInput.trim()) {
      setEditingSchema(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], name: columnNameInput.trim() };
        return updated;
      });
    }
    setEditingColumn(null);
    setColumnNameInput('');
  };

  const cancelEditingColumn = () => {
    setEditingColumn(null);
    setColumnNameInput('');
  };

  const toggleDropColumn = (index: number) => {
    setEditingSchema(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], dropped: !updated[index].dropped };
      return updated;
    });
  };

  const confirmSchema = () => {
    if (!parsedData) return;
    
    // Filter out dropped columns
    const activeSchema = editingSchema.filter(s => !s.dropped);
    
    if (activeSchema.length === 0) {
      toast.error('Cannot upload dataset with no columns');
      return;
    }
    
    // Apply column renames and removals to data
    const activeIndices = editingSchema
      .map((col, idx) => (!col.dropped ? idx : -1))
      .filter(idx => idx !== -1);
    
    const updatedColumns = activeSchema.map(s => s.name);
    const updatedRows = parsedData.rows.map(row => 
      activeIndices.map(idx => row[idx])
    );
    
    // Update parsed data with confirmed schema
    const updated: ParsedData = {
      columns: updatedColumns,
      rows: updatedRows,
      schema: activeSchema,
      rowCount: parsedData.rowCount,
      columnCount: activeSchema.length
    };
    
    setParsedData(updated);
    setShowSchemaEditor(false);
    setCurrentStep(2); // Move to confirm step
    toast.success(`Schema confirmed! ${activeSchema.length} columns ready to upload.`);
  };

  const cancelSchema = () => {
    setShowSchemaEditor(false);
    setParsedData(null);
    setEditingSchema([]);
    setFile(null);
    setCurrentStep(0); // Reset to upload step
  };

  const truncateFileName = (name: string): string => {
    if (name.length <= MAX_NAME_LENGTH) return name;
    
    const extension = name.split('.').pop() || '';
    const nameWithoutExt = name.slice(0, -(extension.length + 1));
    const maxBaseLength = MAX_NAME_LENGTH - (extension.length + 4);
    
    return `${nameWithoutExt.slice(0, maxBaseLength)}...${extension}`;
  };

  const handleUpload = async () => {
    if (!file || !user) {
      setError('Missing file or user authentication');
      return;
    }

    // If we don't have parsed data yet (Excel files), parse now
    if (!parsedData) {
      setError('Please wait for file parsing to complete');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Use already parsed data - no need to re-read file!
      const { columns, rows, schema } = parsedData;
      
      console.log('✅ Using pre-parsed data:', {
        columns: columns.length,
        rows: rows.length,
        schema: schema.length
      });

      const fileSize = (file.size / 1024).toFixed(1);
      const fileSizeFormatted = file.size < 1024 * 1024 
        ? `${fileSize} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      // Prepare preview data with schema metadata
      const previewData = {
        columns: columns,
        rows: rows.slice(0, 100),
        schema: schema.map(s => ({
          name: s.name,
          type: s.type,
          inferredType: s.inferredType
        }))
      };

      setUploadProgress(30);

      // Insert into Supabase
      const { supabaseInsert } = await import('../../lib/supabaseHelpers');
      const { supabase } = await import('../../lib/supabase');
      
      // Get or create a project for this user
      console.log('🔍 Looking for existing project for user:', user.id);
      
      const { data: existingProjects, error: projQueryError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      console.log('📁 Project query result:', { existingProjects, projQueryError });
      
      let projectId: string;
      
      if (existingProjects && existingProjects.length > 0) {
        projectId = existingProjects[0].id;
        console.log('✅ Using existing project:', projectId);
      } else {
        // Create a default project
        console.log('📁 Creating new project...');
        const { data: newProject, error: projError } = await supabase
          .from('projects')
          .insert({
            name: 'My Workspace',
            description: 'Default workspace for datasets',
            user_id: user.id
          })
          .select('id')
          .single();
        
        console.log('📁 Create project result:', { newProject, projError });
        
        if (projError || !newProject) {
          console.error('❌ Failed to create project:', projError);
          throw new Error(`Could not create default project: ${projError?.message || 'Unknown error'}`);
        }
        projectId = newProject.id;
        console.log('✅ Created new project:', projectId);
      }

      setUploadProgress(40);
      console.log('📊 Preparing dataset with project_id:', projectId);
      
      const datasetData = {
        name: truncateFileName(file.name),
        description: `Uploaded ${file.name.split('.').pop()?.toUpperCase()} file with ${schema.length} columns`,
        file_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        file_size: fileSizeFormatted,
        row_count: parsedData.rowCount,
        column_count: parsedData.columnCount,
        preview_data: previewData,
        user_id: user.id,
        project_id: projectId
      };

      console.log('💾 Dataset data to insert:', JSON.stringify(datasetData, null, 2));
      
      if (!datasetData.project_id) {
        throw new Error('project_id is missing from dataset data!');
      }

      setUploadProgress(50);
      
      const { data: insertedDatasets, error: insertError } = await supabaseInsert('datasets', datasetData);
      
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
      
      setUploadProgress(90);
      
      // Update local state - data already saved to Supabase
      try {
        const addedDataset = await addDataset(datasetForContext, { persist: false });
        console.log('✅ Dataset added to local state:', addedDataset);
      } catch (error) {
        console.error('❌ addDataset failed:', error);
        // Even if addDataset fails, the data is in Supabase
        // Force page refresh to show the dataset
        toast('Dataset saved! Refreshing page...', { icon: '🔄' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return; // Exit early to prevent further execution
      }
      
      setUploadProgress(100);

      // Sync to Neo4j (async, don't wait)
      if (datasetForContext && user?.id) {
        syncDatasetToNeo4j(datasetForContext as any, user.id)
          .then(() => {
            console.log('🔵 Dataset synced to Neo4j');
            toast.success('Synced to knowledge graph! 🔵', { duration: 2000 });
          })
          .catch((error) => {
            console.warn('Neo4j sync failed (optional):', error);
          });
      }
      
      toast.success(`Dataset "${file.name}" uploaded successfully!`, {
        duration: 4000,
        icon: '✅'
      });

      // Reset form
      setFile(null);
      setParsedData(null);
      setEditingSchema([]);
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
        <p className="text-gray-400 text-sm mb-6">Upload your data files to get started with analysis</p>
        
        {/* Progress Stepper */}
        <ProgressStepper 
          steps={steps} 
          currentStep={currentStep}
          allowSkip={false}
        />
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

          {/* Parsing Progress */}
          {parsing && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  Parsing file...
                </span>
                <span className="text-xs font-mono text-blue-400">
                  {parseProgress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${parseProgress}%` }}
                ></div>
              </div>
              {rowsProcessed > 0 && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">
                    {rowsProcessed.toLocaleString()} rows processed
                  </span>
                  <span className="text-xs text-gray-500">
                    Using background processing...
                  </span>
                </div>
              )}
            </div>
          )}

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

      {/* Schema Editor Modal */}
      {showSchemaEditor && parsedData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Review Schema</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {parsedData.rowCount.toLocaleString()} rows × {parsedData.columnCount} columns detected
                  </p>
                </div>
                <button
                  onClick={cancelSchema}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Column Schema Editor</p>
                    <p className="text-sm text-blue-300/80">
                      Rename columns, adjust data types, or drop unwanted fields before upload. Changes are applied to your dataset.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {editingSchema.map((col, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${
                      col.dropped 
                        ? 'border-red-500/30 opacity-50' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Column Name with Edit */}
                        <div className="flex items-center gap-2 mb-2">
                          {editingColumn === idx ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={columnNameInput}
                                onChange={(e) => setColumnNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveColumnName(idx);
                                  if (e.key === 'Escape') cancelEditingColumn();
                                }}
                                className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                                placeholder="Column name"
                                autoFocus
                              />
                              <button
                                onClick={() => saveColumnName(idx)}
                                className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEditingColumn}
                                className="p-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4 text-gray-400" />
                              <h4 className="text-sm font-semibold text-white truncate">
                                {col.name}
                                {col.name !== col.originalName && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    (was: {col.originalName})
                                  </span>
                                )}
                              </h4>
                              <button
                                onClick={() => startEditingColumn(idx)}
                                className="ml-auto p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                                title="Rename column"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Sample Values */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span>Sample values:</span>
                          <span className="text-gray-400 font-mono">
                            {col.sampleValues.slice(0, 3).map(v => String(v || '—')).join(', ')}
                          </span>
                        </div>
                        
                        {/* Type Buttons */}
                        {!col.dropped && (
                          <div className="flex gap-2">
                            {(['text', 'number', 'boolean', 'date'] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => updateColumnType(idx, type)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  col.type === type
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {col.dropped && (
                          <div className="text-xs text-red-400 font-medium">
                            ⚠️ This column will be excluded from upload
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex flex-col gap-2">
                        {col.type === col.inferredType && !col.dropped && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded">
                            <Check className="w-3 h-3" />
                            Auto
                          </div>
                        )}
                        <button
                          onClick={() => toggleDropColumn(idx)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            col.dropped
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30'
                          }`}
                          title={col.dropped ? 'Include column' : 'Drop column'}
                        >
                          {col.dropped ? 'Restore' : 'Drop'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Active Columns Summary */}
              <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Active columns:
                  </span>
                  <span className="font-semibold text-white">
                    {editingSchema.filter(s => !s.dropped).length} of {editingSchema.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={confirmSchema}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
              >
                Confirm Schema & Continue
              </button>
              <button
                onClick={cancelSchema}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
