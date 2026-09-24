import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          User &amp; ToDo Management
        </h1>
        <p className="mt-2 text-slate-500">
          Monorepo foundation ready — Sprint 2 incoming.
        </p>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
