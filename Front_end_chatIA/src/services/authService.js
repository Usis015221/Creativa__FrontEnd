import { api } from "./api";

export const authLogin = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
}

export const getAuthProfile = async () => {
    const response = await api.get(`/auth/profile`);
    return response;
}

export const resetPassword = (accessToken, newPassword) =>
    api.post('/auth/reset-password', { accessToken, newPassword });