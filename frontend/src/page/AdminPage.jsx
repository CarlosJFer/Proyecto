import React from 'react';
import { Link } from 'react-router-dom';

const AdminPage = () => {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1 style={{ marginBottom: 16 }}>Panel de Administración</h1>
      <p style={{ marginBottom: 32 }}>Bienvenido al panel de administración. Selecciona una opción:</p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <Link to="/admin/users" style={{ padding: 24, background: '#f4f4f4', borderRadius: 8, textDecoration: 'none', color: '#222', minWidth: 180, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          Gestión de Usuarios
        </Link>
        <Link to="/admin/secretarias" style={{ padding: 24, background: '#f4f4f4', borderRadius: 8, textDecoration: 'none', color: '#222', minWidth: 180, textAlign: 'center', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          Gestión de Secretarías
        </Link>
      </div>
    </div>
  );
};

export default AdminPage;
