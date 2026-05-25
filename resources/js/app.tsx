import './bootstrap';
import '../css/app.css';
import React from 'react';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { RolProvider } from './context/RolContext';

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    constructor(props: any) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(error: Error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 24, fontFamily: 'monospace', background: '#fef2f2', border: '2px solid #ef4444', borderRadius: 8, margin: 16 }}>
                    <strong style={{ color: '#dc2626', fontSize: 14 }}>Error de renderizado:</strong>
                    <pre style={{ marginTop: 8, fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {this.state.error.message}
                        {'\n\n'}
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const pages = import.meta.glob('./Pages/**/*.tsx');

createInertiaApp({
    title: (title) => title ? `${title} · SIC Muestras` : 'SIC · Control de Muestras',
    resolve: async (name) => {
        const loader = pages[`./Pages/${name}.tsx`];
        if (!loader) throw new Error(`Page not found: ${name}`);
        const page = await loader();
        return (page as any).default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ErrorBoundary>
                <RolProvider>
                    <App {...props} />
                </RolProvider>
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#3B71F3',
    },
});
