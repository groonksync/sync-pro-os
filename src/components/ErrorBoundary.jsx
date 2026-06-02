import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px', borderRadius: '16px',
          backgroundColor: '#1a1a2e', border: '1px solid #ef4444',
          color: '#eee', fontFamily: 'monospace', fontSize: '12px',
        }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 12px', fontSize: '14px', fontWeight: 700 }}>
            ⚠️ Error al renderizar
          </h3>
          <p style={{ color: '#ef4444', margin: '0 0 8px', fontSize: '11px' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          {this.state.error?.stack && (
            <details>
              <summary style={{ cursor: 'pointer', color: '#999', fontSize: '10px' }}>Ver stack trace</summary>
              <pre style={{ fontSize: '9px', color: '#666', marginTop: '8px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#0ea5e9', color: 'white', border: 'none',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}