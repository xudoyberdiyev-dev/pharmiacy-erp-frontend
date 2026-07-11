import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary ushlab qoldi:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h1 className="text-lg font-black text-gray-900 mb-2">Nimadir xato ketdi</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Sahifa yuklashda kutilmagan xatolik yuz berdi. Iltimos, sahifani qayta yuklab ko'ring.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={15} /> Sahifani qayta yuklash
          </button>
        </div>
      </div>
    );
  }
}
