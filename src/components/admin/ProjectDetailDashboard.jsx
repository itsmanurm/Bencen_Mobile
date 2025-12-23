import React, { useEffect, useState } from 'react';
import { ChevronLeft, BarChart2, CheckCircle2, AlertCircle, List, Layers, Activity, ChevronRight, ChevronDown, RefreshCcw } from 'lucide-react';
import { api } from '../../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { HistoryModal } from '../HistoryModal';

export function ProjectDetailDashboard({ projectId, onBack }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'plan'
    const [viewingItem, setViewingItem] = useState(null);

    const loadData = () => {
        setLoading(true);
        api.getProjectDetails(projectId).then(data => {
            setDetails(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
            </div>
        );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans transition-all animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-white"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Detalle de Proyecto</h1>
                        <p className="text-xs text-neutral-400">Visión Integral de Avance</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Actualizar Datos"
                >
                    <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 p-4 md:p-6 w-full mx-auto space-y-6">

                {/* Top Groups & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Donut Charts Grid: Top 4 Advanced Groups (NOW 2/3 WIDTH) */}
                    <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
                        <div className="col-span-2 md:col-span-4 pb-1">
                            <h3 className="font-bold text-neutral-800 flex items-center gap-2 text-sm">
                                <BarChart2 className="w-4 h-4 text-blue-600" /> Grupos Activos (Top 4)
                            </h3>
                        </div>
                        {details?.weeklyTopGroups?.map((group, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center relative h-[140px]">
                                <h4 className="text-[10px] font-bold text-neutral-600 text-center uppercase tracking-wide line-clamp-2 px-1 mb-2 leading-tight h-8 flex items-center justify-center">
                                    {group.name}
                                </h4>
                                <div className="w-24 h-24 relative shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { value: group.totalProgress },
                                                    { value: 100 - group.totalProgress }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={32}
                                                outerRadius={45}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill={COLORS[idx % COLORS.length]} />
                                                <Cell fill="#e5e7eb" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <span className={`font-black text-lg`} style={{ color: COLORS[idx % COLORS.length] }}>
                                            {group.totalProgress.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!details?.weeklyTopGroups || details.weeklyTopGroups.length === 0) && (
                            <div className="col-span-2 md:col-span-4 text-center text-neutral-400 text-sm py-10 bg-white rounded-2xl border border-gray-100">
                                Sin avances esta semana
                            </div>
                        )}
                    </div>

                    {/* Near Completion Items - Simplified List (NOW 1/3 WIDTH) */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
                        <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" /> Próximos a Terminar (90%+)
                        </h3>
                        {details?.nearCompletion.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 py-10">
                                <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                                <p>No hay ítems.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {details?.nearCompletion.map((item, idx) => {
                                    const remaining = 100 - item.avance;
                                    return (
                                        <div key={idx} className="p-2 bg-neutral-50 border border-neutral-100 rounded-lg flex justify-between items-center group hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => setViewingItem(item)}>
                                            <div className="overflow-hidden pr-2">
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider truncate mb-0.5">{item.rubro}</p>
                                                <p className="font-medium text-xs text-neutral-800 truncate" title={item.descripcion || item.item}>
                                                    {item.descripcion || item.item}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 pl-2 border-l border-neutral-200">
                                                <span className="text-[9px] text-neutral-400 uppercase font-bold">Falta</span>
                                                <span className="font-black text-sm text-orange-500 leading-none">{remaining.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content: Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="flex border-b border-gray-100">
                        <button
                            onClick={() => setActiveTab('feed')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'feed' ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600' : 'text-neutral-500 hover:bg-gray-50'}`}
                        >
                            <Activity className="w-4 h-4" /> Feed en Vivo
                        </button>
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'plan' ? 'text-purple-600 bg-purple-50/50 border-b-2 border-purple-600' : 'text-neutral-500 hover:bg-gray-50'}`}
                        >
                            <Layers className="w-4 h-4" /> Plan Completo
                        </button>
                    </div>

                    <div className="p-0 flex-1 bg-gray-50/30">
                        {activeTab === 'feed' && (
                            <div className="divide-y divide-gray-100">
                                {details?.feed.map((report) => (
                                    <div key={report.id} className="p-4 hover:bg-white transition-colors flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                            {report.avance.toFixed(0)}%
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-neutral-900 text-sm truncate pr-2">
                                                    {report.title}
                                                </p>
                                                <span className="text-[10px] text-neutral-400 shrink-0 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-neutral-600 mb-1 line-clamp-1">{report.description}</p>
                                            <p className="text-[10px] text-neutral-400 mb-1 italic">Reportado por {report.mobile_users?.name || 'Usuario'}</p>

                                            {report.observaciones && (
                                                <p className="text-xs text-neutral-600 bg-gray-100 p-2 rounded-lg italic mt-2 border border-gray-200">
                                                    "{report.observaciones}"
                                                </p>
                                            )}

                                            {/* Image Preview */}
                                            {report.photos && report.photos.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="relative group/img max-w-sm">
                                                        <img
                                                            src={report.photos[0]}
                                                            alt="Evidencia"
                                                            className="w-full h-48 object-cover rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                                            onClick={() => window.open(report.photos[0], '_blank')}
                                                        />
                                                        {report.photos.length > 1 && (
                                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-[10px] font-bold">
                                                                +{report.photos.length - 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {details?.feed.length === 0 && (
                                    <div className="p-10 text-center text-neutral-400">Sin actividad reciente.</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'plan' && (
                            <PlanTreeView tree={details?.tree || []} onItemClick={setViewingItem} />
                        )}
                    </div>
                </div>

            </div>

            {/* Item History / Detail Modal */}
            {viewingItem && (
                <HistoryModal
                    item={viewingItem}
                    onClose={() => { setViewingItem(null); loadData(); }} // Reload to refresh data if changed
                    onUpdate={() => { /* HistoryModal handles internal updates, but we refresh parent on close */ }}
                />
            )}
        </div>
    );
}

// PREMIUM DENSE PLAN VIEW
function PlanTreeView({ tree, onItemClick }) {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedSubgroups, setExpandedSubgroups] = useState({});

    if (!tree || tree.length === 0) {
        return <div className="p-8 text-center text-neutral-400 text-sm">No hay esquema definido.</div>;
    }

    const toggleGroup = (id) => setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleSubgroup = (id) => setExpandedSubgroups(prev => ({ ...prev, [id]: !prev[id] }));

    return (
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-t border-gray-100 divide-y divide-gray-100">
            {tree.map((group) => {
                const isExpanded = expandedGroups[group.id] || false;
                const hasProgress = group.progress > 0;

                return (
                    <div key={group.id} className="bg-white">
                        {/* Group Header */}
                        <button
                            onClick={() => toggleGroup(group.id)}
                            className={`w-full px-4 py-2.5 flex items-center justify-between group transition-colors ${isExpanded ? 'bg-blue-50/20' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                                <div className="flex flex-col items-start overflow-hidden">
                                    <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wide truncate">{group.descripcion}</h3>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {hasProgress && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span>
                                )}
                                <span className="text-[10px] text-neutral-400 font-medium">{group.itemCount}</span>
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="divide-y divide-dotted divide-gray-100 bg-white">
                                {/* Subgroups */}
                                {group.subgroups?.map(subgroup => {
                                    const subExpanded = expandedSubgroups[subgroup.id] || false;
                                    const subHasProgress = subgroup.items?.some(i => i.avance > 0);

                                    return (
                                        <div key={subgroup.id}>
                                            <button
                                                onClick={() => toggleSubgroup(subgroup.id)}
                                                className="w-full pl-8 pr-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1 h-1 rounded-full ${subHasProgress ? 'bg-blue-400' : 'bg-gray-200'}`}></div>
                                                    <span className="text-xs font-bold text-neutral-600 uppercase tracking-wide text-left">{subgroup.descripcion}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {subExpanded ? <ChevronDown className="w-3 h-3 text-neutral-400" /> : <ChevronRight className="w-3 h-3 text-neutral-300" />}
                                                </div>
                                            </button>

                                            {subExpanded && (
                                                <div className="pl-6">
                                                    {subgroup.items?.map(item => (
                                                        <PlanItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Direct Items in Group */}
                                <div>
                                    {group.directItems?.map(item => (
                                        <PlanItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function PlanItemRow({ item, onClick }) {
    const isCompleted = item.avance >= 99.9;
    const inProgress = item.avance > 0 && !isCompleted;

    return (
        <button
            onClick={onClick}
            className="w-full text-left pl-8 pr-4 py-1.5 hover:bg-blue-50/10 flex items-center justify-between text-xs group transition-all border-l-[3px] border-transparent hover:border-blue-400"
        >
            <div className="flex-1 pr-4 min-w-0 flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCompleted ? 'bg-green-500 shadow-sm shadow-green-200' : inProgress ? 'bg-blue-500 shadow-sm shadow-blue-200' : 'bg-gray-200'}`}></div>
                <div className="min-w-0">
                    <p className="font-medium text-neutral-700 truncate group-hover:text-blue-700 transition-colors">{item.descripcion}</p>
                    <p className="font-mono text-[9px] text-neutral-400">{item.item}</p>
                </div>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
                {inProgress || isCompleted ? (
                    <span className={`font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                        {item.avance.toFixed(0)}%
                    </span>
                ) : (
                    <span className="text-neutral-300">-</span>
                )}
            </div>
        </button>
    );
}
