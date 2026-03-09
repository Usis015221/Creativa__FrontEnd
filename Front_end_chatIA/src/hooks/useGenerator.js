import { useState, useEffect, useCallback, useRef } from "react";
import toast from 'react-hot-toast';
import { generateImages } from "../services/generatorService";
import { getParentAssets, getAllAssets } from "../services/assetService";
import { getSuggestedPrompts, getCampaignSuggestions } from "../services/promptSuggestionService";
import { getAutoConfig } from "../config/campaignAutoConfig";

/**
 * Hook for managing image generation state and actions.
 * Single Responsibility: only handles generator-related logic.
 *
 * @param {Object|null} campaign - Campaign object (needs .id and .assets)
 * @param {string} campaignId - Campaign ID from URL params
 * @param {Function} fetchCampaignsById - Function to refresh campaign data
 * @param {Function} setSelectedCamp - Setter for selected campaign context
 * @param {Object|null} briefData - Campaign brief_data for auto-config and prompt suggestions
 */
export function useGenerator(campaign, campaignId, fetchCampaignsById, setSelectedCamp, briefData) {
    // --- States ---
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("cinematic");
    const [useReference, setUseReference] = useState(true);
    const [aspectRatio, setAspectRatio] = useState("1:1");
    // --- CAMBIO V2.0: Estandarizado a logoType ---
    const [logoType, setLogoType] = useState("Ninguno"); 
    const [imageSize, setImageSize] = useState("2K");
    const [quantity, setQuantity] = useState(1);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState(null);

    // --- Prompt Suggestions State ---
    const [suggestedPrompts, setSuggestedPrompts] = useState([]);
    const [recommendedStyle, setRecommendedStyle] = useState(null); // New state
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState(null);

    // Track if auto-config has been applied for this campaign to avoid overriding user changes
    const autoConfigAppliedRef = useRef(null);

    // --- Wizard state ---
    const [wizardOpen, setWizardOpen] = useState(false);

    // --- Auto-config from brief data (Option 2: deterministic) ---
    useEffect(() => {
        if (!briefData || autoConfigAppliedRef.current === campaignId) return;

        const config = getAutoConfig(briefData);
        if (config.aspectRatio) setAspectRatio(config.aspectRatio);
        if (config.style) setStyle(config.style);
        if (config.imageSize) setImageSize(config.imageSize);

        autoConfigAppliedRef.current = campaignId;
    }, [briefData, campaignId]);

    // --- Fetch AI prompt suggestions ---
    const fetchSuggestions = useCallback(async (isInitialLoad = false) => {
        if (!campaignId) return;
        setLoadingSuggestions(true);
        setSuggestionsError(null);

        try {
            const options = {
                aspectRatio,
                imageSize,
                quantity,
                style: isInitialLoad ? undefined : style,
            };

            const result = await getSuggestedPrompts(campaignId, options);

            if (result.prompts) {
                setSuggestedPrompts(result.prompts);
            }

            if (result.recommendedStyle) {
                const recommended = result.recommendedStyle.toLowerCase().replace(/\s+/g, '-');
                setRecommendedStyle(result.recommendedStyle);
                setStyle(recommended);
            }

            // Return whether this was a fresh save so callers can refresh history
            return { saved: !result.fromCache };

        } catch (error) {
            console.error("Error fetching prompt suggestions:", error);
            setSuggestionsError(error.message);
            setSuggestedPrompts([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [campaignId, style, aspectRatio, imageSize, quantity]);

    // --- Open wizard: load from DB history, briefData cache, or generate via API ---
    const openSuggestionsWizard = useCallback(async () => {
        setWizardOpen(true);

        // 1. If briefData already has AI suggestions (from campaign creation), use them
        if (briefData?.ai_config?.prompts) {
            const config = briefData.ai_config;
            setSuggestedPrompts(config.prompts);
            if (config.recommendedStyle) {
                setRecommendedStyle(config.recommendedStyle);
            }
            return;
        }

        // 2. Check DB for previously saved suggestions (most recent first)
        if (campaignId) {
            setLoadingSuggestions(true);
            setSuggestionsError(null);
            try {
                const history = await getCampaignSuggestions(campaignId);
                if (history && history.length > 0) {
                    const latest = history[0]; // already sorted by created_at desc
                    setSuggestedPrompts(latest.prompts || []);
                    if (latest.recommended_style) {
                        setRecommendedStyle(latest.recommended_style);
                    }
                    setLoadingSuggestions(false);
                    return;
                }
            } catch (err) {
                console.warn("Could not load suggestion history, falling back to API:", err);
            }
            setLoadingSuggestions(false);
        }

        // 3. Nothing in DB — generate new suggestions via API
        await fetchSuggestions(true);
    }, [briefData, campaignId, fetchSuggestions]);

    // --- Load parent images on mount / when campaignId changes ---
    useEffect(() => {
        if (!campaignId) return;
        let cancelled = false;

        const loadImages = async () => {
            try {
                const images = await getParentAssets(campaignId);
                if (!cancelled) setGeneratedImages(images || []);
            } catch (error) {
                console.error("Error loading parent assets:", error);
            }
        };

        loadImages();
        return () => { cancelled = true; };
    }, [campaignId]);

    // --- Get refinements (children) for a parent asset ---
    const getRefinements = useCallback((parentId) => {
        if (!campaign?.assets) return [];
        return campaign.assets.filter(
            (asset) => asset.parent_asset_id === parentId,
        );
    }, [campaign]);

    // --- Generate images ---
    const handleGenerate = async (referenceImages = []) => {
        if (!prompt || prompt.trim().length === 0) {
            setGenerationError("Por favor ingresa un prompt");
            return;
        }
        if (!campaign?.id) {
            setGenerationError("No hay campaña seleccionada");
            return;
        }

        try {
            setIsGenerating(true);
            setGenerationError(null);

            const result = await generateImages({
                prompt,
                style,
                aspectRatio,
                imageSize,
                // --- CAMBIO V2.0: Pasamos los nombres correctos al servicio ---
                resolution: imageSize, 
                logoType, 
                // --------------------------------------------------------------
                quantity,
                useReference,
                referenceImages,
                campaignId: campaign.id,
            });

            const assetObjects = Array.isArray(result)
                ? result
                : (result.data?.assets || result.assets || []);

            if (assetObjects.length > 0) {
                setGeneratedImages((prev) => [...prev, ...assetObjects]);

                // Refresh campaign data in the background
                try {
                    const freshData = await fetchCampaignsById(campaignId);
                    setSelectedCamp(freshData);
                } catch (refreshError) {
                    console.warn("Could not refresh campaign data after generation:", refreshError);
                }
            } else {
                setGenerationError("No se generaron imágenes. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error generating images:", error);
            setGenerationError(
                error.message || "Error al generar imágenes. Intenta de nuevo.",
            );
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        prompt,
        setPrompt,
        style,
        setStyle,
        useReference,
        setUseReference,
        aspectRatio,
        setAspectRatio,
        // --- CAMBIO V2.0 ---
        logoType,
        setLogoType,
        // -------------------
        imageSize,
        setImageSize,
        quantity,
        setQuantity,
        generatedImages,
        setGeneratedImages,
        isGenerating,
        generationError,
        handleGenerate,
        getRefinements,

        // Prompt suggestions
        suggestedPrompts,
        recommendedStyle,
        loadingSuggestions,
        suggestionsError,
        refreshSuggestions: fetchSuggestions,

        // Wizard
        wizardOpen,
        setWizardOpen,
        openSuggestionsWizard,
    };
}