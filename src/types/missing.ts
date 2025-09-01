
// Additional type definitions for missing interfaces

export interface ServiceReport {
  _id: string;
  environmentalConditions?: {
    temperature?: string;
    humidity?: string;
  };
  observations?: Array<{
    text: string;
    timestamp: string;
  }>;
  // Add other properties as needed
}

export interface Prompt {
  _id: string;
  id: number;
  text: string;
  status: boolean;
  visibility: number;
  presence: number;
  runCount: number;
  lastRun: string;
}

// Add other missing types here
