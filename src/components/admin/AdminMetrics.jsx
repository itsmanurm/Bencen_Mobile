import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Building2, CalendarCheck, CheckCircle } from 'lucide-react';

export function AdminMetrics({ projectId, refreshTrigger }) {
    const [metrics, setMetrics] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [financials, setFinancials] = useState({ totalScope: 0, totalExecuted: 0 });
    const [dateRange, setDateRange] = useState(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 15);
        return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    });

    useEffect(() => {
        setLoading(true);
        const promises = [
            api.getDashboardMetrics(projectId),
            api.getWeeklyActivity(projectId, dateRange.start, dateRange.end)
        ];

        if (projectId) {
            promises.push(api.getProjectFinancials(projectId));
        }

        Promise.all(promises).then(([kpis, weekly, fin]) => {
            setMetrics(kpis);
            setChartData(weekly);
            if (fin) setFinancials(fin);
            else setFinancials({ totalScope: 0, totalExecuted: 0 });
            setLoading(false);
        });
    }, [projectId, dateRange, refreshTrigger]);

    const setPreset = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
    };

    // Calculate "Weekly Momentum"
    const weeklyProgressSum = chartData.reduce((acc, day) => acc + (day.progressSum || 0), 0);
    const weeklyMoneySum = chartData.reduce((acc, day) => acc + (day.money || 0), 0);

    // Derived Calculations
    const hasProject = !!projectId;
    const globalPercent = financials.totalScope > 0 ? (financials.totalExecuted / financials.totalScope) * 100 : 0;
    const weeklyPercentOfTotal = financials.totalScope > 0 ? (weeklyMoneySum / financials.totalScope) * 100 : 0;

    const formatPercentVal = (val) => `${Number(val).toFixed(2)}%`;
    const formatPoints = (val) => `${Number(val).toLocaleString('es-AR')} pts`;

    const formatDateTick = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    };

    if (loading) return <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>;

    // Prepare chart data: Convert money to % of total scope if project selected
    const chartDataProcessed = chartData.map(d => {
        if (hasProject && financials.totalScope > 0) {
            return { ...d, displayValue: (d.money / financials.totalScope) * 100 };
        }
        return { ...d, displayValue: d.money || 0 }; // Fallback to raw points/money for global view (or hide)
    });

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${hasProject ? 'lg:grid-cols-4' : ''}`}>
                <KPICard
                    icon={Building2}
                    label="Obras Activas"
                    value={metrics?.activeProjects || 0}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <KPICard
                    icon={Users}
                    label="Ingenieros Asignados"
                    value={metrics?.activeEngineers || 0}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <KPICard
                    icon={CalendarCheck}
                    label="Reportes Hoy"
                    value={metrics?.reportsToday || 0}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                {hasProject && (
                    <KPICard
                        icon={CheckCircle}
                        label="Items Completados"
                        value={`${metrics?.completedItems || 0} / ${metrics?.totalItems || 0}`}
                        color="text-orange-600"
                        bg="bg-orange-50"
                    />
                )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Weekly Activity Chart */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        <h3 className="font-bold text-neutral-800 text-sm">Producción Semanal (Impacto %)</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Presets */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                {[7, 15, 30].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setPreset(d)}
                                        className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                    >
                                        {d}D
                                    </button>
                                ))}
                            </div>
                            {/* Custom Inputs */}
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                className="h-7 text-xs border border-gray-200 rounded-md px-1 w-24 bg-gray-50 text-gray-600 focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                            <span className="text-gray-300 text-xs">-</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                className="h-7 text-xs border border-gray-200 rounded-md px-1 w-24 bg-gray-50 text-gray-600 focus:ring-1 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartDataProcessed}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateTick}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    minTickGap={30}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#f97316', strokeWidth: 1 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-xl z-50">
                                                    <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{formatDateTick(label)}</p>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-lg font-black text-neutral-800">
                                                            {hasProject ? formatPercentVal(data.displayValue) : formatPoints(data.displayValue)}
                                                        </span>
                                                        <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md w-fit">
                                                            {data.parts} {data.parts === 1 ? 'Reporte' : 'Reportes'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="displayValue"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorReports)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Status / Volume */}
                <div className="bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-800 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-1">
                            {hasProject ? "Avance Global" : "Volumen Semanal"}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-6">
                            {hasProject ? "Porcentaje ponderado del proyecto" : "Puntos de actividad acumulados"}
                        </p>

                        <div className="flex items-end gap-3 flex-wrap">
                            {hasProject ? (
                                <>
                                    <span className="text-5xl font-black text-white">{globalPercent.toFixed(2)}%</span>
                                    <div className="flex flex-col mb-1">
                                        <span className="text-sm text-green-400 font-bold flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4" /> +{weeklyPercentOfTotal.toFixed(2)}%
                                        </span>
                                        <span className="text-xs text-neutral-500">esta semana</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl xl:text-5xl font-black text-white truncate">
                                        {formatPoints(weeklyMoneySum)}
                                    </span>
                                    <span className="text-xs text-neutral-500 w-full">* Indicador de Actividad Ponderada</span>
                                </>
                            )}
                        </div>

                        {/* Hidden Financial Details as requested */}
                    </div>
                    {/* Decorative bg */}
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <TrendingUp className="w-48 h-48" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ icon: Icon, label, value, color, bg, trend }) {
    return (
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center shadow-inner`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-neutral-900">{value}</span>
                    {trend && <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{trend}</span>}
                </div>
            </div>
        </div>
    );
}
