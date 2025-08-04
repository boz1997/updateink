"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #031c26 0%, #247c6d 50%, #bf988a 100%)' }}
        >
          <div className="relative z-10 text-center">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 border border-white/20">
              <span className="text-6xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Bir Hata Oluştu</h1>
            <p className="text-lg text-white/80 mb-6 max-w-md">
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-[#247c6d] to-[#bf988a] text-white font-semibold rounded-xl shadow-lg hover:from-[#1f6b5e] hover:to-[#a8857a] transform hover:scale-105 transition-all duration-200 border border-white/20"
            >
              Sayfayı Yenile
            </button>
            {this.state.error && (
              <details className="mt-6 text-left max-w-md mx-auto">
                <summary className="text-white/60 cursor-pointer text-sm">Hata Detayları</summary>
                <pre className="mt-2 text-xs text-white/40 bg-white/10 p-3 rounded-lg overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // Children'ı güvenli bir şekilde render et
    try {
      return this.props.children;
    } catch (error) {
      console.error('Error rendering children:', error);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Render Hatası</h1>
            <p className="text-gray-600">Sayfa içeriği yüklenirken hata oluştu.</p>
          </div>
        </div>
      );
    }
  }
}

export default ErrorBoundary; 