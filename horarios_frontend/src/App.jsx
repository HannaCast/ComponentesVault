import { AppRouter } from './core/routes/AppRouter';
import { AuthProvider } from './core/context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
