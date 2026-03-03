import React, { useState } from 'react';
import './login.css';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo_CS from '../../assets/img/Logo_CS.png';
import FadeIn from '../../components/animations/FadeIn';
import ScalePress from '../../components/animations/ScalePress';
import { useNavigate } from 'react-router-dom'; // 1. Importamos useNavigate

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // 2. Inicializamos navigate

  const onSubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await login(email, password);

      // 3. Extraemos y normalizamos el rol (minúsculas, sin espacios)
      const rawRole = response?.user_metadata?.role || response?.role || "";
      const userRole = String(rawRole).toLowerCase().trim();

      // 4. Redirigimos usando navigate (evita que la consola se borre)
      if (userRole === "marketing") {
        navigate('/');
      } else if (userRole === "designer" || userRole === "diseñador") {
        navigate('/designer');
      } else if (userRole === "admin") {
        navigate('/admin');
      } else {
        console.warn(`Rol no detectado o distinto (${rawRole}), redirigiendo al home por defecto`);
        navigate('/');
      }

    } catch (error) {
      console.error("Error atrapado en el componente Login:", error);
    }
  };

  return (
    <FadeIn className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img className="login-logo" src={Logo_CS} alt="Creativa Studios Logo" />
          <p>Inicia sesión para continuar</p>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-wrapper">
              <span className="input-icon"><Mail size={20} /></span>
              <input
                type="email"
                id="email"
                placeholder="ejemplo@correo.com"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <span className="input-icon"><Lock size={20} /></span>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
              />
              <div style={{ marginBottom: '20px', cursor: 'pointer' }} className='eye-password-toggle' onClick={() => setShowPassword(!showPassword)}>
                <span className="input-icon eye-icon">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Recuérdame</span>
            </label>
          </div>

          <ScalePress>
            <div className='button-container'>
              <button type="submit" className="login-button">
                Iniciar Sesión
              </button>
            </div>
          </ScalePress>
        </form>

        <div className="login-footer">
          <p>¿Necesitas recuperar tu cuenta? <a href="/recover">Recuperar ahora</a></p>
        </div>
      </div>
    </FadeIn>
  );
};

export default Login;