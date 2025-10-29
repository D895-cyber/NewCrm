import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle,
  Rocket
} from 'lucide-react';

interface EmptyStateProps {
  type: 'no-results' | 'no-data' | 'error' | 'welcome' | 'loading';
  title: string;
  description: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }>;
  illustration?: React.ReactNode;
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  suggestions = [], 
  actions = [],
  illustration 
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'no-results':
        return <Search className="w-16 h-16 text-gray-400" />;
      case 'no-data':
        return <Target className="w-16 h-16 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-400" />;
      case 'welcome':
        return <Rocket className="w-16 h-16 text-blue-400" />;
      case 'loading':
        return <RefreshCw className="w-16 h-16 text-blue-400 animate-spin" />;
      default:
        return <Lightbulb className="w-16 h-16 text-gray-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50/80';
      case 'welcome':
        return 'bg-blue-50/80';
      case 'loading':
        return 'bg-blue-50/80';
      default:
        return 'bg-gray-50/80';
    }
  };

  return (
    <Card className={`${getBackgroundColor()} backdrop-blur-sm shadow-lg border-0`}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
        {/* Illustration */}
        <div className="mb-8">
          {illustration || (
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-lg">
              {getIcon()}
            </div>
          )}
        </div>

        {/* Title and Description */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-8 max-w-md">{description}</p>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Try these suggestions:</h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                className="flex items-center gap-2"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Predefined empty states for common scenarios
export function NoResultsEmptyState({ onClearFilters, onBrowseAll }: { onClearFilters: () => void; onBrowseAll: () => void }) {
  return (
    <EmptyState
      type="no-results"
      title="No RMAs found"
      description="No RMAs match your current filters. Try adjusting your search criteria."
      suggestions={[
        "Remove 'Priority: High' filter",
        "Extend date range to last 30 days",
        "Clear all filters and start fresh",
        "Check if the site name is spelled correctly"
      ]}
      actions={[
        {
          label: "Clear All Filters",
          onClick: onClearFilters,
          variant: "outline",
          icon: <Filter className="w-4 h-4" />
        },
        {
          label: "Browse All RMAs",
          onClick: onBrowseAll,
          icon: <Search className="w-4 h-4" />
        }
      ]}
    />
  );
}

export function WelcomeEmptyState({ onStartExploring }: { onStartExploring: () => void }) {
  return (
    <EmptyState
      type="welcome"
      title="Welcome to RMA Analytics!"
      description="Choose what you'd like to explore. Each option will show you relevant insights and data to help you make better decisions."
      actions={[
        {
          label: "Start Exploring",
          onClick: onStartExploring,
          icon: <Rocket className="w-4 h-4" />
        }
      ]}
    />
  );
}

export function ErrorEmptyState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong"
      description={error}
      actions={[
        {
          label: "Try Again",
          onClick: onRetry,
          icon: <RefreshCw className="w-4 h-4" />
        }
      ]}
    />
  );
}




