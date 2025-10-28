/**
 * Data Cleaning Tools - Automatic Data Quality Fixes
 * 
 * Provides AI with ability to actually clean datasets
 */

export interface CleaningResult {
  success: boolean;
  cleanedData: {
    columns: string[];
    rows: any[][];
  };
  changes: {
    missingValuesFixed: number;
    duplicatesRemoved: number;
    outliersHandled: number;
    typesConverted: number;
    inconsistenciesFixed: number;
  };
  summary: string;
}

/**
 * Handle missing values
 */
const handleMissingValues = (data: any[][], columnIndex: number): { data: any[][], fixed: number } => {
  let fixed = 0;
  const values = data.map(row => row[columnIndex]).filter(v => v !== null && v !== '' && v !== undefined);
  
  if (values.length === 0) return { data, fixed };

  // Detect if numeric
  const numericValues = values.filter(v => !isNaN(Number(v))).map(Number);
  const isNumeric = numericValues.length / values.length > 0.8;

  if (isNumeric) {
    // Fill with median for numeric
    const sorted = numericValues.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    data.forEach(row => {
      if (row[columnIndex] === null || row[columnIndex] === '' || row[columnIndex] === undefined) {
        row[columnIndex] = median;
        fixed++;
      }
    });
  } else {
    // Fill with mode for categorical
    const freq = new Map();
    values.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
    const mode = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0][0];
    
    data.forEach(row => {
      if (row[columnIndex] === null || row[columnIndex] === '' || row[columnIndex] === undefined) {
        row[columnIndex] = mode;
        fixed++;
      }
    });
  }

  return { data, fixed };
};

/**
 * Remove duplicate rows
 */
const removeDuplicates = (data: any[][]): { data: any[][], removed: number } => {
  const seen = new Set();
  const unique: any[][] = [];
  let removed = 0;

  data.forEach(row => {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    } else {
      removed++;
    }
  });

  return { data: unique, removed };
};

/**
 * Handle outliers using IQR method
 */
const handleOutliers = (data: any[][], columnIndex: number): { data: any[][], handled: number } => {
  let handled = 0;
  const values = data.map(row => Number(row[columnIndex])).filter(v => !isNaN(v));
  
  if (values.length === 0) return { data, handled };

  const sorted = values.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const median = sorted[Math.floor(sorted.length / 2)];

  data.forEach(row => {
    const value = Number(row[columnIndex]);
    if (!isNaN(value) && (value < lowerBound || value > upperBound)) {
      row[columnIndex] = median; // Replace outliers with median
      handled++;
    }
  });

  return { data, handled };
};

/**
 * Main cleaning function
 */
export const cleanDataset = async (
  columns: string[],
  rows: any[][],
  options: {
    handleMissing?: boolean;
    removeDuplicates?: boolean;
    handleOutliers?: boolean;
    convertTypes?: boolean;
  } = {}
): Promise<CleaningResult> => {
  const {
    handleMissing: doMissing = true,
    removeDuplicates: doDuplicates = true,
    handleOutliers: doOutliers = true,
    convertTypes: doConvert = true
  } = options;

  let cleanedData = rows.map(row => [...row]); // Deep copy
  const changes = {
    missingValuesFixed: 0,
    duplicatesRemoved: 0,
    outliersHandled: 0,
    typesConverted: 0,
    inconsistenciesFixed: 0
  };

  try {
    // 1. Handle missing values
    if (doMissing) {
      columns.forEach((col, idx) => {
        const result = handleMissingValues(cleanedData, idx);
        cleanedData = result.data;
        changes.missingValuesFixed += result.fixed;
      });
    }

    // 2. Remove duplicates
    if (doDuplicates) {
      const result = removeDuplicates(cleanedData);
      cleanedData = result.data;
      changes.duplicatesRemoved = result.removed;
    }

    // 3. Handle outliers in numeric columns
    if (doOutliers) {
      columns.forEach((col, idx) => {
        const values = cleanedData.map(row => row[idx]);
        const numericCount = values.filter(v => !isNaN(Number(v))).length;
        
        if (numericCount / values.length > 0.8) { // Mostly numeric
          const result = handleOutliers(cleanedData, idx);
          cleanedData = result.data;
          changes.outliersHandled += result.handled;
        }
      });
    }

    // 4. Convert types (simple conversion)
    if (doConvert) {
      cleanedData.forEach(row => {
        row.forEach((cell, idx) => {
          if (cell && !isNaN(Number(cell)) && typeof cell === 'string') {
            const num = Number(cell);
            if (num.toString() === cell) {
              row[idx] = num;
              changes.typesConverted++;
            }
          }
        });
      });
    }

    const summary = `
Cleaned successfully! 
- Fixed ${changes.missingValuesFixed} missing values
- Removed ${changes.duplicatesRemoved} duplicate rows
- Handled ${changes.outliersHandled} outliers
- Converted ${changes.typesConverted} values to correct types
Final dataset: ${cleanedData.length} rows × ${columns.length} columns
    `.trim();

    return {
      success: true,
      cleanedData: {
        columns,
        rows: cleanedData
      },
      changes,
      summary
    };
  } catch (error: any) {
    return {
      success: false,
      cleanedData: { columns, rows },
      changes,
      summary: `Cleaning failed: ${error.message}`
    };
  }
};

/**
 * Quick clean - one-click automatic cleaning
 */
export const quickClean = async (dataset: any): Promise<CleaningResult> => {
  if (!dataset.preview_data?.columns || !dataset.preview_data?.rows) {
    return {
      success: false,
      cleanedData: { columns: [], rows: [] },
      changes: {
        missingValuesFixed: 0,
        duplicatesRemoved: 0,
        outliersHandled: 0,
        typesConverted: 0,
        inconsistenciesFixed: 0
      },
      summary: 'No data available to clean'
    };
  }

  return await cleanDataset(
    dataset.preview_data.columns,
    dataset.preview_data.rows,
    {
      handleMissing: true,
      removeDuplicates: true,
      handleOutliers: true,
      convertTypes: true
    }
  );
};

export default {
  cleanDataset,
  quickClean
};

