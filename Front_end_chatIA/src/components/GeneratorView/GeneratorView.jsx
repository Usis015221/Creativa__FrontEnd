import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { refineAsset, editImage } from '../../services/generatorService';
import { Sparkles, Image as ImageIcon, Wand2, Download, X, Edit3, Bookmark, Square, RectangleHorizontal, RectangleVertical, Lightbulb, Upload, ChevronLeft, ChevronRight, Palette, Maximize, Trash2, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Undo, RotateCcw, Settings, MoreVertical, Pencil } from 'lucide-react';
import { getImageUrl, downloadImage } from '../../utils/imageUtils';
import InpaintingCanvas from './InpaintingCanvas';
import LoadingSpinner from '../animations/LoadingSpinner';
import ScanningPlaceholder from '../animations/ScanningPlaceholder';
import ConfirmationModal from '../Modals/ConfirmationModal';
import './GeneratorView.css';
import creativaLogo from '../../assets/img/gg.png'
import logoCS from '../../assets/img/Logo_CS.png'
import logoVS from '../../assets/img/Logo_vs.png'

const ReferenceImagesStrip = ({ images, onDeselect }) => {
    if (!images || !Array.isArray(images) || images.length === 0) return null;

    return (
        <div className="reference-strip">
            <div className="reference-strip-header">
                <span className="reference-count">{images.length} Referencia{images.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="reference-grid">
                {images.map((img, index) => {
                    if (!img) return null;

                    // Helper to get URL safety
                    let url = null;
                    if (typeof img === 'string') url = img;
                    else if (img.preview && typeof img.preview === 'string') url = img.preview;
                    else if (img.img_url) {
                        if (typeof img.img_url === 'string') url = img.img_url;
                        else if (img.img_url.original && typeof img.img_url.original === 'string') url = img.img_url.original;
                        else if (img.img_url.url && typeof img.img_url.url === 'string') url = img.img_url.url;
                        else if (img.img_url.thumbnail && typeof img.img_url.thumbnail === 'string') url = img.img_url.thumbnail;
                    }

                    return (
                        <div key={img.id || index} className="reference-item">
                            {url ? <img src={url} alt={`Ref ${index}`} /> : <div className="placeholder-ref" />}
                            <button
                                className="remove-ref-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeselect(img);
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

function GeneratorView({
    prompt,
    setPrompt,
    style,
    setStyle,
    useReference,
    setUseReference,
    aspectRatio,
    setAspectRatio,
    setLogoType, // <-- CAMBIO V2.0
    logoType,    // <-- CAMBIO V2.0
    imageSize,
    setImageSize,
    quantity,
    setQuantity,
    handleGenerate,
    generatedImages,
    referenceImages = [],
    onDeselectReference,
    savedAssets = [],       // Received from parent (single instance)
    onToggleSaveAsset,      // Received from parent
    isGenerating = false,
    generationError = null,
    getRefinements = () => [],
    onDelete,
    campaignId,
    suggestedPrompts = [],
    suggestionsError = null,
    aiRecommendedStyle = null,
    loadingSuggestions = false,
    onRefreshSuggestions,
    wizardOpen = false,
    onOpenWizard,
    onCloseWizard,
}) {
    // ===== STATE MANAGEMENT =====
    const [mode, setMode] = useState('create'); // 'create' | 'edit'
    const [editingImage, setEditingImage] = useState(null);
    const [editHistory, setEditHistory] = useState([]); // History of iterations for current editing image
    const [isRefining, setIsRefining] = useState(false);
    const [isControlsOpen, setIsControlsOpen] = useState(true);
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [brushSize, setBrushSize] = useState(20); // Brush size for inpainting
    const canvasRef = useRef(null);

    // Collapsible Sections State
    const [openSections, setOpenSections] = useState({
        prompt: true,
        suggestions: true,
        params: true,
        refs: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Local references (dropped or uploaded locally)
    const [localReferences, setLocalReferences] = useState([]);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);

    // Display images from props
    const [localImages, setLocalImages] = useState([]);

    const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

    // Fullscreen modal state
    const [fullscreenImage, setFullscreenImage] = useState(null);

    // Canvas Toolbox state
    const [isToolboxOpen, setIsToolboxOpen] = useState(false);

    // File input ref for "Agregar imagen" button
    const fileInputRef = useRef(null);

    const handleAddImageClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const processFile = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setLocalReferences(prev => [...prev, { id: Date.now(), preview: reader.result, isLocal: true }]);
            if (!useReference) setUseReference(true);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            processFile(file);
            e.target.value = '';
        }
    };

    // Drag Handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    // getImageUrl and downloadImage are now imported from utils/imageUtils

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;

        // Handle external files
        if (files && files.length > 0) {
            processFile(files[0]);
            return;
        }

        // Handle internal drag (History -> Reference)
        const customData = e.dataTransfer.getData("application/json");
        if (customData) {
            try {
                const imgData = JSON.parse(customData);
                // Check if already in references to avoid duplicates? (logic could be refined)
                // Add to local references
                const previewUrl = getImageUrl(imgData);
                if (previewUrl) {
                    setLocalReferences(prev => [...prev, { id: Date.now(), preview: previewUrl, isLocal: true, original: imgData }]);
                    if (!useReference) setUseReference(true);
                }
            } catch (err) {
                console.error("Error parsing drag data", err);
            }
        }
    };

    const handleRemoveLocalReference = (refToRemove) => {
        if (refToRemove.isLocal) {
            setLocalReferences(prev => prev.filter(r => r !== refToRemove));
        } else {
            onDeselectReference(refToRemove.id || refToRemove); // Call parent for repository assets
        }
    };

    const handleDeleteClick = (imgToDelete) => {
        setAssetToDelete(imgToDelete);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!assetToDelete) return;

        try {
            setIsDeleting(true);

            // 1. Delete from DB (if it's a real asset with ID and onDelete is provided)
            if (onDelete && (assetToDelete.id || typeof assetToDelete === 'number')) {
                await onDelete(assetToDelete.id || assetToDelete);
            }

            // 2. Remove from local state (Visual feedback)
            if (isEditMode) {
                const newHistory = editHistory.filter(img => img !== assetToDelete);
                setEditHistory(newHistory);
                if (editingImage === assetToDelete) {
                    setEditingImage(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
                }
            } else {
                setLocalImages(prev => prev.filter(img => img !== assetToDelete));
            }

            setDeleteModalOpen(false);
            setAssetToDelete(null);
            toast.success('Imagen eliminada', {
                icon: <CheckCircle size={20} color="var(--color-success)" />
            });
        } catch (error) {
            console.error("Error confirming delete:", error);
            toast.error('Error al eliminar la imagen', {
                icon: <AlertTriangle size={20} color="var(--color-error)" />
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper to close modal
    const handleCloseDeleteModal = () => {
        if (isDeleting) return;
        setDeleteModalOpen(false);
        setAssetToDelete(null);
    };

    useEffect(() => {
        setLocalImages(generatedImages);
        if (generatedImages && generatedImages.length > 0) {
            setSelectedPreviewImage(generatedImages[generatedImages.length - 1]);
        }
    }, [generatedImages]);

    const displayImages = localImages;
    const textareaRef = useRef(null);

    // ===== MODE HANDLERS =====
    const enterEditMode = (image) => {
        setMode('edit');
        setEditingImage(image);

        // Populate history with Parent + Children (Refinements)
        const refinements = getRefinements(image.id);
        if (refinements && refinements.length > 0) {
            setEditHistory([image, ...refinements]);
        } else {
            setEditHistory([image]);
        }

        setPrompt('');

        setShowEditOverlay(true);
        setTimeout(() => {
            setShowEditOverlay(false);
        }, 1500);
    };

    const exitEditMode = () => {
        setMode('create');
        setEditingImage(null);
        setPrompt('');
    };

    // ===== ACTION HANDLERS =====

    // Style Pills Handler
    const handleStyleClick = (selectedStyle) => {
        if (setStyle) {
            setStyle(selectedStyle.toLowerCase().replace(" ", "-"));
        }
    };

    const combinedReferences = [...referenceImages, ...localReferences];

    const handlePrimaryAction = async () => {
        if (mode === 'create') {
            await handleGenerate(combinedReferences);
        } else {
            // Edit/Inpainting mode
            if (!editingImage || !prompt) return;
            setIsRefining(true);
            try {
                const baseImageURL = getImageUrl(editingImage);
                const assetId = typeof editingImage === 'object' ? editingImage.id : null;
                if (!assetId) {
                    throw new Error('No se pudo obtener el ID del asset para refinar.');
                }

                let result;
                const hasStrokes = canvasRef.current && canvasRef.current.hasStrokes();

                if (hasStrokes) {
                    const maskImage = canvasRef.current.getMask();
                    result = await editImage({
                        assetId,
                        prompt,
                        baseImageURL,
                        maskImage,
                        logoType, // <-- CAMBIO V2.0
                        campaignId,
                        style
                    });
                } else {
                    // Fallback to standard refinement if no mask drawn
                    result = await refineAsset([assetId], baseImageURL, prompt, {
                        style,
                        aspectRatio,
                        logoType, // <-- CAMBIO V2.0
                        campaignId
                    });
                }

                const refinedData = result.data || result;
                const newAssets = Array.isArray(refinedData) ? refinedData : [refinedData];

                if (newAssets.length > 0) {
                    setEditHistory([...editHistory, ...newAssets]);
                    setEditingImage(newAssets[newAssets.length - 1]);
                    setPrompt('');
                    // Clear canvas after successful generation
                    if (canvasRef.current) canvasRef.current.clear();

                    toast.success('Imagen editada con éxito', {
                        icon: <CheckCircle size={20} color="var(--color-success)" />
                    });
                } else {
                    toast.error('No se recibió imagen refinada', {
                        icon: <AlertTriangle size={20} color="var(--color-error)" />
                    });
                }
            } catch (e) {
                console.error("Refine error:", e);
                toast.error('Error al editar: ' + (e.message || 'Error desconocido'), {
                    icon: <AlertTriangle size={20} color="var(--color-error)" />
                });
            } finally {
                setIsRefining(false);
            }
        }
    };

    // ===== DERIVED STATE =====
    const isEditMode = mode === 'edit';
    const canvasImage = isEditMode
        ? editingImage
        : (selectedPreviewImage || (displayImages.length > 0 ? displayImages[displayImages.length - 1] : null));
    const showParameters = mode === 'create' || mode === 'edit';
    const showReferenceControls = mode === 'create';

    const stylePills = [
        "Cinematic", "Anime", "3D Render", "Oil Painting", "Photorealistic", "Minimalist", "Studio Commercial"
    ];

    return (
        <div className={`generator-container ${!isControlsOpen ? 'controls-collapsed' : ''}`}>
            {/* COLLAPSE BUTTON */}
            <button
                className="toggle-controls-btn"
                onClick={() => setIsControlsOpen(!isControlsOpen)}
                title={isControlsOpen ? "Ocultar controles" : "Mostrar controles"}
            >
                {isControlsOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            {/* LEFT: CONTROLS */}
            <aside className={`controls-panel ${!isControlsOpen ? 'collapsed' : ''}`}>

                {/* Scrollable Content Area */}
                <div className="controls-scroll-area">
                    {/* Mode Indicator */}
                    {isEditMode && (
                        <div className="mode-indicator">
                            <span className="mode-badge">
                                <Edit3 size={16} className="mode-icon" />
                                Modo Edición
                            </span>
                            <button
                                className="exit-mode-btn"
                                onClick={exitEditMode}
                                title="Salir del modo edición"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="section-wrapper">
                        {/* Prompt Section */}
                        <div className="section-header" onClick={() => toggleSection('prompt')}>
                            <span className="section-title">
                                {isEditMode ? 'Instrucciones' : 'Prompt'}
                            </span>
                            {openSections.prompt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        <div className={`section-content ${!openSections.prompt ? 'collapsed' : ''}`}>
                            <div className="prompt-group">
                                <textarea
                                    ref={textareaRef}
                                    className="prompt-input"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={isEditMode
                                        ? "Describe los cambios (ej. 'Añade gafas de sol', 'Cambia el fondo a playa')..."
                                        : "Describe lo que quieres generar..."}
                                    rows={4}
                                />
                                {/* Prompt Helpers */}
                                <div className="prompt-helpers" style={{ marginTop: 8 }}>
                                    <div className="style-pills">
                                        <Palette size={14} style={{ color: 'var(--color-text-muted)', marginRight: 4 }} />
                                        {stylePills.map(s => {
                                            const formattedStyle = s.toLowerCase().replace(" ", "-");
                                            return (
                                            <button
                                                key={s}
                                                className={`style-pill ${style === formattedStyle ? 'active' : ''}`}
                                                onClick={() => handleStyleClick(s)}
                                                type="button"
                                                style={{
                                                    backgroundColor: style === formattedStyle ? 'var(--color-primary)' : 'var(--bg-secondary)',
                                                    color: style === formattedStyle ? '#fff' : 'var(--color-text)',
                                                    border: style === formattedStyle ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                                                }}
                                            >
                                                {s}
                                            </button>
                                        )})}
                                    </div>
                                </div>

                                <div className="prompt-toolbar" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                                    <button
                                        className="magic-wand-btn"
                                        onClick={onOpenWizard}
                                        title="Sugerencias IA"
                                    >
                                        <Wand2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EDIT TOOLS - Only in Edit Mode */}
                    {isEditMode && (
                        <div className="section-wrapper">
                            <div className="section-header" onClick={() => toggleSection('editTools')}>
                                <span className="section-title">Herramientas de Edición</span>
                                <ChevronDown size={16} />
                            </div>
                            <div className="section-content">
                                <div className="control-group">
                                    <label>Tamaño del Pincel: {brushSize}px</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                                <div className="control-group" style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        className="canvas-action-btn"
                                        onClick={() => canvasRef.current && canvasRef.current.undo()}
                                        title="Deshacer trazo"
                                        style={{ flex: 1 }}
                                    >
                                        <Undo size={16} style={{ marginRight: 6 }} /> Deshacer
                                    </button>
                                    <button
                                        className="canvas-action-btn"
                                        onClick={() => canvasRef.current && canvasRef.current.clear()}
                                        title="Limpiar todo"
                                        style={{ flex: 1 }}
                                    >
                                        <RotateCcw size={16} style={{ marginRight: 6 }} /> Limpiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showParameters && (
                        <div className="section-wrapper">
                            <div className="section-header" onClick={() => toggleSection('params')}>
                                <span className="section-title">Configuración</span>
                                {openSections.params ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            <div className={`section-content ${!openSections.params ? 'collapsed' : ''}`}>
                                <div className="control-group">
                                    <div className="parameters-grid">

                                        <div className="control-group" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Formato</label>
                                            <div className="aspect-ratio-selector">
                                                
                                                <button
                                                    className={`ratio-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
                                                    onClick={() => setAspectRatio('1:1')}
                                                    title="Cuadrado (1:1)"
                                                >
                                                    <Square size={20} className="ratio-icon" />
                                                    <span className="ratio-label">1:1</span>
                                                </button>
                                                <button
                                                    className={`ratio-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                                                    onClick={() => setAspectRatio('16:9')}
                                                    title="Paisaje (16:9)"
                                                >
                                                    <RectangleHorizontal size={20} className="ratio-icon" />
                                                    <span className="ratio-label">16:9</span>
                                                </button>
                                                <button
                                                    className={`ratio-btn ${aspectRatio === '9:16' ? 'active' : ''}`}
                                                    onClick={() => setAspectRatio('9:16')}
                                                    title="Historia (9:16)"
                                                >
                                                    <RectangleVertical size={20} className="ratio-icon" />
                                                    <span className="ratio-label">9:16</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="control-group" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Resolución</label>
                                            <select
                                                value={imageSize || "2K"}
                                                onChange={(e) => setImageSize && setImageSize(e.target.value)}
                                                className="custom-select"
                                                style={{ width: '100%', cursor: 'pointer' }}
                                                title="Resolución de la imagen generada"
                                            >
                                                <option value="1080x1080">1080x1080 (Recomendado)</option>
                                                <option value="1080x1920">1080x1920 (Recomendado 9:16)</option>
                                                <option value="2K">2K (Estándar)</option>
                                                <option value="4K">4K (Alta calidad)</option>
                                            </select>
                                        </div>
                                        {/* Uso de logos especificos para las imagenes */}
                                        <div className="control-group" style={{ gridColumn: 'span 2' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Logo</label>
                                            <div className="aspect-ratio-selector">
                                                
                                                <button
                                                    className={`ratio-btn ${logoType === 'Ninguno' ? 'active' : ''}`} // <-- CAMBIO V2.0
                                                    onClick={() => setLogoType('Ninguno')}                            // <-- CAMBIO V2.0
                                                    title="Ningun logo"
                                                >
                                                    <img src={logoCS} className='company_logo' alt="Creativa logo" />
                                                    <span className="ratio-label">Ninguno</span>
                                                </button>
                                                <button
                                                    className={`ratio-btn ${logoType === 'Creativa' ? 'active' : ''}`} // <-- CAMBIO V2.0
                                                    onClick={() => setLogoType('Creativa')}                            // <-- CAMBIO V2.0
                                                    title="Logo de Creativa"
                                                >
                                                    <img src={creativaLogo} className='company_logo' alt="Creativa logo" />
                                                    <span className="ratio-label">Creativa</span>
                                                </button>
                                                <button
                                                    className={`ratio-btn ${logoType === 'Visible' ? 'active' : ''}`} // <-- CAMBIO V2.0
                                                    onClick={() => setLogoType('Visible')}                            // <-- CAMBIO V2.0
                                                    title="Logo de Visible"
                                                >
                                                    <img src={logoVS} className='company_logo' alt="Creativa logo" />
                                                    <span className="ratio-label">Visible</span>
                                                </button>
                                            </div>
                                        </div>

                                        {mode === 'create' && (
                                            <div className="control-group">
                                                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cantidad</label>
                                                <input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => {
                                                        const val = Math.min(4, Math.max(1, Number(e.target.value)));
                                                        setQuantity(val);
                                                    }}
                                                    className="qty-input"
                                                    min="1"
                                                    max="4"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showReferenceControls && (
                        <div className="section-wrapper">
                            <div className="section-header" onClick={() => toggleSection('refs')}>
                                <span className="section-title">Referencias</span>
                                {openSections.refs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            <div className={`section-content ${!openSections.refs ? 'collapsed' : ''}`}>
                                <div className="control-group">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <label>Usar Referencia</label>
                                            <div className="switch-container">
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={useReference}
                                                        onChange={(e) => setUseReference(e.target.checked)}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <button type="button" className="add-image-btn" onClick={handleAddImageClick} title="Subir referencia">
                                                <Upload size={14} />
                                                <span style={{ marginLeft: 8 }}>Subir</span>
                                            </button>
                                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                        </div>
                                    </div>

                                    {useReference && (
                                        <div
                                            className={`reference-section ${isDragging ? 'dragging' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            {combinedReferences.length > 0 ? (
                                                <div className={`reference-drop-zone ${isDragging ? 'active' : ''}`}>
                                                    <ReferenceImagesStrip
                                                        images={combinedReferences}
                                                        onDeselect={handleRemoveLocalReference}
                                                    />
                                                    {isDragging && <div className="reference-drop-text" style={{ marginTop: 10 }}>Sueltar para añadir referencia</div>}
                                                </div>
                                            ) : (
                                                <div className={`reference-drop-zone ${isDragging ? 'active' : ''}`}>
                                                    <div style={{ opacity: 0.7, marginBottom: 8 }}><Upload size={24} /></div>
                                                    <p className="reference-drop-text" style={{ margin: 0 }}>
                                                        Arrastra imágenes aquí o selecciona 'Subir'
                                                        <br />
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>También puedes seleccionar del repositorio o historial</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="controls-footer">
                    <button
                        className={`generate-btn ${isEditMode ? 'edit-mode' : ''}`}
                        onClick={handlePrimaryAction}
                        disabled={!prompt || (isEditMode && isRefining) || isGenerating}
                    >
                        {isGenerating ? (
                            <>Generando...</>
                        ) : isRefining ? (
                            <>Aplicando...</>
                        ) : isEditMode ? (
                            <><Edit3 size={18} /> Aplicar Cambios</>
                        ) : (
                            <> Generar</>
                        )}
                    </button>
                    {/* Error Message */}
                    {generationError && (
                        <div style={{ color: '#ff6b6b', marginTop: '10px', textAlign: 'center', fontSize: '13px' }}>
                            {generationError}
                        </div>
                    )}
                </div>
            </aside>

            {/* RIGHT: CANVAS */}
            <main className="canvas-area">



                <div className="canvas-preview">
                    {isGenerating ? (
                        <div className="preview-container">
                            <ScanningPlaceholder width="100%" height="100%" text="Generando Imagen..." />
                        </div>
                    ) : canvasImage ? (
                        <div
                            className="preview-container"
                            draggable={!isEditMode}
                            onDragStart={(e) => {
                                if (isEditMode) {
                                    e.preventDefault();
                                    return;
                                }
                                // Allow dragging the current canvas result to reference
                                e.dataTransfer.setData("application/json", JSON.stringify(canvasImage));
                            }}
                        >
                            {isEditMode ? (
                                <InpaintingCanvas
                                    ref={canvasRef}
                                    imageUrl={getImageUrl(canvasImage)}
                                    brushSize={brushSize}
                                />
                            ) : getImageUrl(canvasImage) ? (
                                <img src={getImageUrl(canvasImage)} alt="Preview" className="preview-image" />
                            ) : (
                                <div className="empty-canvas">
                                    <ImageIcon size={48} className="empty-icon" />
                                    <p>Error al cargar la imagen</p>
                                </div>
                            )}

                            {/* Canvas Toolbox - Upper Right Corner */}
                            {getImageUrl(canvasImage) && (
                                <div className="canvas-toolbox">
                                    <button
                                        className={`toolbox-toggle ${isToolboxOpen ? 'active' : ''}`}
                                        onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                                        title={isToolboxOpen ? 'Cerrar herramientas' : 'Abrir herramientas'}
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {isToolboxOpen && (
                                        <div className="toolbox-tools">
                                            <button
                                                className="toolbox-tool-item"
                                                onClick={() => setFullscreenImage(getImageUrl(canvasImage))}
                                                title="Pantalla Completa"
                                                style={{ animationDelay: '0.05s' }}
                                            >
                                                <Maximize size={18} />
                                                <span>Pantalla Completa</span>
                                            </button>

                                            <button
                                                className="toolbox-tool-item"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const imgUrl = getImageUrl(canvasImage);
                                                    if (imgUrl) {
                                                        downloadImage(imgUrl, `generacion_${Date.now()}.png`);
                                                    }
                                                }}
                                                title="Descargar imagen"
                                                style={{ animationDelay: '0.1s' }}
                                            >
                                                <Download size={18} />
                                                <span>Descargar</span>
                                            </button>

                                            <button
                                                className={`toolbox-tool-item ${canvasImage?.is_saved || savedAssets.some(a => a?.id === canvasImage?.id) ? 'saved' : ''}`}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!canvasImage?.id) {
                                                        toast.error('Error: ID de asset no encontrado');
                                                        return;
                                                    }
                                                    try {
                                                        const currentlySaved = canvasImage?.is_saved || savedAssets.some(a => a?.id === canvasImage.id);
                                                        await onToggleSaveAsset(canvasImage.id, currentlySaved);
                                                        toast.success(currentlySaved ? 'Removido de guardados' : 'Guardado en Assets!');
                                                    } catch (error) {
                                                        toast.error(`Error al guardar asset: ${error.message}`);
                                                    }
                                                }}
                                                title={canvasImage?.is_saved || savedAssets.some(a => a?.id === canvasImage?.id) ? 'Guardado' : 'Guardar en Assets'}
                                                style={{ animationDelay: '0.15s' }}
                                            >
                                                <Bookmark size={18} fill={canvasImage?.is_saved || savedAssets.some(a => a?.id === canvasImage?.id) ? 'currentColor' : 'none'} />
                                                <span>{canvasImage?.is_saved || savedAssets.some(a => a?.id === canvasImage?.id) ? 'Guardado' : 'Guardar'}</span>
                                            </button>

                                            <button
                                                className="toolbox-tool-item delete"
                                                onClick={() => handleDeleteClick(canvasImage)}
                                                title="Eliminar"
                                                style={{ animationDelay: '0.2s' }}
                                            >
                                                <Trash2 size={18} />
                                                <span>Eliminar</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {showEditOverlay && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    backdropFilter: 'blur(5px)',
                                    borderRadius: '20px',
                                    padding: '40px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    zIndex: 100,
                                    pointerEvents: 'none',
                                    animation: 'fadeIn 0.2s ease-out'
                                }}>
                                    <Edit3 size={64} color='#b7e796ff' strokeWidth={1.5} style={{ marginBottom: '15px' }} />
                                    <span style={{
                                        color: 'white',
                                        fontSize: '1.5rem',
                                        fontWeight: '600',
                                        letterSpacing: '1px'
                                    }}>
                                        MODO EDICIÓN ACTIVADO
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-canvas">
                            <Lightbulb size={48} className="empty-icon" style={{ color: '#fbbf24', opacity: 0.8 }} />
                            <p style={{ fontWeight: 500, margin: '15px 0 10px' }}>¡Empieza a crear!</p>
                            <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: 20 }}>
                                Escribe un prompt o usa el botón <Wand2 size={14} style={{ verticalAlign: 'middle', marginInline: 3 }} /> para obtener sugerencias IA.
                            </p>
                        </div>
                    )}
                </div>

                {/* History Strip - Changes based on mode */}
                <div className="history-strip">
                    <h3>{isEditMode ? 'Iteraciones de Edición' : 'Historial Reciente'}</h3>
                    <div className="history-grid">
                        {(isEditMode ? editHistory : displayImages).length === 0 ? (
                            <span className="empty-history">Tus creaciones aparecerán aquí</span>
                        ) : (
                            (isEditMode ? editHistory : displayImages).map((img, index) => {
                                const imgUrl = getImageUrl(img);
                                return (
                                    <div
                                        key={index}
                                        className={`history-item ${editingImage === img ? 'active-editing' : ''} ${!isEditMode && (selectedPreviewImage === img || (!selectedPreviewImage && index === displayImages.length - 1)) ? 'active-preview' : ''}`}
                                        onClick={() => {
                                            if (!isEditMode) setSelectedPreviewImage(img);
                                        }}
                                        style={{ cursor: 'default' }}
                                        draggable="true"
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData("application/json", JSON.stringify(img));
                                        }}
                                    >
                                        {imgUrl ? (
                                            <img src={imgUrl} alt={isEditMode ? `Iteración ${index + 1}` : `Generación ${index + 1}`} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333' }}>
                                                <ImageIcon size={24} style={{ opacity: 0.3 }} />
                                            </div>
                                        )}
                                        <div className="history-overlay">
                                            <button
                                                className="history-save-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    isEditMode ? setEditingImage(img) : enterEditMode(img);
                                                }}
                                                title="Editar"
                                                style={{ backgroundColor: 'rgba(100, 255, 218, 1)', color: '#333', borderColor: 'transparent', marginRight: '4px' }}
                                            >
                                                <Pencil size={14} />

                                            </button>
                                            <button
                                                className="history-save-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(img);
                                                }}
                                                title="Eliminar"
                                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: 'transparent' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {savedAssets.includes(img) && (
                                            <div className="saved-badge">
                                                <Bookmark size={12} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
                <div
                    className="fullscreen-modal"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button
                        className="close-modal-btn"
                        onClick={() => setFullscreenImage(null)}
                        title="Cerrar (ESC)"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Vista completa"
                        className="fullscreen-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar imagen?"
                message="¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer."
                isLoading={isDeleting}
            />

            {/* AI Suggestions Wizard Modal */}
            {wizardOpen && (
                <div className="wizard-overlay" onClick={onCloseWizard}>
                    <div className="wizard-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="wizard-header">
                            <div className="wizard-title">
                                <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                                <span>Sugerencias IA</span>
                            </div>
                            <button className="wizard-close-btn" onClick={onCloseWizard} title="Cerrar">
                                <X size={18} />
                            </button>
                        </div>

                        {aiRecommendedStyle && (
                            <div className="wizard-recommendations">
                                <span className="wizard-rec-label">Recomendado:</span>
                                <span className="wizard-rec-chip">{aiRecommendedStyle}</span>
                                {aspectRatio && <span className="wizard-rec-chip">{aspectRatio}</span>}
                                {imageSize && <span className="wizard-rec-chip">{imageSize}</span>}
                            </div>
                        )}

                        <div className="wizard-divider" />

                        {loadingSuggestions ? (
                            <div className="wizard-loading">
                                <Sparkles size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                                <span>Analizando tu campaña...</span>
                            </div>
                        ) : suggestionsError ? (
                            <div className="wizard-error">
                                <p>{suggestionsError}</p>
                            </div>
                        ) : (
                            <div className="wizard-prompts">
                                {suggestedPrompts.map((p, i) => (
                                    <div key={i} className="wizard-prompt-item">
                                        <span className="wizard-prompt-number">{i + 1}.</span>
                                        <p className="wizard-prompt-text">{p}</p>
                                        <button
                                            className="wizard-use-btn"
                                            onClick={() => {
                                                setPrompt(p);
                                                onCloseWizard();
                                            }}
                                        >
                                            Usar prompt
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="wizard-divider" />

                        <div className="wizard-actions">
                            {aiRecommendedStyle && (
                                <button
                                    className="wizard-action-btn wizard-apply-btn"
                                    onClick={() => {
                                        if (aiRecommendedStyle && setStyle) {
                                            setStyle(aiRecommendedStyle.toLowerCase().replace(/\s+/g, '-'));
                                        }
                                        toast.success('Estilo y configuración aplicados', { icon: '🎨' });
                                    }}
                                >
                                    <Palette size={15} />
                                    Aplicar estilo y configuración
                                </button>
                            )}
                            <button
                                className="wizard-action-btn wizard-refresh-btn"
                                onClick={onRefreshSuggestions}
                                disabled={loadingSuggestions}
                            >
                                <Sparkles size={15} />
                                Generar nuevas sugerencias
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneratorView;