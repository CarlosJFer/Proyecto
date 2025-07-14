import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, Outlet, Navigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, AppBar, Toolbar, Button, Select, MenuItem, 
    FormControl, InputLabel, Grid, Snackbar, LinearProgress, TextField
} from '@mui/material';
import { NotificationProvider } from './context/NotificationContext';

// =======================================================================
// SERVICIOS Y CONTEXTO (Sin cambios, tu implementación es perfecta)
// =======================================================================

const apiClient = axios.create({
  baseURL: 'http://localhost:5001/api',
});

apiClient.interceptors.request.use(
  (config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        setUser(JSON.parse(userInfo));
      }
    } catch (error) {
      console.error("Error al parsear userInfo desde localStorage", error);
      localStorage.removeItem('userInfo');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { username, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (error) {
      throw error.response?.data?.message || 'Error al iniciar sesión';
    }
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// =======================================================================
// COMPONENTES REUTILIZABLES
// =======================================================================

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard/default" replace />;
  return <Outlet />;
};

const StatCard = ({ title, value, color = 'primary.main' }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Typography color="text.secondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color }}>
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const CustomPieChart = ({ data, dataKey, nameKey, title }) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF'];
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom align="center">{title}</Typography>
                <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} label>
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

const CustomBarChart = ({ data, xKey, barKey, title }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom align="center">{title}</Typography>
            <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xKey} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={barKey} fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

// =======================================================================
// COMPONENTE NAVBAR (MEJORADO CON MENÚ DESPLEGABLE)
// =======================================================================

const Navbar = () => {
    const [secretarias, setSecretarias] = useState([]);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSecretarias = async () => {
            if (user) {
                try {
                    const { data } = await apiClient.get('/analytics/secretarias');
                    setSecretarias(data);
                } catch (error) {
                    console.error('Error al cargar secretarías:', error);
                }
            } else {
                setSecretarias([]);
            }
        };
        fetchSecretarias();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const handleSecretariaChange = (event) => {
        const secretariaId = event.target.value;
        if (secretariaId) {
            navigate(`/dashboard/${secretariaId}`);
        }
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component={Link} to={user ? "/dashboard/default" : "/login"} sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                    Análisis de Dotación
                </Typography>
                {user && (
                    <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
                        <InputLabel id="select-secretaria-label" sx={{color: 'white'}}>Seleccionar Secretaría</InputLabel>
                        <Select
                            labelId="select-secretaria-label"
                            label="Seleccionar Secretaría"
                            onChange={handleSecretariaChange}
                            sx={{color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' }, '.MuiSvgIcon-root': { color: 'white'}}}
                        >
                            <MenuItem value="">
                                <em>-- Seleccionar --</em>
                            </MenuItem>
                            {secretarias.map(sec => (
                                <MenuItem key={sec.id} value={sec.id}>{sec.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {user ? (
                    <>
                        {user.role === 'admin' && <Button color="inherit" component={Link} to="/admin">Admin</Button>}
                        <Button color="inherit" onClick={handleLogout}>Salir</Button>
                    </>
                ) : (
                    <Button color="inherit" component={Link} to="/login">Login</Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

// =======================================================================
// PÁGINA DE DASHBOARD (COMPLETAMENTE REDISEÑADA)
// =======================================================================

const DashboardPage = () => {
    const { secretariaId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (secretariaId === 'default' || !secretariaId) {
            setData(null);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await apiClient.get(`/analytics/secretarias/${secretariaId}`);
                setData(response.data);
            } catch (err) {
                setError('Error al cargar los datos. Por favor, selecciona otra secretaría o contacta al administrador.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [secretariaId]);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    if (!data) {
        return (
            <Box textAlign="center" p={5}>
                <Typography variant="h4" color="text.secondary">Bienvenido al Panel de Análisis</Typography>
                <Typography variant="h6" color="text.secondary" mt={2}>Por favor, selecciona una secretaría desde el menú superior para comenzar.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8' }}>
            <Typography variant="h4" gutterBottom>
                Dashboard: {data.secretaria.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
                Última Actualización: {new Date(data.secretaria.ultimaActualizacion).toLocaleString('es-AR')}
            </Typography>

            <Grid container spacing={3} mt={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total de Agentes" value={data.resumen.totalAgentes} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Masa Salarial" value={`$${data.resumen.masaSalarial.toLocaleString('es-AR')}`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Sueldo Promedio" value={`$${Math.round(data.resumen.sueldoPromedio).toLocaleString('es-AR')}`} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Versión de Datos" value={data.metadatos.version} color="text.secondary" />
                </Grid>

                <Grid item xs={12} lg={8}>
                    <CustomBarChart data={data.analisis.contratacion} xKey="tipo" barKey="cantidad" title="Distribución por Tipo de Contratación" />
                </Grid>
                <Grid item xs={12} lg={4}>
                    <CustomPieChart data={data.analisis.genero} dataKey="cantidad" nameKey="genero" title="Distribución por Género" />
                </Grid>
                 <Grid item xs={12}>
                    <CustomBarChart data={data.analisis.antiguedad} xKey="rango" barKey="cantidad" title="Distribución por Antigüedad" />
                </Grid>
            </Grid>
        </Box>
    );
};

// =======================================================================
// PÁGINA DE ADMINISTRACIÓN (CON NUEVO COMPONENTE DE CARGA)
// =======================================================================

const UploadSection = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
        setSuccess('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor, selecciona un archivo primero.');
            return;
        }
        setUploading(true);
        setError('');
        setSuccess('');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('archivo', file); // 'archivo' debe coincidir con el nombre en el backend (upload.single('archivo'))

        try {
            const response = await apiClient.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });
            setSuccess(response.data.message);
            setSnackbar({ open: true, message: '¡Archivo procesado con éxito!', severity: 'success' });
            setFile(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al subir el archivo.';
            setError(errorMessage);
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setUploading(false);
        }
    };
    
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Cargar y Procesar Archivo de Dotación</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sube un archivo .xls o .xlsx para actualizar los datos de análisis de todas las secretarías.
                </Typography>
                <Box mt={2} display="flex" alignItems="center" gap={2}>
                    <Button variant="outlined" component="label">
                        Seleccionar Archivo
                        <input type="file" hidden accept=".xls,.xlsx" onChange={handleFileChange} />
                    </Button>
                    {file && <Typography>{file.name}</Typography>}
                </Box>
                <Box mt={2}>
                    <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? 'Procesando...' : 'Subir y Procesar'}
                    </Button>
                </Box>
                {uploading && (
                    <Box mt={2}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography align="center">{uploadProgress}%</Typography>
                    </Box>
                )}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </CardContent>
        </Card>
    );
};


const AdminPage = () => {
    // Aquí puedes añadir más secciones de administración si es necesario
    return (
        <Box maxWidth={800} mx="auto" p={3}>
            <Typography variant="h4" gutterBottom>Panel de Administración</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <UploadSection />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Gestión de Usuarios</Typography>
                            <Button component={Link} to="/admin/users" variant="contained" sx={{mt: 2}}>Ir a Usuarios</Button>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                     <Card>
                        <CardContent>
                            <Typography variant="h6">Gestión de Secretarías</Typography>
                            <Button component={Link} to="/admin/secretarias" variant="contained" sx={{mt: 2}}>Ir a Secretarías</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

// =======================================================================
// APP PRINCIPAL Y RUTAS
// =======================================================================

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Navbar />
          <main>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}> 
                <Route path="/dashboard/:secretariaId" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} /> 
              </Route>
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard/default" />} />
              <Route path="*" element={<Navigate to="/dashboard/default" />} />
            </Routes>
          </main>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

// Placeholder para LoginPage, ya que no me lo pasaste, uso uno básico.
const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(username, password);
            navigate('/dashboard/default');
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Card sx={{ minWidth: 400 }}>
                <CardContent>
                    <Typography variant="h5" align="center" gutterBottom>Iniciar Sesión</Typography>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <TextField label="Usuario" variant="outlined" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        <TextField label="Contraseña" type="password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Button type="submit" variant="contained" disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Ingresar'}
                        </Button>
                        {error && <Alert severity="error">{error}</Alert>}
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default App;
