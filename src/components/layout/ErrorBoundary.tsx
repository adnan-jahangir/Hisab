import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-bg-elevated/90 border border-danger/40 rounded-2xl shadow-2xl backdrop-blur-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">System Error Caught</h2>
          <p className="text-sm text-text-secondary">
            {this.state.error?.message || 'A runtime error occurred in this component.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button onClick={() => this.setState({ hasError: false, error: null })} variant="secondary" size="sm">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="primary" size="sm">
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
