import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { X, Shield, Plus, Loader2, Trash2 } from 'lucide-react';

export function RoleManager({ onClose }) {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const data = await api.getRoles();
            setRoles(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createRole(newName, newDesc);
            setNewName('');
            setNewDesc('');
            setIsCreating(false);
            loadRoles();
        } catch (e) {
            alert("Error al crear el rol: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-neutral-900">Gestión de Roles</h2>
                            <p className="text-xs text-neutral-500">Define perfiles de acceso</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-neutral-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {isCreating ? (
                        <form onSubmit={handleCreate} className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3 animate-in slide-in-from-top-2">
                            <h3 className="font-bold text-sm text-neutral-800">Nuevo Rol</h3>
                            <div>
                                <label className="text-xs font-bold text-neutral-500">Nombre del Rol</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ej: Supervisor"
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-neutral-500">Descripción</label>
                                <input
                                    type="text"
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    placeholder="Qué permite este rol..."
                                    className="w-full mt-1 p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500 text-sm"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Crear Rol
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-4 py-2 bg-white border border-gray-200 text-neutral-600 font-bold rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4" /> Crear Nuevo Rol
                        </button>
                    )}

                    <div className="space-y-2">
                        {loading ? (
                            <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
                        ) : roles.length === 0 ? (
                            <div className="text-center py-8 text-neutral-400 text-sm">
                                <p>No hay roles definidos.</p>
                                <p className="text-xs mt-1">Si es la primera vez, asegurate de correr la migración SQL.</p>
                            </div>
                        ) : (
                            roles.map(role => (
                                <div key={role.id} className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center group hover:border-orange-200 transition-colors shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-neutral-800 text-sm">{role.name}</h4>
                                        <p className="text-xs text-neutral-500">{role.description || 'Sin descripción'}</p>
                                    </div>
                                    <div className="text-xs text-neutral-400 font-mono bg-gray-50 px-2 py-1 rounded">
                                        ID: {role.id.slice(0, 8)}...
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
