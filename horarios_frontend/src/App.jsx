import { AppRouter } from './core/routes/AppRouter';
import { AppProvider } from './core/context/AppContext';

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
