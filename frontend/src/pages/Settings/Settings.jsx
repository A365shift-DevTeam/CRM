import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaPalette, FaCheck } from 'react-icons/fa6';

export default function Settings() {
    const { themeColor, setThemeColor } = useTheme();
    const [inputColor, setInputColor] = useState(themeColor);

    const handleSave = () => {
        if (/^#[0-9A-F]{6}$/i.test(inputColor) || /^#[0-9A-F]{3}$/i.test(inputColor)) {
            setThemeColor(inputColor);
        } else {
            alert('Please enter a valid hex color code (e.g., #3b82f6)');
        }
    };

    const handlePresetChange = (color) => {
        setInputColor(color);
        setThemeColor(color);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FaPalette className="text-slate-500" /> System Settings
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Appearance</h3>
                
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            Primary Theme Color (Hex Code)
                        </label>
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-10 h-10 rounded-lg shadow-inner border border-slate-200 shrink-0"
                                style={{ backgroundColor: themeColor }}
                            />
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={inputColor}
                                    onChange={(e) => setInputColor(e.target.value)}
                                    placeholder="#3b82f6"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                    style={{ '--tw-ring-color': themeColor }}
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-opacity hover:opacity-90"
                                style={{ backgroundColor: themeColor }}
                            >
                                <FaCheck size={14} /> Apply
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 mb-4">
                            Enter any valid hex code. This will update the color of sidebar links, buttons, and accents.
                        </p>

                        <div className="mt-4">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 gap-2 d-block">Quick Presets</span>
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => handlePresetChange('#10b981')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#10b981' }} 
                                    title="Default Green"
                                />
                                <button 
                                    onClick={() => handlePresetChange('#3b82f6')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#3b82f6' }} 
                                    title="Classic Blue"
                                />
                                <button 
                                    onClick={() => handlePresetChange('#8b5cf6')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#8b5cf6' }} 
                                    title="Purple"
                                />
                                <button 
                                    onClick={() => handlePresetChange('#f43f5e')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#f43f5e' }} 
                                    title="Rose"
                                />
                                <button 
                                    onClick={() => handlePresetChange('#f59e0b')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#f59e0b' }} 
                                    title="Amber"
                                />
                                <button 
                                    onClick={() => handlePresetChange('#0f172a')} 
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                                    style={{ backgroundColor: '#0f172a' }} 
                                    title="Slate"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
