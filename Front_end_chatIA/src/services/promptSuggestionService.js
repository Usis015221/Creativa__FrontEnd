/**
 * Prompt Suggestion Service
 * Fetches and retrieves AI-generated prompt suggestions based on campaign brief data.
 */

import { api } from "./api";

/**
 * Get AI-generated prompt suggestions for a campaign.
 * Fresh generations are automatically persisted to the suggestion history on the backend.
 * @param {string} campaignId
 * @param {Object} options - { style, aspectRatio, imageSize, quantity }
 * @returns {Promise<{ prompts: string[], recommendedStyle: string, reasoning: string, campaignId: string, fromCache: boolean }>}
 */
export const getSuggestedPrompts = async (campaignId, options = {}) => {
    if (!campaignId) {
        throw new Error("campaignId is required.");
    }

    try {
        const response = await api.get("/campaigns/suggest-prompts", {
            params: {
                campaignId,
                style:       options.style,
                aspectRatio: options.aspectRatio,
                imageSize:   options.imageSize,
                quantity:    options.quantity,
            },
        });

        return {
            prompts:          response.data.prompts          || [],
            recommendedStyle: response.data.recommendedStyle || null,
            reasoning:        response.data.reasoning        || null,
            campaignId:       response.data.campaignId,
            fromCache:        response.data.fromCache        || false,
        };
    } catch (error) {
        console.error("Error fetching prompt suggestions:", error);
        throw new Error(
            error.response?.data?.error ||
            "Failed to get prompt suggestions. Please try again."
        );
    }
};

/**
 * Retrieve the full history of saved suggestions for a campaign.
 * @param {string} campaignId
 * @returns {Promise<Array<{ id, campaign_id, prompts, recommended_style, reasoning, settings, created_at }>>}
 */
export const getCampaignSuggestions = async (campaignId) => {
    if (!campaignId) {
        throw new Error("campaignId is required.");
    }

    try {
        const response = await api.get("/campaigns/suggestions", {
            params: { campaignId },
        });
        return response.data.suggestions || [];
    } catch (error) {
        console.error("Error fetching suggestion history:", error);
        throw new Error(
            error.response?.data?.error ||
            "Failed to load suggestion history."
        );
    }
};
