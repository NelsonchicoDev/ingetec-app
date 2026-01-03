'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Calendar, Building2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InspectionList() {
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchInspections = async () => {
        setLoading(true);
        try {
            // Agregamos un timestamp para evitar caché
            const res = await fetch(`/api/v1/inspections?t=${Date.now()}`);
            const json = await res.json();
            if (json.data) {
                setInspections(json.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar lista");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspections();
    }, []);

    // --- FUNCIÓN PARA ELIMINAR ---
    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta inspección? Esta acción es irreversible.')) return;

        setDeletingId(id);

        try {
            const res = await fetch(`/api/v1/inspections/${id}`, { method: 'DELETE' });

            if (res.ok) {
                toast.success("Inspección eliminada");
                fetchInspections(); // Recargar la lista
            } else {
                toast.error("No se pudo eliminar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <th className="p-4">Folio / Título</th>
                        <th className="p-4">Empresa / Inspector</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {inspections.length > 0 ? (
                        inspections.map((insp) => (
                            <tr key={insp.id} className="hover:bg-gray-50 transition-colors">

                                {/* COLUMNA 1: Datos Básicos */}
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{insp.title || "Sin Título"}</div>
                                    <div className="text-xs text-gray-500 font-mono">#{insp.id.slice(0, 8)}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                        <Calendar size={12} />
                                        {new Date(insp.date).toLocaleDateString('es-CL')}
                                    </div>
                                </td>

                                {/* COLUMNA 2: Empresa y Trabajador */}
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <Building2 size={14} className="text-blue-500" />
                                        {insp.company?.name || "Empresa Borrada"}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <User size={14} className="text-purple-500" />
                                        {insp.worker?.name || "Sin Asignar"}
                                    </div>
                                </td>

                                {/* COLUMNA 3: Estado */}
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${insp.status === 'COMPLETED'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {insp.status === 'COMPLETED' ? 'FINALIZADA' : 'BORRADOR'}
                                    </span>
                                </td>

                                {/* COLUMNA 4: Botones de Acción */}
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">

                                        {/* VER REPORTE (PDF) */}
                                        <Link
                                            href={`/inspections/${insp.id}`}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver Reporte"
                                        >
                                            <Eye size={18} />
                                        </Link>

                                        {/* EDITAR / FIRMAR */}
                                        <Link
                                            href={`/inspections/${insp.id}/edit`}
                                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Continuar Inspección"
                                        >
                                            <Edit size={18} />
                                        </Link>

                                        {/* ELIMINAR */}
                                        <button
                                            onClick={() => handleDelete(insp.id)}
                                            disabled={deletingId === insp.id}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            {deletingId === insp.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                No hay inspecciones registradas aún.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}