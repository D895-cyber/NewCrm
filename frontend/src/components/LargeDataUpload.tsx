import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadProgress {
  total: number;
  processed: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
}

interface UploadResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: number;
  errorDetails: any[];
}

export function LargeDataUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setProgress(null);
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }

    return data;
  };

  const uploadInChunks = async (data: any[], chunkSize: number = 100) => {
    const totalChunks = Math.ceil(data.length / chunkSize);
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const allErrorDetails: any[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);

      // Update progress
      setProgress({
        total: data.length,
        processed: end,
        percentage: Math.round((end / data.length) * 100),
        currentBatch: i + 1,
        totalBatches: totalChunks
      });

      try {
        const response = await fetch('/api/import/rma/bulk-enhanced', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rmas: chunk,
            batchSize: 25 // Smaller batch size for better performance
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          totalInserted += result.summary.inserted;
          totalUpdated += result.summary.updated;
          totalErrors += result.summary.errors;
          allErrorDetails.push(...result.summary.errorDetails);
        } else {
          throw new Error(result.error || 'Upload failed');
        }

        // Small delay between chunks to prevent overwhelming the server
        if (i < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`Error uploading chunk ${i + 1}:`, error);
        totalErrors += chunk.length;
        allErrorDetails.push({
          chunk: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          records: chunk.length
        });
      }
    }

    return {
      success: totalErrors === 0,
      inserted: totalInserted,
      updated: totalUpdated,
      errors: totalErrors,
      errorDetails: allErrorDetails
    };
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const csvText = await file.text();
      const data = parseCSV(csvText);

      console.log(`📊 Parsed ${data.length} records from CSV`);

      if (data.length === 0) {
        throw new Error('No data found in CSV file');
      }

      // Upload in chunks for large datasets
      const uploadResult = await uploadInChunks(data, 100);
      
      setResult(uploadResult);
      setProgress(null);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Large Data Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
              <p className="text-sm text-gray-600">
                Processing batch {progress.currentBatch} of {progress.totalBatches} 
                ({progress.processed} of {progress.total} records)
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p><strong>Upload Complete!</strong></p>
                  <p>Inserted: {result.inserted} records</p>
                  <p>Updated: {result.updated} records</p>
                  {result.errors > 0 && (
                    <p className="text-red-600">Errors: {result.errors} records</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Upload Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && result.errorDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {result.errorDetails.slice(0, 10).map((error, index) => (
                <div key={index} className="p-2 bg-red-50 rounded text-sm">
                  <p><strong>Row {error.row || error.index + 1}:</strong> {error.error}</p>
                </div>
              ))}
              {result.errorDetails.length > 10 && (
                <p className="text-sm text-gray-600">
                  ... and {result.errorDetails.length - 10} more errors
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




