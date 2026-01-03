'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Shield, Trash2, Loader2, X, Pencil, AlertCircle } from 'lucide-react'; // Agregamos Pencil y AlertCircle
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function UsersPage() {
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Estado para saber si estamos editando (si es null, estamos creando)
    const [editingUser, setEditingUser] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/v1/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            toast.error("Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    };

    // Abrir modal para CREAR
    const handleOpenCreate = () => {
        setEditingUser(null); // Modo Crear
        setFormData({ name: '', email: '', password: '', role: 'USER' });
        setIsModalOpen(true);
    };

    // Abrir modal para EDITAR
    const handleOpenEdit = (user: UserData) => {
        setEditingUser(user.id); // Modo Editar
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Contraseña vacía para no sobrescribir si no quiere cambiarla
            role: user.role
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();

            if (res.ok) {
                toast.success("Usuario eliminado");
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Si editingUser tiene ID, usamos PUT, si no, usamos POST
        const method = editingUser ? 'PUT' : 'POST';
        const url = editingUser ? `/api/v1/users/${editingUser}` : '/api/v1/users';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
                setIsModalOpen(false);
                fetchUsers();
            } else {
                toast.error(data.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-500 text-sm">Administra el acceso de tu equipo.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Usuario</th>
                                <th className="px-6 py-4 font-medium">Rol</th>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-gray-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {/* Solo mostrar eliminar si no es él mismo */}
                                        {user.id !== currentUserId && (
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL REUTILIZABLE */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-900">
                                {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    // Requerido solo si estamos creando, opcional si editamos
                                    required={!editingUser}
                                    placeholder={editingUser ? "Dejar en blanco para mantener actual" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Rol</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="USER">Inspector</option>
                                    <option value="ADMIN">Administrador</option>
                                    <option value="SUPERADMIN">Super Admin</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}