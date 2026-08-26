import { Component } from 'react';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

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
          background: '#080d09',
          color: '#F5F5EC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
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

          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFE58F', marginBottom: 8, fontFamily: 'Cinzel, serif' }}>
            Application Error Caught
          </h2>

          <p style={{ fontSize: '0.85rem', color: '#A3B8A8', maxWidth: 360, lineHeight: 1.5, marginBottom: 20 }}>
            {this.state.error?.message || 'A runtime error occurred while rendering this component.'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: 12,
              padding: 14,
              maxWidth: '90%',
              fontSize: '0.72rem',
              color: '#f87171',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: 24,
              fontFamily: 'monospace'
            }}>
              {this.state.error.toString()}
            </div>
          )}

          <button
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #FFE58F, #D4AF37)',
              color: '#0f0c08',
              border: 'none',
              borderRadius: 14,
              padding: '12px 28px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)'
            }}
          >
            <RefreshCw size={16} /> Return to Feed
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
