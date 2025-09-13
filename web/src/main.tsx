import { createRoot } from 'react-dom/client';
import { Provider } from "react-redux";
import { store } from './redux/store/store.ts';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import Routes from './routes/Routes.tsx';
import './index.css';
import { Toaster } from 'react-hot-toast';
// import { StrictMode } from 'react';


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <Provider store={store}>
      <Toaster />

      <Routes />
    </Provider>
  </ThemeProvider>
  // </StrictMode>,
);
