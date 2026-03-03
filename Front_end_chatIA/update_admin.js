const fs = require('fs');
const content = fs.readFileSync('src/components/Admin/AdminPanel.jsx', 'utf8');

let newContent = content.replace(
  "import { UserPlus, Edit2, Trash2, Lock, Unlock } from 'lucide-react';",
  "import { UserPlus, Edit2, Trash2, Lock, Unlock, Search, Filter, Shield, Mail, User, Users } from 'lucide-react';"
);

// Helper for initials
const helperCode = `
const getInitials = (firstName, lastName) => {
  const f = firstName ? firstName.charAt(0) : '';
  const l = lastName ? lastName.charAt(0) : '';
  return (f + l).toUpperCase() || 'U';
};

const AdminPanel = () => {`;

newContent = newContent.replace('const AdminPanel = () => {', helperCode);

// Header
newContent = newContent.replace(
  '<div className="admin-header">\n          <h2>Panel de Administración</h2>\n        </div>',
  `<div className="admin-header">
          <h2>Panel de Administración</h2>
          <p>Gestiona los usuarios, roles y permisos de la plataforma Creativa.</p>
        </div>`
);

// Form header
newContent = newContent.replace(
  '<form className={`admin-form ${isEditing ? \'editing\' : \'\'}`} onSubmit={onSubmit}>',
  `<form className={\`admin-form \${isEditing ? 'editing' : ''}\`} onSubmit={onSubmit}>
              <div className="form-header-title">
                <Shield size={18} />
                <span>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</span>
              </div>`
);

// Table controls
newContent = newContent.replace(
  `<div className="table-header-row">
                <h3>USUARIOS</h3>
                <div className="user-controls">`,
  `<div className="table-header-row">
                <div className="table-stats">
                  <div className="stat-badge">
                    <Users size={16} /> Usuarios: <span>{filteredUsers.length}</span>
                  </div>
                </div>
                <div className="user-controls">`
);

newContent = newContent.replace(
  `<input
                    className="user-search"
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />`,
  `<div className="search-container">
                    <Search size={16} />
                    <input
                      className="user-search"
                      type="text"
                      placeholder="Buscar usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>`
);

newContent = newContent.replace(
  `<select
                    className="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >`,
  `<div className="search-container">
                    <Filter size={16} />
                    <select
                      className="role-filter"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >`
);

newContent = newContent.replace(
  `<option value="lock">Deshabilitados</option>
                  </select>`,
  `<option value="lock">Deshabilitados</option>
                    </select>
                  </div>`
);

// Table Headers
newContent = newContent.replace(
  `<thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Correo Electronico</th>
                      <th>Rol</th>
                      <th className="actions-col">Acciones</th>
                    </tr>
                  </thead>`,
  `<thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th className="actions-col">Acciones</th>
                    </tr>
                  </thead>`
);

// Empty State
newContent = newContent.replace(
  `<td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                            No se encontraron usuarios
                          </td>`,
  `<td colSpan="4">
                            <div className="empty-state">
                              <Users />
                              <h4>No se encontraron usuarios</h4>
                              <p>Ajusta los filtros de búsqueda o agrega un nuevo usuario.</p>
                            </div>
                          </td>`
);

// Skeleton Row
newContent = newContent.replace(
  `<tr key={\`skel-\${i}\`} className="skeleton-row">
                            <td><div className="skeleton-box skeleton-text" /></td>
                            <td><div className="skeleton-box skeleton-text" /></td>
                            <td><div className="skeleton-box skeleton-email" /></td>
                            <td><div className="skeleton-box skeleton-badge" /></td>
                            <td className="actions-col">`,
  `<tr key={\`skel-\${i}\`} className="skeleton-row">
                            <td>
                              <div className="user-info-cell">
                                <div className="skeleton-box skeleton-avatar" />
                                <div>
                                  <div className="skeleton-box skeleton-text" />
                                  <div className="skeleton-box skeleton-email" />
                                </div>
                              </div>
                            </td>
                            <td><div className="skeleton-box skeleton-badge" /></td>
                            <td><div className="skeleton-box skeleton-badge" style={{width: '70px'}} /></td>
                            <td className="actions-col">`
);

// Data Row
newContent = newContent.replace(
  `<td>{user.firstName}</td>
                              <td>{user.lastName}</td>
                              <td>{user.email}</td>
                              <td>`,
  `<td>
                                <div className="user-info-cell">
                                  <div className="user-avatar">
                                    {getInitials(user.firstName, user.lastName)}
                                  </div>
                                  <div className="user-details">
                                    <span className="user-name">{user.firstName} {user.lastName}</span>
                                    <span className="user-email">{user.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td>`
);

newContent = newContent.replace(
  `<span className={\`role-badge \${user.role}\`}>
                                  {user.role === 'marketing' ? 'Marketing' : 'Diseñador'}
                                </span>
                              </td>`,
  `<span className={\`role-badge \${user.role}\`}>
                                  {user.role === 'marketing' ? 'Marketing' : 'Diseñador'}
                                </span>
                              </td>
                              <td>
                                <span className={\`status-badge \${user.isActive ? 'active' : 'inactive'}\`}>
                                  <span className="status-dot"></span>
                                  {user.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>`
);

// Left form inputs
newContent = newContent.replace(
  `<input
                    id="name"
                    name="firstName"`,
  `<div className="input-with-icon">
                    <User size={16} />
                    <input
                      id="name"
                      name="firstName"`
);
newContent = newContent.replace(
  `onChange={handleInputChange}
                    required
                  />
                </div>`,
  `onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>`
);

newContent
