import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchPage } from './routes/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Better Perplexity</h1>
          <p className="text-sm text-gray-600">Transparent search with adaptive personalization</p>
        </header>
        <main>
          <SearchPage />
        </main>
      </div>
    </QueryClientProvider>
  );
}

