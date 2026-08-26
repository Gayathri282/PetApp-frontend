import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CRITICAL RUNTIME ERROR BOUNDARY CATCH]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/feed';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          background: '#F3F8F5',
          color: '#12332F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '50%',
            width: 72,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <AlertTriangle size={36} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#12332F', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>
            Something went wrong
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#60736F', maxWidth: 360, lineHeight: 1.5, marginBottom: 24 }}>
            Please try again.
          </p>

          <button
            onClick={this.handleReset}
            style={{
              background: '#0D5148',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 14,
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(13, 81, 72, 0.25)'
            }}
          >
            <RefreshCw size={16} /> Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
