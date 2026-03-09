import React from 'react';
import './CampaignWorkspace.css';
import './ImgGenerated.css';
import { Menu } from 'lucide-react';
import { useCampaignWorkspace } from '../../hooks/useCampaignWorkspace';
import { useSavedAssets } from '../../hooks/useSavedAssets';

import RepositoryView from '../../components/RepositoryView/RepositoryView';
import GeneratorView from '../../components/GeneratorView/GeneratorView';
import SavedAssetsView from '../../components/SavedAssetsView/SavedAssetsView';
import ImageUser from '../../components/ImageUser/ImageUser';

const CampaignWorkspace = () => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    let nameUser = user?.firstName || "US";
    let lastName = user?.lastName || " ";
    nameUser = nameUser.substring(0, 1).toUpperCase();
    lastName = lastName.substring(0, 1).toUpperCase();
    let fullName = nameUser + lastName;
    const {
        // Data
        campaignData,
        campaign,

        // UI State
        activeTab, setActiveTab,
        isSidebarOpen, setIsSidebarOpen,

        // Repository
        assets, loadingAssets, selectedIds, toggleSelection,
        handleDeleteAsset, handleApproveAsset,

        // Generator
        prompt, setPrompt,
        style, setStyle,
        useReference, setUseReference,
        aspectRatio, setAspectRatio,
        // --- CAMBIO V2.0 ---
        logoType, setLogoType,
        // -------------------
        imageSize, setImageSize,
        quantity, setQuantity,
        generatedImages, handleGenerate,
        isGenerating, generationError,
        getRefinements,

        // Prompt suggestions
        suggestedPrompts,
        recommendedStyle,
        loadingSuggestions,
        suggestionsError,
        refreshSuggestions,

        // Wizard
        wizardOpen,
        setWizardOpen,
        openSuggestionsWizard,
    } = useCampaignWorkspace();

    // Single instance of saved assets — passed as props to children (DRY)
    const { savedAssets, loading: savedLoading, toggleSaveAsset } = useSavedAssets(campaign?.id);

    const designerName = campaignData.designer || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || "Diseñador";

    return (
        <div className='cw-layout'>
            {/* Overlay for mobile when sidebar is open */}
            <div
                className={`cw-overlay ${isSidebarOpen ? 'visible' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`cw-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className='cw-profile'>
                    <ImageUser Initials={fullName} name="UserDesingerImg" nameContainer="imgUserDesinger" />
                    <h3 className='cw-user-name'>{designerName}</h3>
                </div>

                <nav className='cw-nav-menu'>
                    <button
                        className={`cw-nav-item ${activeTab === 'Repositorio' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Repositorio')}
                    >
                        Repositorio
                    </button>
                    <button
                        className={`cw-nav-item ${activeTab === 'Generador' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Generador')}
                    >
                        Generador Img
                    </button>
                    <button
                        className={`cw-nav-item ${activeTab === 'Assets' ? 'active' : ''}`}
                        onClick={() => setActiveTab('Assets')}
                    >
                        Assets
                    </button>
                </nav>
            </aside>

            <main className='cw-main-content'>
                <header className='cw-header'>
                    <div className='cw-header-left'>
                        <button
                            className="cw-toggle-sidebar"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <Menu />
                        </button>
                        <h1 className='cw-title'>{campaignData.title}</h1>
                        <span className='cw-status'>{campaignData.status}</span>
                    </div>
                </header>

                {activeTab === 'Repositorio' && (
                    <RepositoryView
                        campaignData={campaignData}
                        campaignId={campaign?.id}
                        selectedIds={selectedIds}
                        toggleSelection={toggleSelection}
                        assets={assets}
                        loading={loadingAssets}
                        onDelete={handleDeleteAsset}
                    />
                )}

                {activeTab === 'Generador' && (
                    <GeneratorView
                        designerName={designerName}
                        prompt={prompt}
                        setPrompt={setPrompt}
                        style={style}
                        setStyle={setStyle}
                        useReference={useReference}
                        setUseReference={setUseReference}
                        aspectRatio={aspectRatio}
                        setAspectRatio={setAspectRatio}
                        // --- CAMBIO V2.0 ---
                        setLogoType={setLogoType}
                        logoType={logoType}
                        // -------------------
                        imageSize={imageSize}
                        setImageSize={setImageSize}
                        quantity={quantity}
                        setQuantity={setQuantity}
                        handleGenerate={handleGenerate}
                        generatedImages={generatedImages}
                        referenceImages={assets.filter(asset => selectedIds.includes(asset.id))}
                        onDeselectReference={toggleSelection}
                        savedAssets={savedAssets}
                        onToggleSaveAsset={toggleSaveAsset}
                        isGenerating={isGenerating}
                        generationError={generationError}
                        getRefinements={getRefinements}
                        onDelete={handleDeleteAsset}
                        campaignId={campaign?.id}
                        suggestedPrompts={suggestedPrompts}
                        suggestionsError={suggestionsError}
                        aiRecommendedStyle={recommendedStyle}
                        loadingSuggestions={loadingSuggestions}
                        onRefreshSuggestions={refreshSuggestions}
                        wizardOpen={wizardOpen}
                        onOpenWizard={openSuggestionsWizard}
                        onCloseWizard={() => setWizardOpen(false)}
                    />
                )}

                {activeTab === 'Assets' && (
                    <SavedAssetsView
                        campaignId={campaign?.id}
                        savedAssets={savedAssets}
                        loading={savedLoading}
                        toggleSaveAsset={toggleSaveAsset}
                        onApprove={handleApproveAsset}
                    />
                )}

            </main>
        </div>
    );
};

export default CampaignWorkspace;