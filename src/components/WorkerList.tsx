'use client';

import { useState, useEffect, useCallback } from 'react';
import { Worker, MetaData } from '@/types';
import { Edit, Trash2, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkerListProps {
    refreshKey: number;
    onEdit: (worker: Worker) => void;
}

export default function WorkerList({ refreshKey, onEdit }: WorkerListProps) {
    // 1. Estados
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<MetaData | null>(null);

    // 2. DEFINICIÓN DE LA FUNCIÓN (Primero)
    // Definimos fetchWorkers ANTES de usarla
    const fetchWorkers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '5',
                search: search
            });

            const res = await fetch(`/api/v1/workers?${params}`);
            const data = await res.json();

            if (res.ok) {
                setWorkers(data.data);
                setMeta(data.meta);
            } else {
                toast.error("Error cargando datos");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    // 3. USO DE LA FUNCIÓN (Después)
    // Ahora useEffect puede ver fetchWorkers porque ya fue definida arriba
    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers, refreshKey]);

    // 4. Función Auxiliar (handleDelete)
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este trabajador?')) return;

        try {
            const res = await fetch(`/api/v1/workers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Trabajador eliminado');
                fetchWorkers();
            } else {
                toast.error('Error al eliminar');
            }
        } catch (error) {
            toast.error('Error de servidor');
        }
    };

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {/* BARRA DE BÚSQUEDA */}
            <div className="p-4 border-b flex gap-2 bg-gray-50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {/* TABLA */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium">Nombre / Email</th>
                            <th className="px-6 py-4 font-medium">Rol</th>
                            <th className="px-6 py-4 font-medium">Teléfono</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center">
                                    <Loader2 className="animate-spin mx-auto text-blue-600" />
                                </td>
                            </tr>
                        ) : workers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No se encontraron resultados.
                                </td>
                            </tr>
                        ) : (
                            workers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{worker.name}</div>
                                        <div className="text-gray-500 text-xs">{worker.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                                            {worker.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{worker.phone || '-'}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(worker)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(worker.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PAGINACIÓN */}
            {meta && meta.totalPages > 1 && (
                <div className="p-4 border-t flex justify-between items-center bg-gray-50">
                    <span className="text-xs text-gray-500">
                        Página {meta.page} de {meta.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={page === meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}