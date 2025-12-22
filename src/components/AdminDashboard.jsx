import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { createClient } from '@supabase/supabase-js';
import { Users, Shield, Plus, X, Loader2, LogOut, Search, UserPlus, CheckCircle2, Bell, BarChart2, Briefcase, Trash2, Mail } from 'lucide-react';
import { AdminMetrics } from './admin/AdminMetrics';
import { NotificationFeed } from './admin/NotificationFeed';
import { ProjectDetailDashboard } from './admin/ProjectDetailDashboard';
import { RoleManager } from './admin/RoleManager';

export function AdminDashboard({ onLogout }) {
    const [showUserList, setShowUserList] = useState(false);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // For forcing updates
    // Project Filtering
    const [projects, setProjects] = useState([]);

    // Persistence: Initialize from localStorage
    const [selectedProject, setSelectedProject] = useState(() => localStorage.getItem('bencen_admin_project') || '');
    const [showDetailed, setShowDetailed] = useState(() => localStorage.getItem('bencen_admin_showDetailed') === 'true');
    const [showRoles, setShowRoles] = useState(false);

    // Persistence: Save to localStorage
    useEffect(() => {
        localStorage.setItem('bencen_admin_project', selectedProject);
    }, [selectedProject]);

    useEffect(() => {
        localStorage.setItem('bencen_admin_showDetailed', String(showDetailed));
    }, [showDetailed]);

    useEffect(() => {
        // Load projects for filter
        api.getLicitaciones().then(data => {
            setProjects(data);
            if (data && data.length > 0) {
                // Validate if stored selection exists in list
                const storedId = localStorage.getItem('bencen_admin_project');
                const isValid = data.some(p => p.id_licitacion === storedId);

                if (!isValid) {
                    setSelectedProject(data[0].id_licitacion);
                }
            }
        });
    }, []);

    const handleDetailBack = () => setShowDetailed(false);

    // Render Detailed Dashboard View
    if (showDetailed && selectedProject) {
        return (
            <ProjectDetailDashboard
                projectId={selectedProject}
                onBack={handleDetailBack}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-neutral-900">
            {/* Navbar */}
            <div className="bg-neutral-900 text-white px-3 py-3 md:px-6 md:py-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="hidden sm:block font-bold text-lg tracking-tight">Admin Dashboard</span>
                </div>

                {/* Global Filter */}
                <div className="flex-1 mx-2 md:mx-4 md:flex-none flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1.5 border border-neutral-700 max-w-[200px] md:max-w-none">
                    <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-transparent text-sm text-white font-medium focus:outline-none w-full md:w-auto md:min-w-[200px] truncate"
                    >
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
                                    <NotificationFeed refreshTrigger={refreshTrigger} />
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
            <div className="flex-1 p-4 md:p-6 w-full mx-auto space-y-6">

                {/* Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ActionCard
                        icon={Users}
                        title="Gestionar Usuarios"
                        desc="Ver lista, roles y permisos"
                        onClick={() => setShowUserList(true)}
                        color="bg-blue-600"
                    />
                    <ActionCard
                        icon={UserPlus}
                        title="Alta de Usuario"
                        desc="Crear nuevo admin o ingeniero"
                        onClick={() => setShowCreateUser(true)}
                        color="bg-purple-600"
                    />
                    <ActionCard
                        icon={Briefcase}
                        title="Gestionar Roles"
                        desc="Definir perfiles dinámicos"
                        onClick={() => setShowRoles(true)}
                        color="bg-orange-600"
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
                <AdminMetrics projectId={selectedProject} refreshTrigger={refreshTrigger} />

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
            {showRoles && <RoleManager onClose={() => setShowRoles(false)} />}
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
    const [role, setRole] = useState('engineer');
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);

    useEffect(() => {
        api.getRoles().then(data => setAvailableRoles(data || []));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Use temporary client to not mess with Admin session
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
            );

            const { data, error } = await tempSupabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        role: (role === 'User' || role === 'Usuario') ? 'engineer' : role.toLowerCase(),
                        app: 'mobile'
                    }
                }
            });

            if (error) throw error;

            if (data?.user) {
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
                    <h3 className="font-bold text-xl text-neutral-900">Alta de Usuario</h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-neutral-400 hover:text-neutral-800" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rol del Usuario</label>
                        {availableRoles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {availableRoles.map(r => (
                                    <button
                                        key={r.name}
                                        type="button"
                                        onClick={() => setRole(r.name)}
                                        className={`h-10 rounded-lg border text-sm font-bold transition-all capitalize ${role === r.name ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('engineer')}
                                    className={`h-10 rounded-lg border text-sm font-bold transition-all ${role === 'engineer' ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Ingeniero
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`h-10 rounded-lg border text-sm font-bold transition-all ${role === 'admin' ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Admin
                                </button>
                            </div>
                        )}
                    </div>

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
    const [availableRoles, setAvailableRoles] = useState([]);

    useEffect(() => {
        fetchUsers();
        api.getRoles().then(data => setAvailableRoles(data || []));
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('mobile_users').select('*').order('name');
        setUsers(data || []);
        setLoading(false);
    };

    // ... inside UserListModal component ...
    const changeRole = async (userId, newRole) => {
        // Confirmation is optional but safe
        // if (!window.confirm(`¿Cambiar rol a ${newRole}?`)) return;

        try {
            const { error } = await supabase
                .from('mobile_users')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error(err);
            alert("Error al actualizar rol: " + err.message);
        }
    };

    const resendConfirmation = async (user) => {
        if (!window.confirm(`¿Reenviar correo de confirmación a "${user.email}"?`)) return;

        try {
            // Use temporary client for auth operations if needed, or main client if allowed.
            // auth.resend usually works from public client if rate limits allow
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;
            alert("Correo de confirmación reenviado exitosamente.");
        } catch (err) {
            console.error(err);
            alert("Error al reenviar correo: " + err.message);
        }
    };

    const deleteUser = async (user) => {
        if (user.email === 'test.bencen.2025@gmail.com') {
            alert("Este usuario es fundamental para pruebas y no puede ser eliminado.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de ELIMINAR al usuario "${user.name}"?\nEsta acción es irreversible.`)) return;

        try {
            const { error } = await supabase
                .from('mobile_users')
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== user.id));
        } catch (err) {
            console.error(err);
            alert("Error al eliminar usuario: " + err.message);
        }
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
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Role Selector */}
                                        <select
                                            value={u.role}
                                            onChange={(e) => changeRole(u.id, e.target.value)}
                                            className={`text-xs uppercase font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer appearance-none text-center min-w-[90px] ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                                        >
                                            {availableRoles.length > 0 ? (
                                                availableRoles.map(r => (
                                                    <option key={r.name} value={r.name}>{r.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="engineer">Ingeniero</option>
                                                    <option value="admin">Admin</option>
                                                </>
                                            )}
                                        </select>

                                        {u.role !== 'admin' && (
                                            <button onClick={() => setSelectedUser(u)} className="px-4 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold text-neutral-700 hover:bg-gray-50 h-8">
                                                Permisos
                                            </button>
                                        )}

                                        <button
                                            onClick={() => resendConfirmation(u)}
                                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Reenviar confirmación"
                                        >
                                            <Mail className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => deleteUser(u)}
                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
