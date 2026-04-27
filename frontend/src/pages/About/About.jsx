import React from 'react';
import { FaCircleInfo, FaShieldHalved, FaCodeBranch } from 'react-icons/fa6';
import { useTheme } from '../../context/ThemeContext';

export default function About() {
    const { themeColor } = useTheme();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FaCircleInfo className="text-slate-500" /> About Ambot365 Tracker
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                    className="p-8 text-white flex flex-col items-center justify-center text-center"
                    style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #0f172a 100%)` }}
                >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 border border-white/30">
                        <span className="text-3xl font-bold">Ambot365</span>
                    </div>
                    <h3 className="text-2xl font-bold">Tracker Application v2.0</h3>
                    <p className="text-white/80 mt-2 max-w-md">
                        Comprehensive management solution for CRM, Execution, Operations, and People.
                    </p>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <FaShieldHalved className="text-slate-400" /> Licensing
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Licensed to your organization. Unauthorized distribution or copying is strictly prohibited.
                            Contact support for license upgrades.
                        </p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <FaCodeBranch className="text-slate-400" /> Version Info
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                            <li><strong>UI Build:</strong> 2.0.1 (Latest)</li>
                            <li><strong>React Core:</strong> 18.x</li>
                            <li><strong>Environment:</strong> Production</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
