import React, { useState, useEffect } from 'react';

/**
 * Vista para seleccionar el rol del usuario (portero o departamento)
 * y manejar el inicio de sesión
 */
const SelectorRol: React.FC = () => {
  const [mode, setMode] = useState<'role' | 'login'>('role');
  const [userType, setUserType] = useState<'portero' | 'departamento' | null>(null);
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [departamentos, setDepartamentos] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar departamentos disponibles al iniciar
  useEffect(() => {
    const fetchDepartamentos = async () => {
      try {
        const response = await fetch('/api/departments');
        
        if (!response.ok) {
          throw new Error('Error al cargar departamentos');
        }
        
        const data = await response.json();
        setDepartamentos(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartamentos();
  }, []);

  // Selección de rol
  const handleSelectRole = (role: 'portero' | 'departamento') => {
    setUserType(role);
    setMode('login');
    // Limpiamos los campos cada vez que se selecciona un nuevo rol
    setUserName('');
    setPassword('');
    setError(null);
  };

  // Volver a selección de rol
  const handleBack = () => {
    setMode('role');
    setUserType(null);
    setUserName('');
    setPassword('');
    setError(null);
  };

  // Manejo de envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Si es portero, el nombre de usuario es siempre "admin"
      const name = userType === 'portero' ? 'admin' : userName;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          name,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar información de sesión
      localStorage.setItem('userType', userType || '');
      
      if (userType === 'departamento') {
        localStorage.setItem('departmentId', data.id.toString());
        localStorage.setItem('departmentName', data.name);
        window.location.href = '/departamento';
      } else {
        window.location.href = '/portero';
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error desconocido al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.5rem'}}>
        Portero Virtual
      </h1>

      {mode === 'role' ? (
        <>
          <h2 style={{fontSize: '1.125rem', fontWeight: '500', textAlign: 'center', marginBottom: '1rem', color: 'var(--color-gray-700)'}}>
            Selecciona tu rol
          </h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <button
              onClick={() => handleSelectRole('portero')}
              className="btn btn-primary"
            >
              Portero
            </button>
            <button
              onClick={() => handleSelectRole('departamento')}
              className="btn btn-secondary"
            >
              Departamento
            </button>
            
            <div style={{marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-gray-500)'}}>
              <p>Departamentos disponibles: {departamentos.length}</p>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
            <button
              type="button"
              onClick={handleBack}
              style={{color: 'var(--color-gray-500)', marginRight: '0.5rem', background: 'none', border: 'none', cursor: 'pointer'}}
            >
              ←
            </button>
            <h2 style={{fontSize: '1.125rem', fontWeight: '500', color: 'var(--color-gray-700)'}}>
              {userType === 'portero' ? 'Acceso de Portero' : 'Acceso de Departamento'}
            </h2>
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {userType === 'departamento' && (
            <div className="form-group">
              <label htmlFor="userName" className="form-label">
                Departamento
              </label>
              <div className="mt-1">
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="form-input"
                  placeholder="Nombre del departamento"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="mt-1">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
                placeholder="Ingrese contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{width: '100%'}}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div style={{marginTop: '1rem', textAlign: 'center'}}>
            <a href="/registro-departamento" className="btn btn-secondary" style={{width: '100%'}}>
              Registrar departamento
            </a>
          </div>
        </form>
      )}
    </div>
  );
};

export default SelectorRol;
