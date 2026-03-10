import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './context/AppContext';
import { QuoteProvider } from './context/QuoteContext';

export default function App() {
  return (
    <AppProvider>
      <QuoteProvider>
        <RouterProvider router={router} />
      </QuoteProvider>
    </AppProvider>
  );
}
