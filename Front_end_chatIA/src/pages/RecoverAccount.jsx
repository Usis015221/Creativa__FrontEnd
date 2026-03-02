import React, { useState } from 'react';
import './RecoverAccount.css';
import FadeIn from '../components/animations/FadeIn';
import ScalePress from '../components/animations/ScalePress';
import Logo_CS from '../assets/img/Logo_CS.png';
import toast from 'react-hot-toast';
import { createRequest } from '../services/adminService';

const RecoverAccount = () => {
  const [requestType, setRequestType] = useState('password');
  const [formData, setFormData] = useState({
    firstName: '',
    userEmail: '',
    role: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRequest({ ...formData, requestType });
      setSubmitted(true);
      toast.success('Solicitud enviada. El administrador te contactará pronto.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al enviar la solicitud. Intenta nuevamente.');
    }
  };

  if (submitted) {
    return (
      <FadeIn className="recover-container">
        <div className="recover-card">
          <div className="recover-header">
            <img src={Logo_CS} alt="Logo" />
            <h2>Solicitud enviada</h2>
            <p>Tu solicitud fue recibida. El administrador revisará tu caso y se comunicará contigo pronto.</p>
          </div>
          <div className="recover-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <a className="link-back" href="/login">Volver al inicio de sesión</a>
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn className="recover-container">
      <div className="recover-card">
        <div className="recover-header">
          <img src={Logo_CS} alt="Logo" />
          <h2>Recuperar cuenta</h2>
          <p>Si olvidaste tu correo o contraseña, solicita al administrador la recuperación. Completa el formulario y especifica tu caso.</p>
        </div>

        <form className="recover-form" onSubmit={onSubmit}>
          <div className="recover-row options">
            <label className="option-inline">
              <input
                type="radio"
                name="recoverType"
                value="password"
                checked={requestType === 'password'}
                onChange={() => setRequestType('password')}
              />
              Olvidé mi contraseña
            </label>
            <label className="option-inline">
              <input
                type="radio"
                name="recoverType"
                value="email"
                checked={requestType === 'email'}
                onChange={() => setRequestType('email')}
              />
              Olvidé mi correo
            </label>
            <label className="option-inline">
              <input
                type="radio"
                name="recoverType"
                value="both"
                checked={requestType === 'both'}
                onChange={() => setRequestType('both')}
              />
              Ambos (correo y contraseña)
            </label>
          </div>

          <div className="recover-row">
            <label htmlFor="rec-name">Nombre</label>
            <input
              id="rec-name"
              name="firstName"
              type="text"
              placeholder="Escribe tu nombre"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="recover-row">
            <label htmlFor="rec-email">Correo electrónico de tu cuenta</label>
            <input
              id="rec-email"
              name="userEmail"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={formData.userEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="recover-row">
            <label htmlFor="rec-role">Rol</label>
            <select
              id="rec-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="">¿Cuál era tu rol?</option>
              <option value="marketing">Marketing</option>
              <option value="designer">Diseñador</option>
            </select>
          </div>

          <div className="recover-row">
            <label htmlFor="rec-message">Detalles / Motivo</label>
            <textarea
              id="rec-message"
              name="message"
              rows="4"
              placeholder="Describe tu problema, el nombre real de la cuenta o cualquier dato que ayude al administrador..."
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <ScalePress>
            <div className="recover-actions">
              <button type="submit" className="primary-btn">Solicitar recuperación</button>
              <a className="link-back" href="/login">Volver al inicio de sesión</a>
            </div>
          </ScalePress>
        </form>

      </div>
    </FadeIn>
  );
};

export default RecoverAccount;
