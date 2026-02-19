import React, { useState } from 'react';
import { industryPresets } from '../utils/presets';

const PresetSelector = ({ onSelectPreset, onClose }) => {
    const [activeCategory, setActiveCategory] = useState('software');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectPreset = (preset) => {
        onSelectPreset(preset);
        onClose();
    };

    const filteredPresets = searchQuery
        ? Object.values(industryPresets).flatMap(cat =>
            cat.presets.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        : industryPresets[activeCategory]?.presets || [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-slideUp sm:animate-fadeIn sm:mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                        Industry Presets
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search presets..."
                        className="w-full px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm sm:text-base"
                    />
                </div>

                {/* Mobile: Horizontal scrollable category pills */}
                {!searchQuery && (
                    <div className="block sm:hidden px-4 py-3 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 min-w-max">
                            {Object.entries(industryPresets).map(([key, category]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === key
                                            ? 'bg-orange-500 text-white shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex" style={{ height: 'clamp(40vh, 50vh, 55vh)' }}>
                    {/* Desktop Sidebar — hidden on mobile */}
                    {!searchQuery && (
                        <div className="hidden sm:block w-44 md:w-48 border-r border-gray-200 overflow-y-auto flex-shrink-0">
                            {Object.entries(industryPresets).map(([key, category]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${activeCategory === key
                                            ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Presets Grid */}
                    <div className="flex-1 p-3 sm:p-4 overflow-y-auto min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            {filteredPresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleSelectPreset(preset)}
                                    className="text-left p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md active:scale-[0.98] transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                                        <span className="font-semibold text-sm sm:text-base text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">
                                            {preset.name}
                                        </span>
                                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded-full text-gray-500 whitespace-nowrap flex-shrink-0">
                                            {preset.promptType}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed">
                                        {preset.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {filteredPresets.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-2">🔍</div>
                                <p className="text-sm">No presets found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Select a preset to auto-fill the prompt type and base prompt
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresetSelector;
