import React, { useState, useEffect } from 'react';
import './ResetPassword.css';
import Logo_CS from '../assets/img/Logo_CS.png';
import FadeIn from '../components/animations/FadeIn';
import ScalePress from '../components/animations/ScalePress';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [accessToken, setAccessToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase coloca el token en el hash de la URL: #access_token=xxx&type=recovery
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
    } else {
      toast.error('Link inválido o expirado');
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    try {
      await resetPassword(accessToken, newPassword);
      setSubmitted(true);
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar la contraseña');
    }
  };

  if (submitted) {
    return (
      <FadeIn className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <img src={Logo_CS} alt="Logo" />
            <h2>¡Contraseña actualizada!</h2>
            <p>Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión.</p>
          </div>
          <div className="reset-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <ScalePress>
              <button className="primary-btn" onClick={() => navigate('/login')}>
                Ir al inicio de sesión
              </button>
            </ScalePress>
          </div>
        </div>
      </FadeIn>
    );
  }

  if (!accessToken) {
    return (
      <FadeIn className="reset-container">
        <div className="reset-card">
          <div className="reset-header">
            <img src={Logo_CS} alt="Logo" />
            <h2>Link inválido</h2>
            <p>Este link de recuperación no es válido o ya expiró. Solicita uno nuevo.</p>
          </div>
          <div className="reset-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <a className="link-back" href="/recover">Solicitar recuperación</a>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <img src={Logo_CS} alt="Logo" />
          <h2>Nueva contraseña</h2>
          <p>Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.</p>
        </div>

        <form className="reset-form" onSubmit={onSubmit}>
          <div className="reset-row">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="reset-row">
            <label htmlFor="confirm-password">Confirmar contraseña</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <ScalePress>
            <div className="reset-actions">
              <button type="submit" className="primary-btn">Cambiar contraseña</button>
              <a className="link-back" href="/login">Volver al inicio</a>
            </div>
          </ScalePress>
        </form>
      </div>
    </FadeIn>
  );
};

export default ResetPassword;
