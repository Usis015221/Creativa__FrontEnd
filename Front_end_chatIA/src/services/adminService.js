import { api } from "./api";

// ── Usuarios ──────────────────────────────────────────────────────────────────

export const getUsers = () =>
    api.get('/admin/users');

export const createUser = (data) =>
    api.post('/admin/users', data);

export const updateUser = (id, data) =>
    api.put(`/admin/users/${id}`, data);

export const deleteUser = (id) =>
    api.delete(`/admin/users/${id}`);

export const toggleUserStatus = (id, is_active) =>
    api.patch(`/admin/users/${id}/status`, { is_active });

// ── Solicitudes de Recuperación ───────────────────────────────────────────────

export const getRequests = () =>
    api.get('/admin/requests');

export const updateRequestStatus = (id, status, adminNotes) =>
    api.patch(`/admin/requests/${id}`, { status, adminNotes });

export const sendResetLink = (id) =>
    api.post(`/admin/requests/${id}/send-reset`);

export const createRequest = (data) =>
    api.post('/admin/requests', data);
