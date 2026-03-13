import { useState } from "react";
import axios from "axios"; // Usamos axios puro, igual que en Login
import toast, { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    nombre_completo: "",
    telefono: "",
    password: "",
    confirmPassword: "", // Solo para validación en el front
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

    // Validación básica en el frontend
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);

    try {
      // Preparamos los datos a enviar, excluyendo confirmPassword
      const dataToSend = {
        email: formData.email,
        nombre_completo: formData.nombre_completo,
        password: formData.password,
        telefono: formData.telefono,
      };

      await axios.post("http://localhost:8000/api/registro/", dataToSend);

      toast.success("¡Registro exitoso! Por favor inicia sesión.");

      // Limpiamos el formulario
      setFormData({ email: "", nombre_completo: "", telefono: "", password: "", confirmPassword: "" });

      // Cambiamos a la vista de login
      onRegisterSuccess();

    } catch (error) {
      console.error("Error en registro:", error);
      // Manejo de errores basado en la respuesta de Django DRF
      if (error.response && error.response.data) {
          // Extraemos los mensajes de error del backend (ej. "El correo ya existe")
          const errorMessages = Object.values(error.response.data).flat();
          errorMessages.forEach(msg => toast.error(msg));
      } else {
        toast.error("Error al conectar con el servidor para el registro");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-5">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm mt-5">
            <div className="card-header bg-success text-white text-center">
              <h4 className="mb-0">Crear Nueva Cuenta</h4>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    name="nombre_completo"
                    className="form-control"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Correo Electrónico</label>
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

                <div className="mb-3">
                  <label className="form-label">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    name="telefono"
                    className="form-control"
                    value={formData.telefono}
                    onChange={handleChange}
                    disabled={cargando}
                  />
                </div>

                <div className="mb-3">
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

                <div className="mb-4">
                  <label className="form-label">Confirmar Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={cargando}
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-success btn-lg"
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registrando...
                      </>
                    ) : (
                      "Registrarse"
                    )}
                  </button>
                </div>

                <div className="text-center mt-3">
                  <span className="text-muted">¿Ya tienes una cuenta? </span>
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={onSwitchToLogin}
                    disabled={cargando}
                  >
                    Inicia Sesión aquí
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
