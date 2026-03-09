import { api } from "./api";

export const getDesigners = async () => {
  const response = await api.get("/profile/designers");
  return response.data.data;
};

export const sendCampaign = async (campaign) => {
  try {
    const payload = {
      user_id: campaign.user_id,
      data: campaign.briefData, // Backend expects 'data' key for brief_data
      idCampaing: campaign.brief_id, // Backend expects 'idCampaing' if updating
      designer_id: campaign.designer_id,
    };

    // Remove undefined keys to keep payload clean
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );

    const response = await api.post("/campaigns/registerCampaigns", payload);
    return response;
  } catch (e) {
    console.error("Error in sendCampaign:", e);
    throw e;
  }
};

export const getCampaigns = async (designerId) => {

  try {
    const response = await api.get(`/campaigns/designers`, {
      params: { designerId },
    });

    return response.data.data;
  } catch (e) {
    console.error("Error in getCampaigns:", e);
    throw e;
  }
};

export const updateCampaignStatus = async (campaignId, status) => {
  try {
    const response = await api.put("/campaigns/updateStateCampaign", {
      campaignId,
      status,
    });

    return response;
  } catch (e) {
    console.error("Error in updateCampaignStatus:", e);
    throw e;
  }
};

export const getCampaignById = async (campaignId) => {
  const userStr = localStorage.getItem("user");
  const user = JSON.parse(userStr);
  const userId = user.id;
  
  // Extraemos el rol de forma segura
  const rawRole = user.role || user.user_metadata?.role || '';
  const role = String(rawRole).toLowerCase().trim();

  try {
    // Parámetros base
    const params = { campaignId };

    // SOLO enviamos el designerId si el rol es diseñador. 
    // De esta forma, Marketing no será filtrado ni excluido por la base de datos.
    if (role === 'designer' || role === 'diseñador') {
      params.designerId = userId;
    }

    const response = await api.get("/campaigns/campaignById", { params });

    return response.data.data;
  } catch (e) {
    console.error("Error in getCampaignById:", e);
    throw e;
  }
};
