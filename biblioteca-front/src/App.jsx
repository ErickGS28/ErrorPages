import { useState, useEffect } from 'react';
import LibrosApp from './LibrosApp';
import Login from './Login';
import Register from './Register';

function App() {
  // Estado para controlar si está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Estado para controlar si mostramos la vista de registro o login
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Al cargar la app, revisamos si ya hay un token
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Funciones de navegación
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    // Cuando el registro es exitoso, lo mandamos al login
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  return (
    <div>
      {/* Lógica de renderizado condicional */}
      {isAuthenticated ? (
        // 1. Si está autenticado, mostramos la app principal
        <LibrosApp onLogout={handleLogout} />
      ) : showRegister ? (
        // 2. Si no está autenticado y quiere registrarse, mostramos el registro
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      ) : (
        // 3. Por defecto, si no está autenticado, mostramos el login
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setShowRegister(true)}
        />
      )}
    </div>
  );
}

export default App;
