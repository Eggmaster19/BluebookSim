import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useExamStore } from '../../store/examStore';
import { idbStorage } from '../../store/idbStorage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message, errorStack: error.stack };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleTryAgain = (): void => {
    this.setState({ hasError: false });
  };

  handleResetAndReturnToHome = async (): Promise<void> => {
    try {
      await idbStorage.removeItem('bluebook-exam-state');
    } catch (e) {
      console.error('Failed to clear IDB storage:', e);
    }
    useExamStore.getState().resetExamStore();
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#191c1f',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            zIndex: 99999,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              backgroundColor: '#26292d',
              border: '1px solid #3a3f45',
              borderRadius: '12px',
              padding: '36px 40px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#cc0000',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                Something went wrong in the simulator
              </h2>
            </div>
            <p style={{ color: '#cccccc', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              An error occurred while loading this exam screen. You can try to reload the screen, or reset the saved test state to return to the home screen.
            </p>
            {this.state.errorMessage && (
              <details
                style={{
                  color: '#ff8888',
                  fontSize: '13px',
                  marginBottom: '24px',
                  backgroundColor: '#191c1f',
                  border: '1px solid #3a3f45',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  overflowX: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#aaa', fontWeight: 600 }}>Error details</summary>
                <pre style={{ margin: '8px 0 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {this.state.errorMessage}
                  {this.state.errorStack ? `\n\n${this.state.errorStack}` : ''}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={this.handleTryAgain}
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  padding: '10px 20px',
                  border: '1px solid #555555',
                  borderRadius: '24px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleResetAndReturnToHome}
                style={{
                  backgroundColor: '#ffd100',
                  color: '#000000',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '24px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Reset &amp; Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;