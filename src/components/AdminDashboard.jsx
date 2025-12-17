import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { Users, Shield, Plus, X, Loader2, LogOut, Search, UserPlus, CheckCircle2, Bell, BarChart2 } from 'lucide-react';
import { AdminMetrics } from './admin/AdminMetrics';
import { NotificationFeed } from './admin/NotificationFeed';
import { ProjectDetailDashboard } from './admin/ProjectDetailDashboard';

export function AdminDashboard({ onLogout }) {
    const [showUserList, setShowUserList] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showDetailed, setShowDetailed] = useState(false);

    // Project Filtering
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(''); // '' means All

    useEffect(() => {
        // Load projects for filter
        api.getLicitaciones().then(data => setProjects(data));
    }, []);

    // Render Detailed Dashboard View
    if (showDetailed && selectedProject) {
        return (
            <ProjectDetailDashboard
                projectId={selectedProject}
                onBack={() => setShowDetailed(false)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-neutral-900">
            {/* Navbar */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Admin Dashboard</span>
                </div>

                {/* Global Filter */}
                <div className="hidden md:flex items-center gap-3 bg-neutral-800 rounded-lg px-3 py-1.5 border border-neutral-700">
                    <Search className="w-4 h-4 text-neutral-400" />
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-transparent text-sm text-white font-medium focus:outline-none min-w-[200px]"
                    >
                        <option value="" className="text-black">Todas las Obras</option>
                        {projects.map(p => (
                            <option key={p.id_licitacion} value={p.id_licitacion} className="text-black">
                                {p.nombre_abreviado}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-full transition-colors ${showNotifications ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-800 text-neutral-400'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {/* Red Dot if needed */}
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border border-neutral-900"></span>
                        </button>

                        {/* Notification Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="h-[500px]">
                                    <NotificationFeed />
                                </div>
                            </div>
                        )}
                    </div>

                    <span className="text-sm text-neutral-400 hidden sm:inline">Administrador</span>
                    <button onClick={onLogout} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">

                {/* Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionCard
                        icon={Users}
                        title="Gestionar Ingenieros"
                        desc="Ver lista, permisos y roles"
                        onClick={() => setShowUserList(true)}
                        color="bg-blue-600"
                    />
                    <ActionCard
                        icon={UserPlus}
                        title="Alta de Ingeniero"
                        desc="Crear nuevo acceso"
                        onClick={() => setShowCreateUser(true)}
                        color="bg-purple-600"
                    />
                </div>

                <div className="pt-2 pb-1 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                        {selectedProject
                            ? (
                                <>
                                    Dashboard de <span className="text-orange-600">{projects.find(p => String(p.id_licitacion) === String(selectedProject))?.nombre_abreviado || 'Obra'}</span>
                                </>
                            )
                            : "Dashboard Global"
                        }
                    </h2>
                </div>

                {/* Dashboard Metrics - Filtered */}
                <AdminMetrics projectId={selectedProject} />

                {/* Detailed Metrics Button */}
                {selectedProject && (
                    <button
                        onClick={() => setShowDetailed(true)}
                        className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
                    >
                        <BarChart2 className="w-5 h-5 text-orange-400" />
                        Ver Métricas Detalladas
                    </button>
                )}
            </div>

            {/* Modals */}
            {showUserList && <UserListModal onClose={() => setShowUserList(false)} />}
            {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} />}
        </div>
    );
}

function ActionCard({ icon: Icon, title, desc, onClick, color }) {
    return (
        <button
            onClick={onClick}
            className="p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all text-left flex items-center gap-3 group"
        >
            <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-neutral-800 text-base leading-tight">{title}</h3>
                <p className="text-xs text-neutral-500">{desc}</p>
            </div>
        </button>
    )
}

// --- MODALS ---

function CreateUserModal({ onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('create_user_via_admin', {
                _email: email,
                _password: password,
                _name: name
            });

            if (error) throw error;
            if (data?.startsWith('Error:')) alert(data);
            else {
                alert("Usuario creado correctamente!");
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-neutral-900">Alta de Ingeniero</h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-neutral-400 hover:text-neutral-800" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all" />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all" />
                    <input type="text" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all" />

                    <button type="submit" disabled={loading} className="w-full h-12 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Usuario"}
                    </button>
                </form>
            </div>
        </div>
    );
}

function UserListModal({ onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('mobile_users').select('*').order('name');
        setUsers(data || []);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" /> Gestión de Usuarios
                    </h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-neutral-400 hover:text-neutral-800" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white">
                    {loading ? <Loader2 className="animate-spin mx-auto mt-10" /> : (
                        <div className="grid gap-3">
                            {users.map(u => (
                                <div key={u.id} className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-neutral-900">{u.name}</p>
                                        <p className="text-sm text-neutral-500">{u.email}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                                    </div>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => setSelectedUser(u)} className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-bold text-neutral-700 hover:bg-gray-50">
                                            Permisos
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {selectedUser && <PermissionsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    );
}

function PermissionsModal({ user, onClose }) {
    const [projects, setProjects] = useState([]);
    const [userPermissions, setUserPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const { data: allProjects } = await supabase.from('datos_licitaciones').select('id_licitacion, nombre_abreviado').eq('obra_activa', true).order('nombre_abreviado');
            const { data: perms } = await supabase.from('mobile_permissions').select('licitacion_id').eq('user_id', user.id);
            setProjects(allProjects || []);
            setUserPermissions(new Set(perms?.map(p => p.licitacion_id) || []));
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const toggle = async (licitacionId) => {
        const newSet = new Set(userPermissions);
        if (newSet.has(licitacionId)) newSet.delete(licitacionId); else newSet.add(licitacionId);
        setUserPermissions(newSet);
        try { await supabase.rpc('toggle_permission', { target_user_id: user.id, target_licitacion_id: licitacionId }); }
        catch (err) { console.error(err); alert("Error"); loadData(); }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden flex flex-col max-h-[500px]">
                <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                    <div><h4 className="font-bold text-sm">Permisos: {user.name}</h4></div>
                    <button onClick={onClose}><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : projects.map(p => {
                        const allowed = userPermissions.has(p.id_licitacion);
                        return (
                            <button key={p.id_licitacion} onClick={() => toggle(p.id_licitacion)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between ${allowed ? 'bg-green-50 text-green-800 border-green-200 border' : 'hover:bg-gray-50 text-gray-500 border border-transparent'}`}>
                                {p.nombre_abreviado}
                                {allowed && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
