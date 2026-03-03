import { api } from "../src/services/api.js";

export let campaigns = [];

export const handleGetCampaigns = async () => {
  try {
    const response = await api.get("/campaigns/all");
    campaigns = response.data;
    return response.data;
  } catch (e) {
    console.error("Error fetching campaigns:", e);
    // Retornamos una estructura vacía segura para que React no crashee
    return { success: false, data: [] };
  }
};