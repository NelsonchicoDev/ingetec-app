'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // 👈 Importante para navegar
import { Plus, FileText, Trash2, Loader2, ListChecks, Calendar, Edit } from 'lucide-react'; // 👈 Edit importado
import { toast } from 'sonner';

interface Template {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    _count?: { inspections: number };
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/v1/templates');
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.data || []);
                setTemplates(list);
            }
        } catch (error) {
            toast.error("Error al cargar plantillas");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar esta plantilla? Se eliminará permanentemente.')) return;
        try {
            const res = await fetch(`/api/v1/templates/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Plantilla eliminada");
                fetchTemplates();
            } else {
                toast.error("No se puede eliminar (quizás tiene inspecciones asociadas)");
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Plantillas de Inspección
                    </h1>
                    <p className="text-gray-500 text-sm">Gestiona los checklist y estándares de revisión.</p>
                </div>

                <Link
                    href="/templates/builder"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-md"
                >
                    <Plus size={18} /> Nueva Plantilla
                </Link>
            </div>

            {/* LISTADO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                        <h3 className="text-gray-900 font-medium">No hay plantillas</h3>
                        <p className="text-gray-500 text-sm mb-4">Crea tu primera lista de chequeo para comenzar.</p>
                        <Link href="/templates/builder" className="text-indigo-600 font-medium hover:underline">
                            Crear Plantilla Ahora
                        </Link>
                    </div>
                ) : (
                    templates.map((template) => (
                        <div key={template.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <ListChecks size={24} />
                                </div>
                                <div className="flex gap-1">
                                    {/* 👇 AQUÍ ESTÁ EL BOTÓN QUE FALTABA (LÁPIZ AZUL) */}
                                    <Link
                                        href={`/templates/${template.id}`}
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-2 rounded-lg"
                                        title="Editar plantilla"
                                    >
                                        <Edit size={18} />
                                    </Link>

                                    {/* Botón BORRAR (Este ya lo tenías) */}
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors p-2 rounded-lg"
                                        title="Eliminar plantilla"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-1">{template.title}</h3>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-40">
                                {template.description || "Sin descripción"}
                            </p>

                            <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(template.createdAt).toLocaleDateString()}
                                </div>
                                <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                                    {template._count?.inspections || 0} Usos
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}