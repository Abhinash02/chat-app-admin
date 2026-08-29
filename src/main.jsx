import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { App } from './App.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retrying a 403 or a 422 just delays the error the operator needs to
      // see; only genuine transport failures are worth a second attempt.
      retry: (failureCount, error) => {
        if (error?.status && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: '12px',
                background: '#1b1726',
                color: '#fff',
                fontSize: '14px',
                padding: '10px 14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
