/**
 * Campaign Auto-Configuration
 * Deterministic mappings from campaign brief data to generator defaults.
 * These are suggestions — the designer can override them freely.
 */

const CONTENT_TYPE_TO_ASPECT_RATIO = {
    story: "9:16",
    stories: "9:16",
    reel: "9:16",
    reels: "9:16",
    post: "1:1",
    publicación: "1:1",
    publicacion: "1:1",
    banner: "16:9",
    portada: "16:9",
    cover: "16:9",
    carousel: "1:1",
    carrusel: "1:1",
};

const CHANNEL_TO_STYLE = {
    instagram: "minimalist",
    linkedin: "studio-commercial",
    facebook: "cinematic",
    tiktok: "photorealistic",
    youtube: "cinematic",
    twitter: "minimalist",
    x: "minimalist",
    pinterest: "oil-painting",
};

const OBJECTIVE_TO_STYLE = {
    branding: "minimalist",
    ventas: "studio-commercial",
    sales: "studio-commercial",
    leads: "3d-render",
    engagement: "photorealistic",
    awareness: "cinematic",
    reconocimiento: "cinematic",
    tráfico: "cinematic",
    trafico: "cinematic",
};

/**
 * Fuzzy match a value against a map's keys (case-insensitive, partial match).
 * @param {string} value - The value to match
 * @param {Object} map - The lookup map
 * @returns {string|null} The matched value or null
 */
function fuzzyMatch(value, map) {
    if (!value) return null;
    const normalized = value.toLowerCase().trim();

    // Exact match first
    if (map[normalized]) return map[normalized];

    // Partial match (the value contains a key, or a key contains the value)
    for (const [key, result] of Object.entries(map)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return result;
        }
    }

    return null;
}

/**
 * Derive recommended generator configuration from campaign brief data.
 * Returns only the fields that can be inferred; missing fields are omitted.
 *
 * @param {Object} briefData - The campaign brief_data object
 * @returns {{ aspectRatio?: string, style?: string, imageSize?: string }}
 */
export function getAutoConfig(briefData) {
    if (!briefData) return {};

    const config = {};

    // Aspect ratio from ContentType
    const aspectFromContent = fuzzyMatch(briefData.ContentType, CONTENT_TYPE_TO_ASPECT_RATIO);
    if (aspectFromContent) {
        config.aspectRatio = aspectFromContent;
    }

    // Style: prefer channel-based, fall back to objective-based
    const styleFromChannel = fuzzyMatch(briefData.publishing_channel, CHANNEL_TO_STYLE);
    const styleFromObjective = fuzzyMatch(briefData.Objective, OBJECTIVE_TO_STYLE);
    config.style = styleFromChannel || styleFromObjective || undefined;

    // Image size: default to 2K (no brief field drives this currently)
    // Could be extended later if brief includes quality requirements

    // Clean undefined values
    Object.keys(config).forEach(key => {
        if (config[key] === undefined) delete config[key];
    });

    return config;
}
