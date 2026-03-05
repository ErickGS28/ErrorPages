import { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { read, create, update, deleteLibro } from './services/api';

const FORM_INICIAL = {
  titulo: '',
  autor: '',
  isbn: '',
  paginas: '',
  editorial: '',
  prestado: false,
};

export default function LibrosApp() {
  const [libros, setLibros] = useState([]);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [cargandoTabla, setCargandoTabla] = useState(false);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);
  const [erroresBackend, setErroresBackend] = useState({});

  useEffect(() => {
    cargarLibros();
  }, []);

  const cargarLibros = async () => {
    setCargandoTabla(true);
    try {
      const res = await read();
      setLibros(res.data);
    } catch {
      toast.error('No se pudieron cargar los libros.');
    } finally {
      setCargandoTabla(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErroresBackend((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargandoGuardar(true);
    setErroresBackend({});

    // Convertir prestado a valor que Django entiende
    const datos = {
      ...formData,
      prestado: formData.prestado ? 'true' : 'false',
    };

    try {
      if (editandoId) {
        await update(editandoId, datos);
        toast.success('Libro actualizado correctamente.');
      } else {
        await create(datos);
        toast.success('Libro registrado correctamente.');
      }
      setFormData(FORM_INICIAL);
      setEditandoId(null);
      cargarLibros();
    } catch (err) {
      if (err.response && err.response.data) {
        setErroresBackend(err.response.data);
        toast.error('Revisa los errores en el formulario.');
      } else {
        toast.error('Error al guardar el libro.');
      }
    } finally {
      setCargandoGuardar(false);
    }
  };

  const prepararEdicion = (libro) => {
    setFormData({
      titulo: libro.titulo,
      autor: libro.autor,
      isbn: libro.isbn,
      paginas: libro.paginas,
      editorial: libro.editorial,
      prestado: libro.prestado,
    });
    setEditandoId(libro.id);
    setErroresBackend({});
  };

  const cancelarEdicion = () => {
    setFormData(FORM_INICIAL);
    setEditandoId(null);
    setErroresBackend({});
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este libro?')) return;
    const toastId = toast.loading('Eliminando libro...');
    try {
      await deleteLibro(id);
      toast.success('Libro eliminado.', { id: toastId });
      cargarLibros();
    } catch {
      toast.error('No se pudo eliminar el libro.', { id: toastId });
    }
  };

  const librosFiltrados = libros.filter(
    (l) =>
      l.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
      l.autor.toLowerCase().includes(filtro.toLowerCase()) ||
      l.isbn.toLowerCase().includes(filtro.toLowerCase())
  );

  const columnas = [
    { name: 'ID', selector: (row) => row.id, sortable: true, width: '60px' },
    { name: 'Título', selector: (row) => row.titulo, sortable: true, wrap: true },
    { name: 'Autor', selector: (row) => row.autor, sortable: true },
    { name: 'ISBN', selector: (row) => row.isbn },
    { name: 'Páginas', selector: (row) => row.paginas, sortable: true, width: '90px' },
    { name: 'Editorial', selector: (row) => row.editorial, sortable: true },
    {
      name: 'Estado',
      cell: (row) =>
        row.prestado ? (
          <span className="badge-prestado">Prestado</span>
        ) : (
          <span className="badge-disponible">Disponible</span>
        ),
      width: '110px',
    },
    {
      name: 'Acciones',
      cell: (row) => (
        <div className="d-flex gap-1">
          <button
            className="btn btn-sm btn-warning"
            onClick={() => prepararEdicion(row)}
          >
            Editar
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => handleEliminar(row.id)}
          >
            Eliminar
          </button>
        </div>
      ),
      width: '160px',
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="container-fluid py-4">
      <Toaster position="top-right" />

      <h2 className="mb-4 text-center fw-bold">
        Gestión de Libros - Biblioteca
      </h2>

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-md-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {editandoId ? 'Editar Libro' : 'Registrar Libro'}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Título */}
                <div className="mb-3">
                  <label className="form-label">Título</label>
                  <input
                    type="text"
                    name="titulo"
                    className={`form-control ${erroresBackend.titulo ? 'is-invalid' : ''}`}
                    value={formData.titulo}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                    required
                  />
                  {erroresBackend.titulo && (
                    <div className="invalid-feedback">{erroresBackend.titulo}</div>
                  )}
                </div>

                {/* Autor */}
                <div className="mb-3">
                  <label className="form-label">Autor</label>
                  <input
                    type="text"
                    name="autor"
                    className={`form-control ${erroresBackend.autor ? 'is-invalid' : ''}`}
                    value={formData.autor}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                    required
                  />
                  {erroresBackend.autor && (
                    <div className="invalid-feedback">{erroresBackend.autor}</div>
                  )}
                </div>

                {/* ISBN */}
                <div className="mb-3">
                  <label className="form-label">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    className={`form-control ${erroresBackend.isbn ? 'is-invalid' : ''}`}
                    value={formData.isbn}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                    required
                  />
                  {erroresBackend.isbn && (
                    <div className="invalid-feedback">{erroresBackend.isbn}</div>
                  )}
                </div>

                {/* Páginas */}
                <div className="mb-3">
                  <label className="form-label">Páginas</label>
                  <input
                    type="number"
                    name="paginas"
                    min="1"
                    className={`form-control ${erroresBackend.paginas ? 'is-invalid' : ''}`}
                    value={formData.paginas}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                    required
                  />
                  {erroresBackend.paginas && (
                    <div className="invalid-feedback">{erroresBackend.paginas}</div>
                  )}
                </div>

                {/* Editorial */}
                <div className="mb-3">
                  <label className="form-label">Editorial</label>
                  <input
                    type="text"
                    name="editorial"
                    className={`form-control ${erroresBackend.editorial ? 'is-invalid' : ''}`}
                    value={formData.editorial}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                    required
                  />
                  {erroresBackend.editorial && (
                    <div className="invalid-feedback">{erroresBackend.editorial}</div>
                  )}
                </div>

                {/* Prestado */}
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    id="prestado"
                    name="prestado"
                    className="form-check-input"
                    checked={formData.prestado}
                    onChange={handleChange}
                    disabled={cargandoGuardar}
                  />
                  <label className="form-check-label" htmlFor="prestado">
                    ¿Prestado?
                  </label>
                </div>

                {/* Botones */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-grow-1"
                    disabled={cargandoGuardar}
                  >
                    {cargandoGuardar ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Guardando...
                      </>
                    ) : editandoId ? (
                      'Actualizar'
                    ) : (
                      'Registrar'
                    )}
                  </button>

                  {editandoId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={cancelarEdicion}
                      disabled={cargandoGuardar}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Libros</h5>
              <span className="badge bg-light text-dark">{libros.length} libros</span>
            </div>
            <div className="card-body">
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Buscar por título, autor o ISBN..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              <DataTable
                columns={columnas}
                data={librosFiltrados}
                progressPending={cargandoTabla}
                progressComponent={
                  <div className="d-flex justify-content-center py-4">
                    <div className="spinner-border text-primary" />
                  </div>
                }
                pagination
                paginationPerPage={5}
                paginationRowsPerPageOptions={[5, 10, 20]}
                noDataComponent="No hay libros registrados."
                highlightOnHover
                striped
                responsive
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
