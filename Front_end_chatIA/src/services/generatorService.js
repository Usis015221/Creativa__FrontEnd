/**
 * Generator Service
 * Professional service layer for AI content generation (prompts and images)
 * Connects to backend /image routes
 */

import { api } from "./api";

/**
 * Build optimized prompt from brief data.
 * NOTE: Prompt optimization (PromptBuilder) runs server-side inside GenerateImagesUseCase.
 * This function is kept for UI convenience — it returns the brief as-is.
 *
 * @param {Object|string} briefData - Campaign brief data
 * @returns {Promise<string>} The prompt string
 */
export const buildPrompt = async (briefData) => {
  // PromptBuilder runs server-side, so we just return the raw brief
  const brief = typeof briefData === "string" ? briefData : briefData.brief || "";
  return brief;
};

/**
 * Generate images using AI
 * Backend returns normalized: [{ id, img_url, prompt_used, campaign_id, status }]
 *
 * @param {Object} config - Generation configuration
 * @param {string} config.prompt - Image generation prompt
 * @param {string} config.campaignId - Campaign ID
 * @param {string} [config.aspectRatio='1:1'] - Aspect ratio
 * @param {number} [config.quantity=1] - Number of images (1-4)
 * @param {string} [config.style='cinematic'] - Visual style
 * @returns {Promise<Array>} Array of { id, img_url, prompt_used, campaign_id, status }
 */
export const generateImages = async (config) => {
  try {
   
    const payload = {
      prompt: config.prompt,
      numberOfImages: config.quantity || 1,
      campaignId: config.campaignId,
      style: config.style || "cinematic",
      logo: config.logoRatio || "Ninguno",
      imageConfig: {
        aspectRatio: config.aspectRatio || "1:1",
        imageSize: config.imageSize || "2K",
      },
    };

    if (config.useReference && config.referenceImages && config.referenceImages.length > 0) {
      // Extract URL string from reference image objects
      payload.referenceImageURLs = config.referenceImages.map(ref =>
        typeof ref === 'string' ? ref : (ref.preview || ref.img_url?.original || ref.img_url || ref.url)
      ).filter(Boolean);

      if (payload.referenceImageURLs.length > 0) {
        payload.referenceType = "subject";
      }
    }

    const response = await api.post("/image/generate", payload);

    // Backend now returns [{ id, img_url, prompt_used, ... }] directly
    return response.data;
  } catch (error) {
    console.error("Error generating images:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to generate images. Please try again.",
    );
  }
};

/**
 * Edit an image using inpainting or refinement.
 * Supports both:
 *   - Inpainting: sends assetId + maskImage + prompt
 *   - Refinement: sends assetId + prompt (no mask)
 *
 * Backend resolves assetId → URL internally.
 * Returns [{ id, img_url, prompt_used, campaign_id, status, parent_asset_id }]
 */
export const editImage = async (editData) => {
  try {
    const payload = {
      assetId: editData.assetId,
      prompt: editData.prompt,
      baseImageURL: editData.baseImageURL,
      referenceImageURLs: editData.referenceImageURLs || [],
      maskImage: editData.maskImage || null,
      campaignId: editData.campaignId,
      style: editData.style,
      logo: editData.logo || "Ninguno",
      config: editData.config || {},
    };

    const response = await api.post("/image/edit", payload);
    return response.data;
  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to edit image. Please try again.",
    );
  }
};

/**
 * Refine existing assets — uses the same /image/edit endpoint without a mask.
 * 
 * @param {Array<string>} assetIds - IDs of assets to refine
 * @param {string} refinementPrompt - Instructions for refinement
 * @param {Object} options - Additional options (style, aspectRatio, campaignId)
 * @returns {Promise<Array>} Array of refined asset objects
 */
export const refineAsset = async (assetIds, baseImageURL, refinementPrompt, options = {}) => {
  try {
    // Process each asset ID through the edit endpoint (no mask = refinement)
    const results = await Promise.all(
      assetIds.map((assetId) =>
        editImage({
          assetId,
          baseImageURL: baseImageURL,
          prompt: refinementPrompt,
          maskImage: null, // No mask = full image refinement
          style: options.style,
          logo: options.logoRatio,
          campaignId: options.campaignId,
          config: options.aspectRatio ? { aspectRatio: options.aspectRatio } : {},
        }),
      ),
    );

    // Flatten results (each editImage returns an array)
    return results.flat();
  } catch (error) {
    console.error("Error refining asset:", error);
    throw new Error(
      error.response?.data?.message ||
      "Failed to refine asset. Please try again.",
    );
  }
};

/**
 * @deprecated Use buildPrompt instead
 */
export const enhancePrompt = async (brief) => {
  console.warn("enhancePrompt is deprecated. Use buildPrompt instead.");
  return buildPrompt(brief);
};

/**
 * Save assets — assets are auto-saved during generation.
 * This is kept for backward compatibility but is a no-op.
 */
export const saveAssets = async (saveData) => {
  console.warn("saveAssets: Assets are auto-saved during generation. This call is a no-op.");
  return { success: true, message: "Assets are auto-saved during generation." };
};
