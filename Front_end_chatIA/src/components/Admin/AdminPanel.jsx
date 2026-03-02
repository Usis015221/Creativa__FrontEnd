import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminPanel.css';
import { UserPlus, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import FadeIn from '../../components/animations/FadeIn';
import ScalePress from '../../components/animations/ScalePress';
import ConfirmationModal from '../Modals/ConfirmationModal';
import toast from 'react-hot-toast';
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from '../../services/adminService';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '',
};

const AdminPanel = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = !searchTerm ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter ||
      (roleFilter === 'lock' ? !user.isActive : user.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateUser(editingUserId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        await createUser(formData);
        toast.success('Usuario creado correctamente');
      }
      handleCancelEdit();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingUserId(null);
  };

  const handleDeleteUser = (userId) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete);
      // Optimistic removal — no fetchUsers() reload
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete));
      toast.success('Usuario eliminado correctamente');
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user.id, !user.isActive);
      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u)
      );
      toast.success(user.isActive ? 'Usuario deshabilitado' : 'Usuario habilitado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado del usuario');
      fetchUsers(); // Revert on error
    }
  };

  return (
    <FadeIn className="admin-container">
      <div className="admin-card">
        <div className="admin-header">
          <h2>Panel de Administración</h2>
        </div>

        <div className="admin-content">
          {/* Panel izquierdo: formulario (campos verticales) */}
          <div className="left-panel">
            <form className={`admin-form ${isEditing ? 'editing' : ''}`} onSubmit={onSubmit}>
              {isEditing && (
                <div className="edit-mode-banner">
                  Editando usuario
                </div>
              )}
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="name">Nombre</label>
                  <input
                    id="name"
                    name="firstName"
                    type="text"
                    placeholder="Nombre"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="lastname">Apellido</label>
                  <input
                    id="lastname"
                    name="lastName"
                    type="text"
                    placeholder="Apellido"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="email">Correo Electronico</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isEditing}
                  />
                </div>
              </div>

              {!isEditing && (
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                      id="password"
                      name="password"
                      className="password-input"
                      type="password"
                      placeholder='••••••••'
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="role">Rol</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Selecciona un rol</option>
                    <option value="marketing">Marketing</option>
                    <option value="designer">Diseñador</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <ScalePress>
                  <div className="create-button-wrap">
                    <button type="submit" className="create-button">
                      <UserPlus size={16} style={{ marginRight: 8 }} />
                      {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                    </button>
                  </div>
                </ScalePress>
                {isEditing && (
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Panel derecho: tabla de usuarios */}
          <div className="right-panel">
            <div className="admin-table-section">
              <div className="table-header-row">
                <h3>USUARIOS</h3>
                <div className="user-controls">
                  <input
                    className="user-search"
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    className="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">Filtrar por rol</option>
                    <option value="marketing">Marketing</option>
                    <option value="designer">Diseñador</option>
                    <option value="lock">Deshabilitados</option>
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Correo Electronico</th>
                      <th>Rol</th>
                      <th className="actions-col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`skel-${i}`} className="skeleton-row">
                            <td><div className="skeleton-box skeleton-text" /></td>
                            <td><div className="skeleton-box skeleton-text" /></td>
                            <td><div className="skeleton-box skeleton-email" /></td>
                            <td><div className="skeleton-box skeleton-badge" /></td>
                            <td className="actions-col">
                              <div className="skeleton-actions">
                                <div className="skeleton-box skeleton-btn" />
                                <div className="skeleton-box skeleton-btn" />
                                <div className="skeleton-box skeleton-btn" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                            No se encontraron usuarios
                          </td>
                        </tr>
                      ) : (
                        <AnimatePresence>
                          {filteredUsers.map((user) => (
                            <motion.tr
                              key={user.id}
                              className={!user.isActive ? 'disabled-row' : undefined}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5, y: -10 }}
                              transition={{ duration: 0.25 }}
                            >
                              <td>{user.firstName}</td>
                              <td>{user.lastName}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`role-badge ${user.role}`}>
                                  {user.role === 'marketing' ? 'Marketing' : 'Diseñador'}
                                </span>
                              </td>
                              <td className="actions-col">
                                <button
                                  type="button"
                                  className="icon-btn edit"
                                  title="Editar usuario"
                                  onClick={() => handleEditUser(user)}
                                  disabled={!user.isActive}
                                  aria-disabled={!user.isActive ? 'true' : 'false'}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn delete"
                                  title="Eliminar usuario"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn disable"
                                  title={user.isActive ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                                  onClick={() => handleToggleStatus(user)}
                                >
                                  {user.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      )}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        isLoading={isDeleting}
      />
    </FadeIn>
  );
};

export default AdminPanel;
