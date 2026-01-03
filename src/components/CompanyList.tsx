'use client';

import { useEffect, useState } from 'react';
import { Company, ApiListResponse } from '@/types';
import { Building2, Trash2, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { toast } from "sonner";
import SearchInput from './SearchInput';



interface Props {
    refreshKey: number;
    onEdit: (company: Company) => void;
}

export default function CompanyList({ refreshKey, onEdit }: Props) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Estados de Paginación y Búsqueda
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '5',
                search: search
            });

            const res = await fetch(`/api/v1/companies?${params.toString()}&t=${Date.now()}`);
            const json: ApiListResponse<Company> = await res.json();

            if (json.data) {
                setCompanies(json.data);
                setTotalPages(json.meta.totalPages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey, page, search]);

    const handleDelete = async (id: string) => {
        // Mantenemos el confirm nativo por seguridad rápida (más adelante podemos hacer un modal bonito)
        if (!confirm('¿Estás seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) return;

        setDeletingId(id);

        try {
            const res = await fetch(`/api/v1/companies/${id}`, { method: 'DELETE' });

            if (res.ok) {
                // 1. Refrescamos la lista
                fetchCompanies();

                // 2. Notificación Elegante
                toast.success('Empresa eliminada', {
                    description: 'El registro ha sido borrado de la base de datos.',
                    duration: 3000, // Se va solito a los 3 segundos
                });
            } else {
                // Intentamos leer el mensaje de error del backend
                const data = await res.json().catch(() => ({}));
                toast.error('No se pudo eliminar', {
                    description: data.error || 'Ocurrió un error inesperado al intentar borrar.'
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error de conexión', {
                description: 'Verifique su conexión a internet.'
            });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Header con Buscador */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h3 className="font-semibold text-gray-700">Listado de Clientes</h3>
                    <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
                </div>
                <div className="w-full sm:w-64">
                    <SearchInput onSearch={(val) => { setSearch(val); setPage(1); }} />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando datos...</div>
                ) : companies.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No se encontraron resultados.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {companies.map((company) => (
                                <tr key={company.id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                                <div className="text-sm text-gray-500">{company.industry || 'Sin rubro'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{company.rut}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {company.status}
                                        </span>
                                    </td>

                                    {/* AQUÍ ESTÁN LOS BOTONES DE ACCIÓN */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                                        {/* Botón EDITAR (Nuevo) */}
                                        <button
                                            onClick={() => onEdit(company)} // Llamamos a la función que nos pasó el padre
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50 mr-1"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {/* Botón ELIMINAR */}
                                        <button
                                            onClick={() => handleDelete(company.id)}
                                            disabled={deletingId === company.id}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 disabled:opacity-50"
                                            title="Eliminar"
                                        >
                                            {deletingId === company.id ? '...' : <Trash2 size={18} />}
                                        </button>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} /> Anterior
                </button>

                <span className="text-sm text-gray-500">
                    {page} / {totalPages || 1}
                </span>

                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}