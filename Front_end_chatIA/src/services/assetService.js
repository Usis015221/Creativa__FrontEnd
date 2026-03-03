import { api } from "./api";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { getImageUrl } from "../utils/imageUtils";

// ─── Campaign Assets ─────────────────────────────────────────────────

/**
 * Get all assets for a specific campaign.
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export const getAllAssets = async (campaignId) => {
  if (!campaignId) {
    console.warn("getAllAssets called without campaignId");
    return [];
  }
  const response = await api.get(`/assets?campaign_id=${campaignId}`);
  if (response.data?.success) return response.data.data;
  return response.data?.data || [];
};

/**
 * Get only parent (non-refinement) assets for a campaign.
 * Uses the parent_only filter to exclude images that are refinements.
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export const getParentAssets = async (campaignId) => {
  if (!campaignId) return [];
  const response = await api.get(
    `/assets?campaign_id=${campaignId}&parent_only=true`,
  );
  if (response.data?.success) return response.data.data;
  return response.data?.data || [];
};

/**
 * Approve an asset (moves to approved storage).
 * @param {string} assetId
 * @returns {Promise<Object>}
 */
export const updateAssetApprove = async (assetId) => {
  const response = await api.post(`/asset/${assetId}/approve`);
  return response.data;
};

/**
 * Delete an asset and its children.
 * @param {string} assetId
 * @returns {Promise<Object>}
 */
export const deleteAsset = async (assetId) => {
  const response = await api.delete(`/asset/${assetId}`);
  return response.data;
};

// ─── Filtered Assets (legacy: /assets) ───────────────────────────────

/**
 * Fetch saved assets for a campaign.
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export const getSavedAssets = async (campaignId) => {
  const response = await api.get(
    `/assets?is_saved=true&campaign_id=${campaignId}`,
  );
  return response.data.data || [];
};

/**
 * Get all globally approved assets across campaigns.
 * @returns {Promise<Array>}
 */
export const getGlobalApprovedAssets = async () => {
  const response = await api.get(`/assets?is_approved=true`);
  if (response.data?.success) return response.data.data;
  return response.data || [];
};

/**
 * Update the is_saved status of an asset.
 * @param {string} assetId
 * @param {boolean} isSaved
 * @returns {Promise<Object>}
 */
export const updateAssetSaveStatus = async (assetId, isSaved) => {
  const response = await api.patch(`/assets/${assetId}`, { is_saved: isSaved });
  return response.data.data || { id: assetId, is_saved: isSaved };
};

/**
 * Semantic vector search for assets within a campaign.
 * @param {string} query
 * @param {string} campaignId
 * @returns {Promise<Array>}
 */
export const searchAssets = async (query, campaignId) => {
  const response = await api.get(
    `/assets/search?query=${encodeURIComponent(query)}&campaign_id=${campaignId}`
  );
  if (response.data?.success) return response.data.data;
  return [];
};

// ─── Utilities ───────────────────────────────────────────────────────

/**
 * Download images and create a ZIP file.
 * @param {Array} imageUrls - Array of image URLs or asset objects
 * @param {string} zipName
 * @returns {Promise<Blob>}
 */
export const downloadImagesAsZip = async (imageUrls, zipName = "assets") => {
  const zip = new JSZip();
  const folder = zip.folder("assets");

  const urls = imageUrls.map((img) => getImageUrl(img)).filter(Boolean);

  if (urls.length === 0) {
    throw new Error("No valid image URLs found");
  }

  const promises = urls.map(async (url, index) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const extension = url.split(".").pop().split("?")[0] || "jpg";
      folder.file(`asset_${index + 1}.${extension}`, blob);
    } catch (error) {
      console.error(`Error downloading image ${index + 1}:`, error);
    }
  });

  await Promise.all(promises);
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${zipName}.zip`);
  return content;
};
