/* eslint-disable no-restricted-globals */
import Papa from 'papaparse';

export interface ParseMessage {
  type: 'parse';
  file: File;
  maxRows?: number;
}

export interface ParseProgressMessage {
  type: 'progress';
  bytesRead: number;
  totalBytes: number;
  rowsProcessed: number;
}

export interface ParseCompleteMessage {
  type: 'complete';
  columns: string[];
  rows: any[][];
  schema: ColumnSchema[];
  rowCount: number;
  columnCount: number;
}

export interface ParseErrorMessage {
  type: 'error';
  error: string;
}

export interface ColumnSchema {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  inferredType: string;
  sampleValues: any[];
}

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

// Worker message handler
self.onmessage = async (e: MessageEvent<ParseMessage>) => {
  const { file, maxRows = 10000 } = e.data;

  try {
    const rows: any[][] = [];
    let columns: string[] = [];
    const columnValues: { [key: string]: any[] } = {};
    let rowCount = 0;
    let bytesRead = 0;
    const totalBytes = file.size;

    // Stream parse the CSV with type assertion
    (Papa.parse as any)(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      chunk: (results: any, parser: any) => {
        // Set up columns on first chunk
        if (!columns.length && results.meta.fields) {
          columns = results.meta.fields;
          columns.forEach(col => columnValues[col] = []);
        }

        // Process rows
        results.data.forEach((row: any) => {
          if (rowCount < maxRows) {
            const rowArray = columns.map(col => row[col] ?? '');
            rows.push(rowArray);
            
            // Collect samples for type inference (first 100 rows)
            if (rowCount < 100) {
              columns.forEach(col => {
                if (columnValues[col].length < 100) {
                  columnValues[col].push(row[col]);
                }
              });
            }
            
            rowCount++;
          } else {
            parser.abort();
          }
        });

        // Estimate bytes read (Papa doesn't give us exact bytes)
        bytesRead = Math.min(
          bytesRead + (results.data.length * 100), // Rough estimate
          totalBytes
        );

        // Send progress update
        const progressMessage: ParseProgressMessage = {
          type: 'progress',
          bytesRead,
          totalBytes,
          rowsProcessed: rowCount
        };
        self.postMessage(progressMessage);
      },
      complete: () => {
        // Infer schema
        const schema: ColumnSchema[] = columns.map(col => ({
          name: col,
          type: inferType(columnValues[col]),
          inferredType: inferType(columnValues[col]),
          sampleValues: columnValues[col].slice(0, 5)
        }));

        // Send complete message
        const completeMessage: ParseCompleteMessage = {
          type: 'complete',
          columns,
          rows,
          schema,
          rowCount,
          columnCount: columns.length
        };
        self.postMessage(completeMessage);
      },
      error: (error: any) => {
        const errorMessage: ParseErrorMessage = {
          type: 'error',
          error: error.message || 'Parse failed'
        };
        self.postMessage(errorMessage);
      }
    });
  } catch (error: any) {
    const errorMessage: ParseErrorMessage = {
      type: 'error',
      error: error.message || 'Worker failed'
    };
    self.postMessage(errorMessage);
  }
};

export {};
