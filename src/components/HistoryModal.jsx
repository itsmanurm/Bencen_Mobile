import React, { useEffect, useState } from 'react';
import { X, Calendar, User, FileText, Plus, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function HistoryModal({ item, onClose, onAddProgress }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [item]);

    const loadHistory = async () => {
        try {
            const data = await api.getItemHistory(item.id);
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="font-bold text-lg text-neutral-900">Historial de Avances</h3>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">{item.item}</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-neutral-500 hover:text-neutral-800 rounded-full hover:bg-neutral-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Item Summary & Stats */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div>
                            <p className="text-sm font-medium text-neutral-800 leading-snug">{item.descripcion}</p>
                            <div className="flex justify-between items-end mt-1">
                                <span className="text-xs text-neutral-500">Total: {Number(item.cantidad).toLocaleString('es-AR')} {item.unidad}</span>
                            </div>
                        </div>

                        {/* Progress Logic */}
                        {(() => {
                            // Calculate cumulative progress sorted by date
                            const sortedHistory = [...history].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

                            let runningTotal = 0;
                            const dataPoints = sortedHistory.map(h => {
                                runningTotal += h.avance;
                                return { date: h.fecha, total: runningTotal };
                            });

                            const totalProgress = runningTotal;
                            const isComplete = totalProgress >= 100;

                            // Chart Generation
                            const height = 60; // Increased internal height resolution
                            const width = 300; // Increased internal width resolution
                            const paddingX = 10; // Padding to avoid clipping dots
                            const paddingY = 5;

                            const maxVal = 100;

                            // Generate points for SVG Polyline
                            let points = "";
                            const effectiveWidth = width - (paddingX * 2);

                            if (dataPoints.length > 0) {
                                // If we only have one point, we can't draw a line. 
                                // Let's synthesize a "start" point at 0 if user wants timeline feel? 
                                // OR just center the single point.
                                // Logic: Distribute points evenly across effectiveWidth

                                points = dataPoints.map((p, i) => {
                                    const x = dataPoints.length === 1
                                        ? width / 2
                                        : paddingX + (i * (effectiveWidth / (dataPoints.length - 1)));

                                    // Inverted Y (SVG coords)
                                    // Scale value to height (minus paddingY to avoid clipping top)
                                    const y = height - paddingY - ((p.total / maxVal) * (height - (paddingY * 2)));
                                    return `${x},${y}`;
                                }).join(' ');
                            }

                            // Generate Fill Path
                            // Start at bottom-left (or first X), go to line points, end at bottom-right (or last X)
                            const firstX = dataPoints.length === 1 ? width / 2 : paddingX;
                            const lastX = dataPoints.length === 1 ? width / 2 : width - paddingX;

                            const fillPoints = dataPoints.length > 0
                                ? `${firstX},${height} ${points} ${lastX},${height}`
                                : "";

                            return (
                                <div className="pt-2 border-t border-gray-100">
                                    <div className="flex items-baseline justify-between mb-2">
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Avance Total</span>
                                        <span className={`text-2xl font-black ${isComplete ? 'text-green-600' : 'text-neutral-900'}`}>
                                            {totalProgress.toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* Mini Chart */}
                                    {dataPoints.length > 0 && (
                                        <div className="h-24 w-full bg-gray-50 rounded-lg relative overflow-hidden flex items-end border border-gray-100">
                                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Grid lines */}
                                                <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e5e5" strokeWidth="1" />
                                                <line x1="0" y1="0" x2={width} y2="0" stroke="#e5e5e5" strokeWidth="1" />
                                                {/* 50% line */}
                                                <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#f0f0f0" strokeWidth="1" strokeDasharray="4 4" />

                                                {/* Area Fill */}
                                                <polygon points={fillPoints} fill="url(#chartGradient)" />

                                                {/* Line */}
                                                <polyline
                                                    points={points}
                                                    fill="none"
                                                    stroke="var(--accent)"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />

                                                {/* Dots */}
                                                {dataPoints.map((p, i) => {
                                                    const x = dataPoints.length === 1
                                                        ? width / 2
                                                        : paddingX + (i * (effectiveWidth / (dataPoints.length - 1)));
                                                    const y = height - paddingY - ((p.total / maxVal) * (height - (paddingY * 2)));

                                                    return (
                                                        <g key={i}>
                                                            <circle cx={x} cy={y} r="4" fill="white" stroke="var(--accent)" strokeWidth="2" />
                                                            {/* Optional: Show value on last point? */}
                                                        </g>
                                                    );
                                                })}
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" /></div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm">No hay reportes cargados.</p>
                            </div>
                        ) : (
                            history.map((entry) => (
                                <div key={entry.id} className="relative pl-4 border-l-2 border-orange-100 pb-2 last:pb-0">
                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white"></div>

                                    <div className="bg-gray-50 rounded-lg p-3 ml-2 border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                                                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                                {new Date(entry.fecha).toLocaleDateString('es-AR')}
                                            </div>
                                            <div className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {entry.avance}%
                                            </div>
                                        </div>

                                        <p className="text-sm text-neutral-600 mb-2 italic">
                                            "{entry.observaciones}"
                                        </p>

                                        <div className="flex items-center gap-1.5 text-xs text-neutral-400 border-t border-gray-100 pt-2">
                                            <User className="w-3.5 h-3.5" />
                                            {entry.mobile_users?.name || entry.mobile_users?.email || 'Usuario Desconocido'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onAddProgress}
                        className="w-full h-12 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Avance
                    </button>
                </div>
            </div>
        </div>
    );
}
