/**
 * Campaign configuration constants.
 * Extracted from components for better maintainability and to avoid
 * re-creation on every render.
 */

/**
 * Required fields for a complete campaign brief.
 */
export const REQUIRED_FIELDS = [
  "nombre_campaing",
  "ContentType",
  "Description",
  "Objective",
  "publishing_channel",
  "company",
  "fechaPublicacion",
];

/**
 * Human-readable translations for campaign field labels.
 */
export const LABEL_TRANSLATIONS = {
  nombre_campaing: "Nombre de campaña",
  ContentType: "Tipo de contenido",
  Description: "Descripción",
  Objective: "Objetivo",
  observations: "Observaciones",
  publishing_channel: "Canal de publicación",
  company: "Empresa dueña de la campaña",
  fechaPublicacion: "Fecha de publicación",
};

/**
 * Get the translated label for a given field key.
 * @param {string} key - The field key
 * @returns {string} The translated label or the original key if not found
 */
export const getTranslatedLabel = (key) => LABEL_TRANSLATIONS[key] || key;

/**
 * Validate campaign data against required fields.
 * @param {Array<{label: string, value: string}>} summaryData - The brief data array
 * @returns {string[]} Array of missing field keys
 */
export const validateCampaignData = (summaryData) => {
  const presentLabels = summaryData.map((item) => item.label);
  return REQUIRED_FIELDS.filter((field) => !presentLabels.includes(field));
};

/**
 * Transform brief data from array format to object format.
 * @param {Array<{label: string, value: string}>} summaryData - The brief data array
 * @returns {Object} Key-value object of brief data
 */
export const formatBriefData = (summaryData) => {
  return summaryData.reduce((acc, item) => {
    acc[item.label] = item.value;
    return acc;
  }, {});
};
