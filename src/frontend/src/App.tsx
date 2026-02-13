import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import HomePage from './pages/HomePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <InternetIdentityProvider>
          <div className="min-h-screen bg-background">
            <HomePage />
          </div>
          <Toaster />
        </InternetIdentityProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}
