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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        Industry Presets
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-100">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search presets..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                </div>

                <div className="flex h-[50vh]">
                    {/* Category Sidebar */}
                    {!searchQuery && (
                        <div className="w-48 border-r border-gray-200 overflow-y-auto">
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
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-3">
                            {filteredPresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleSelectPreset(preset)}
                                    className="text-left p-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                                            {preset.name}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                                            {preset.promptType}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {preset.description}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {filteredPresets.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-4xl mb-2"></div>
                                <p>No presets found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Select a preset to auto-fill the prompt type and base prompt
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresetSelector;
