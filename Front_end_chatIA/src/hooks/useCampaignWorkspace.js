import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCampaignsContext } from "./useCampaignsContext";
import { useCampaignsById } from "./useDesigners";
import { useGenerator } from "./useGenerator";
import { useRepository } from "./useRepository";

/**
 * Lightweight orchestrator hook for the Campaign Workspace.
 * Composes useGenerator and useRepository instead of managing all state directly.
 */
export const useCampaignWorkspace = () => {
  const { campaignId } = useParams();
  const { selectedCamp, setSelectedCamp } = useCampaignsContext();
  const { fetchCampaignsById } = useCampaignsById();

  // --- Campaign normalisation ---
  const campaign = Array.isArray(selectedCamp) ? selectedCamp[0] : selectedCamp;
  const brief = campaign?.brief_data;

  const defaultCampaignData = {
    designer: "Juan Carlos",
    title: "Campaña de reclutamiento de pasantes",
    status: "En proceso",
    details: {
      objective: "Contactar estudiantes de diseño para pasantías de verano.",
      channel: "Instagram, LinkedIn",
      public: "Universitarios 18-24 años",
      date: "12 de Octubre, 2023",
      description: "Se requiere un estilo visual dinámico y juvenil.",
    },
    tags: ["Reclutamiento", "Oficina", "Jóvenes", "Tecnología", "Verano", "Equipo"],
  };

  const campaignData = campaign
    ? {
      designer: "Juan Carlos",
      title: brief?.nombre_campaing || "Sin título",
      status: campaign.status === "draft" ? "En Proceso" : campaign.status,
      details: {
        objective: brief?.Objective || "No especificado",
        channel: brief?.publishing_channel || "No especificado",
        public: "General",
        date: brief?.fechaPublicacion || "No especificada",
        description: brief?.Description || "Sin descripción",
      },
      tags: brief?.ContentType ? [brief.ContentType] : ["General"],
    }
    : defaultCampaignData;

  // --- UI State ---
  const [activeTab, setActiveTab] = useState("Repositorio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Composed Hooks ---
  const generatorState = useGenerator(campaign, campaignId, fetchCampaignsById, setSelectedCamp, brief);
  const repositoryState = useRepository();

  // --- Effects ---

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 950);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Recovery: fetch campaign if not in context but we have campaignId in URL
  useEffect(() => {
    if (!campaignId) return;
    const recoverCampaign = async () => {
      try {
        const data = await fetchCampaignsById(campaignId);
        setSelectedCamp(data);
      } catch (error) {
        console.error("Error recovering campaign:", error);
      }
    };
    recoverCampaign();
  }, [campaignId, fetchCampaignsById, setSelectedCamp]);

  return {
    // Data
    campaignData,
    campaign,

    // UI State
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,

    // Generator (delegated)
    ...generatorState,

    // Repository (delegated)
    ...repositoryState,
  };
};
