import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DatasetCard from '../../components/data/DatasetCard';
import { Dataset } from '../../types';

describe('DatasetCard', () => {
  afterEach(() => {
    cleanup();
  });

  const mockDataset: Dataset = {
    id: 'test-dataset-1',
    name: 'Test Dataset',
    description: 'A test dataset for unit testing',
    rows: 1000,
    columns: 10,
    dateUploaded: '2023-01-01T00:00:00Z',
    fileType: 'csv',
    fileSize: '2.5 MB',
    projectId: 'project-1'
  };

  const mockOnPreview = vi.fn();
  const mockOnAnalyze = vi.fn();

  it('renders dataset information correctly', () => {
    render(
      <DatasetCard 
        dataset={mockDataset} 
        onPreview={mockOnPreview} 
        onAnalyze={mockOnAnalyze} 
      />
    );

    expect(screen.getByText('Test Dataset')).toBeInTheDocument();
    expect(screen.getByText('A test dataset for unit testing')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
    
    const dateElement = screen.getByText(/Uploaded/);
    expect(dateElement).toHaveTextContent(/Jan 1, 2023/);
  });

  it('calls onPreview when Preview button is clicked', () => {
    render(
      <DatasetCard 
        dataset={mockDataset} 
        onPreview={mockOnPreview} 
        onAnalyze={mockOnAnalyze} 
      />
    );

    fireEvent.click(screen.getByText('Preview'));
    expect(mockOnPreview).toHaveBeenCalledWith(mockDataset);
  });

  it('calls onAnalyze when Analyze button is clicked', () => {
    render(
      <DatasetCard 
        dataset={mockDataset} 
        onPreview={mockOnPreview} 
        onAnalyze={mockOnAnalyze} 
      />
    );

    fireEvent.click(screen.getByText('Analyze'));
    expect(mockOnAnalyze).toHaveBeenCalledWith(mockDataset);
  });

  it('handles missing optional properties gracefully', () => {
    const minimalDataset: Dataset = {
      id: 'minimal-dataset',
      name: 'Minimal Dataset',
      description: '',
      rows: null as any,
      columns: null as any,
      dateUploaded: null as any,
      fileType: null as any,
      fileSize: null as any,
      projectId: 'project-1'
    };

    render(
      <DatasetCard 
        dataset={minimalDataset} 
        onPreview={mockOnPreview} 
        onAnalyze={mockOnAnalyze} 
      />
    );

    expect(screen.getByText('Minimal Dataset')).toBeInTheDocument();
    expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
  });
});