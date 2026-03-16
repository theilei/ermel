import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { QuoteProvider } from './context/QuoteContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <QuoteProvider>
          <RouterProvider router={router} />
        </QuoteProvider>
      </AppProvider>
    </AuthProvider>
  );
}
