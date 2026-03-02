import React, { useEffect, useState } from 'react';
import './RepositoryView.css';
import { Check, Maximize, ChevronLeft, ChevronRight, X } from 'lucide-react';
import LoadingSpinner from '../animations/LoadingSpinner';
import { searchAssets } from '../../services/assetService';

function RepositoryView({ campaignData, campaignId, selectedIds, toggleSelection, assets = [], loading = false }) {
    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState(null); // null = sin búsqueda activa
    const [isSearching, setIsSearching] = useState(false);
    const timerRef = React.useRef(null);

    // Sorted base list
    const sortedAssets = React.useMemo(() => {
        return [...assets].sort((a, b) => {
            const dateA = a.created_at || a.createdAt || a.date;
            const dateB = b.created_at || b.createdAt || b.date;
            if (dateA && dateB) return new Date(dateB) - new Date(dateA);

            const idA = Number(a.id);
            const idB = Number(b.id);
            if (!isNaN(idA) && !isNaN(idB)) return idB - idA;

            return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
        });
    }, [assets]);

    // Búsqueda vectorial con debounce de 500ms
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }
        if (!campaignId) return;

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchAssets(searchTerm, campaignId);
                setSearchResults(results);
            } catch (err) {
                console.error('[RepositoryView] Error en búsqueda vectorial:', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, campaignId]);

    // Assets a mostrar: resultados de búsqueda o lista completa
    const displayedAssets = searchResults !== null ? searchResults : sortedAssets;

    // Navigation Handlers
    const handleNext = (e) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev + 1) % displayedAssets.length);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev - 1 + displayedAssets.length) % displayedAssets.length);
    };

    // Keyboard Navigation
    useEffect(() => {
        if (activeImageIndex !== null) {
            const handleKeyDown = (e) => {
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
                if (e.key === 'Escape') setActiveImageIndex(null);
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [activeImageIndex, displayedAssets.length]);

    const handleExpandClick = (e, index) => {
        e.stopPropagation();
        setActiveImageIndex(index);
    };

    // Long press logic (keeping it just in case, but mapped to same expand action)
    const startLongPress = (index) => {
        clearLongPress();
        timerRef.current = setTimeout(() => {
            setActiveImageIndex(index);
            timerRef.current = null;
        }, 500);
    };

    const clearLongPress = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Block body scroll when modal is open
    useEffect(() => {
        if (activeImageIndex !== null) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
        return undefined;
    }, [activeImageIndex]);

    return (
        <div className='repository-container'>
            <section className='cw-top-section'>
                {/* Panel Izquierdo: Buscador y Grid */}
                <div className='cw-panel'>
                    <div className='cw-panel-header'>
                        <h3 className='cw-panel-title'>
                            Repositorio de Imágenes
                            <span style={{ fontSize: '0.8em', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                                ({searchResults !== null ? `${displayedAssets.length} de ${assets.length}` : assets.length})
                            </span>
                        </h3>
                    </div>

                    <div className='cw-search-container'>
                        <input
                            type="text"
                            placeholder="Buscar recursos..."
                            className='cw-search-bar'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className='cw-tags'>
                            {campaignData.tags.map((tag, index) => (
                                <span key={index} className='cw-tag'>{tag}</span>
                            ))}
                        </div>
                    </div>

                    <div className='cw-image-grid'>
                        {loading || isSearching ? (
                            <div className="cw-loading">
                                <LoadingSpinner text={isSearching ? "Buscando..." : "Cargando recursos..."} size={30} />
                            </div>
                        ) : displayedAssets.length > 0 ? (
                            displayedAssets.map((asset, index) => {
                                const { img_url } = asset
                                const isSelected = selectedIds.includes(asset.id);
                                return (
                                    <div
                                        key={asset.id}
                                        className={`cw-img-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSelection(asset.id)}
                                        style={{ overflow: 'hidden', padding: 0 }}
                                        onMouseDown={() => startLongPress(index)}
                                        onMouseUp={clearLongPress}
                                        onMouseLeave={clearLongPress}
                                        onTouchStart={() => startLongPress(index)}
                                        onTouchEnd={clearLongPress}
                                        onTouchMove={clearLongPress}
                                    >
                                        <img
                                            src={img_url.thumbnail}
                                            alt="Thumbnail"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        />

                                        {/* Expand Button (Replacing Delete) */}
                                        <button
                                            className="cw-expand-btn"
                                            onClick={(e) => handleExpandClick(e, index)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                padding: '4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                zIndex: 10,
                                                opacity: 0, // Hidden by default, shown on hover via CSS
                                                transition: 'opacity 0.2s, background-color 0.2s'
                                            }}
                                            title="Ver imagen completa"
                                        >
                                            <Maximize size={14} />
                                        </button>

                                        {isSelected && <div className='cw-check-icon'><Check size={16} /></div>}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="cw-empty">
                                {searchResults !== null ? `Sin resultados para "${searchTerm}"` : 'No hay imágenes en este repositorio.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Detalles (Brief) */}
                <div className='cw-panel'>
                    <div className='cw-panel-header'>
                        <h3 className='cw-panel-title'>Detalles del Proyecto</h3>
                    </div>
                    <div className='cw-details-content'>
                        <div className='cw-detail-item'>
                            <span className='cw-detail-label'>Objetivo</span>
                            <span className='cw-detail-value'>{campaignData.details.objective}</span>
                        </div>
                        <div className='cw-detail-item'>
                            <span className='cw-detail-label'>Canal</span>
                            <span className='cw-detail-value'>{campaignData.details.channel}</span>
                        </div>
                        <div className='cw-detail-item'>
                            <span className='cw-detail-label'>Público Objetivo</span>
                            <span className='cw-detail-value'>{campaignData.details.public}</span>
                        </div>
                        <div className='cw-detail-item'>
                            <span className='cw-detail-label'>Fecha Límite</span>
                            <span className='cw-detail-value'>{campaignData.details.date}</span>
                        </div>
                        <div className='cw-detail-item'>
                            <span className='cw-detail-label'>Descripción</span>
                            <span className='cw-detail-value'>{campaignData.details.description}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección Inferior: Confirmación Visual */}
            <section className='cw-bottom-section'>
                <h3 className='cw-panel-title'>Imágenes seleccionadas para uso</h3>
                <div className='cw-selected-strip'>
                    {selectedIds.length === 0 ? (
                        <p style={{ color: 'var(--color-notification)' }}>No has seleccionado imágenes aún.</p>
                    ) : (
                        selectedIds.map((id) => {
                            const asset = assets.find(a => a.id === id);
                            return (
                                <div key={id} className='cw-selected-thumb' style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {asset ? (
                                        <img
                                            src={asset.thumbnail_url || (typeof asset.img_url === 'string' ? asset.img_url : asset.img_url?.thumbnail || asset.img_url?.url)}
                                            alt="Selected"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '0.8rem' }}>IMG</span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Modal Preview with Navigation */}
            {activeImageIndex !== null && displayedAssets[activeImageIndex] && (
                <div className="rv-modal-overlay" onClick={() => setActiveImageIndex(null)}>
                    <div className="rv-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="rv-modal-close" onClick={() => setActiveImageIndex(null)} aria-label="Cerrar">
                            <X size={24} />
                        </button>

                        <button className="rv-nav-btn prev" onClick={handlePrev} title="Anterior">
                            <ChevronLeft size={32} />
                        </button>

                        <img
                            src={(typeof displayedAssets[activeImageIndex].img_url === 'string' ? displayedAssets[activeImageIndex].img_url : displayedAssets[activeImageIndex].img_url?.original) || displayedAssets[activeImageIndex].thumbnail_url || displayedAssets[activeImageIndex].img_url?.thumbnail}
                            alt="Preview"
                        />

                        <button className="rv-nav-btn next" onClick={handleNext} title="Siguiente">
                            <ChevronRight size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RepositoryView;
