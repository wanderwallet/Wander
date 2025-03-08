import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: React.ComponentType<{
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ error, errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={error} errorInfo={errorInfo} />;
    }

    return this.props.children;
  }
}
