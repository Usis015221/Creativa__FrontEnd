import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, RotateCcw, Wand2 } from 'lucide-react';
import { getCampaignSuggestions } from '../../services/promptSuggestionService';
import LoadingSpinner from '../animations/LoadingSpinner';
import './SuggestionsHistory.css';

/**
 * Displays the history of AI-generated prompt suggestions for a campaign.
 *
 * @param {string}   campaignId     - Campaign ID to load suggestions for.
 * @param {Function} onApply        - Called with { prompts, style, settings } when user applies a suggestion.
 * @param {number}   refreshKey     - Increment to trigger a reload from outside (after a new generation).
 */
const SuggestionsHistory = ({ campaignId, onApply, refreshKey = 0 }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);

    const load = useCallback(async () => {
        if (!campaignId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getCampaignSuggestions(campaignId);
            setSuggestions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const formatDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('es-ES', {
            day:    '2-digit',
            month:  'short',
            year:   'numeric',
            hour:   '2-digit',
            minute: '2-digit',
        });
    };

    const handleApplyPrompt = (suggestion, promptIndex) => {
        onApply?.({
            prompt:   suggestion.prompts[promptIndex],
            prompts:  suggestion.prompts,
            style:    suggestion.settings?.style ?? suggestion.recommended_style,
            settings: suggestion.settings,
        });
    };

    const handleApplyAll = (suggestion) => {
        onApply?.({
            prompts:  suggestion.prompts,
            style:    suggestion.settings?.style ?? suggestion.recommended_style,
            settings: suggestion.settings,
        });
    };

    if (loading) {
        return (
            <div className="sh-container">
                <div className="sh-loading">
                    <LoadingSpinner size={20} />
                    <span>Cargando historial…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sh-container">
                <div className="sh-error">{error}</div>
            </div>
        );
    }

    return (
        <div className="sh-container">
            <div className="sh-header">
                <h3 className="sh-title">Sugerencias</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {suggestions.length > 0 && (
                        <span className="sh-count">{suggestions.length} guardada{suggestions.length !== 1 ? 's' : ''}</span>
                    )}
                    <button
                        className="sh-apply-btn"
                        onClick={load}
                        title="Recargar historial"
                        style={{ padding: '4px 10px' }}
                    >
                        <RotateCcw size={13} />
                    </button>
                </div>
            </div>

            {suggestions.length === 0 ? (
                <div className="sh-empty">
                    <Lightbulb size={36} />
                    <p>Aún no hay sugerencias guardadas.</p>
                    <p>Genera sugerencias en el Generador para verlas aquí.</p>
                </div>
            ) : (
                <div className="sh-list">
                    {suggestions.map((s) => (
                        <div key={s.id} className="sh-card">
                            {/* Card header */}
                            <div className="sh-card-header">
                                <div className="sh-card-meta">
                                    {s.recommended_style && (
                                        <span className="sh-style-badge">{s.recommended_style}</span>
                                    )}
                                    {s.settings && (
                                        <div className="sh-settings-chips">
                                            {s.settings.aspectRatio && (
                                                <span className="sh-chip">{s.settings.aspectRatio}</span>
                                            )}
                                            {s.settings.imageSize && (
                                                <span className="sh-chip">{s.settings.imageSize}</span>
                                            )}
                                            {s.settings.quantity && (
                                                <span className="sh-chip">×{s.settings.quantity}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className="sh-date">{formatDate(s.created_at)}</span>
                            </div>

                            {/* AI reasoning */}
                            {s.reasoning && (
                                <div className="sh-reasoning">"{s.reasoning}"</div>
                            )}

                            {/* Prompts list — click a prompt to apply it */}
                            <div className="sh-prompts">
                                {(Array.isArray(s.prompts) ? s.prompts : []).map((p, i) => (
                                    <div
                                        key={i}
                                        className="sh-prompt-item"
                                        onClick={() => handleApplyPrompt(s, i)}
                                        title="Clic para usar este prompt"
                                    >
                                        <span className="sh-prompt-num">{i + 1}.</span>
                                        <span className="sh-prompt-text">{p}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="sh-card-footer">
                                <button
                                    className="sh-apply-btn"
                                    onClick={() => handleApplyAll(s)}
                                >
                                    <Wand2 size={13} />
                                    Aplicar configuración
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuggestionsHistory;
