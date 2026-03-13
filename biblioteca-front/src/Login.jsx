import { useState } from "react";
import axios from "axios"; // Importamos axios puro, no nuestra instancia 'api'
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      // Usamos axios puro para saltarnos los interceptores
      const response = await axios.post("http://localhost:8000/api/login/", formData);

      // Guardamos los tokens en el navegador
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      toast.success("¡Bienvenido!");

      // Le avisamos a App.jsx que el login fue exitoso para que cambie la pantalla
      onLoginSuccess();
    } catch (error) {
      console.error("Error en login:", error);
      if (error.response && error.response.status === 401) {
        toast.error("Usuario o contraseña incorrectos");
      } else {
        toast.error("Error al conectar con el servidor");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-5">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm mt-5">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">Iniciar Sesión</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Ingresando...
                      </>
                    ) : (
                      "Entrar al Sistema"
                    )}
                  </button>
                </div>
                <div className="text-center mt-3">
                  <span className="text-muted">¿No tienes cuenta? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={onSwitchToRegister}
                    disabled={cargando}
                  >
                    Regístrate aquí
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
