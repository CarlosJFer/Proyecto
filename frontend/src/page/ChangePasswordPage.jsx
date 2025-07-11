import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';
import apiClient from '../services/api';

const ChangePasswordPage = () => {
  const { user } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await apiClient.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>
      <h2>Cambiar mi contraseña</h2>
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="password" placeholder="Contraseña actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
        <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
        <input type="password" placeholder="Confirmar nueva contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Cambiar contraseña'}</button>
        {error && <span style={{ color: 'red' }}>{error}</span>}
        {success && <span style={{ color: 'green' }}>{success}</span>}
      </form>
    </div>
  );
};

export default ChangePasswordPage;
