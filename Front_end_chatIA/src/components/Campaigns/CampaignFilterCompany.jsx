import React from 'react';
import '../../layouts/ViewCampaignsMarketing/ViewCampaignsMarketing.css'; // Inherit styles

const CampaignFilter = ({ activeFilter, onFilterChange, sections }) => {
    return (
        <div role="tablist" className="filter-tabs">
            <button
                role="tab"
                aria-selected={activeFilter === 'all'}
                className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange('all')}
            >
                Todos
            </button>
            {sections.map(section => (
                <button
                    key={section.id}
                    role="tab"
                    aria-selected={activeFilter === section.id}
                    className={`filter-tab ${activeFilter === section.id ? 'active' : ''}`}
                    onClick={() => onFilterChange(section.id)}
                >
                    {section.label}
                </button>
            ))}
        </div>
    );
};

export default CampaignFilter;
