import React from 'react';
import { DataProvider, useData } from '../contexts/DataContext';
import { LoadingProgress } from './ui/LoadingProgress';

interface DataProviderWithProgressProps {
  children: React.ReactNode;
}

function DataProviderContent({ children }: DataProviderWithProgressProps) {
  const { isLoading, loadingProgress } = useData();
  
  return (
    <>
      <LoadingProgress 
        progress={loadingProgress} 
        isLoading={isLoading}
        message="Loading application data..."
      />
      {children}
    </>
  );
}

export function DataProviderWithProgress({ children }: DataProviderWithProgressProps) {
  return (
    <DataProvider>
      <DataProviderContent>
        {children}
      </DataProviderContent>
    </DataProvider>
  );
}
