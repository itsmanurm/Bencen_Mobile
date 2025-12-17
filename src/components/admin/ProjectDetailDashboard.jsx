import React from 'react';
import { ChevronLeft, BarChart2 } from 'lucide-react';

export function ProjectDetailDashboard({ projectId, onBack }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans transition-all animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-md">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-white"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="font-bold text-lg tracking-tight">Detalle de Proyecto</h1>
                    <p className="text-xs text-neutral-400">Análisis Profundo</p>
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                    <BarChart2 className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-neutral-700">Métricas Detalladas</h2>
                <p className="text-neutral-500 max-w-md">
                    Acá vas a ver tableros específicos, curvas S, y análisis de costos avanzados para este proyecto.
                </p>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    Próximamente...
                </div>
            </div>
        </div>
    );
}
