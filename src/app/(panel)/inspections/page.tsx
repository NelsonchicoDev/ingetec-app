'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Calendar, User, Building, ArrowRight, Loader2, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InspectionsListPage() {
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // Para ver errores en pantalla
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInspections = async () => {
            try {
                console.log("⚡ Cargando inspecciones...");
                const res = await fetch('/api/v1/inspections');

                // Si la API falla, mostramos el texto del error
                if (!res.ok) {
                    const text = await res.text();
                    console.error("❌ Error API:", res.status, text);
                    throw new Error(`Error API: ${res.status} - ${text}`);
                }

                const data = await res.json();
                console.log("✅ Datos recibidos:", data);

                if (Array.isArray(data)) {
                    setInspections(data);
                } else {
                    console.error("⚠️ Formato incorrecto:", data);
                    setInspections([]);
                }
            } catch (error: any) {
                console.error("❌ Error JS:", error);
                setErrorMsg(error.message || "Error desconocido");
                toast.error("Error al cargar lista");
            } finally {
                setLoading(false);
            }
        };

        fetchInspections();
    }, []);

    // FILTRO SEGURO: Evita que la página se rompa si faltan datos
    const filtered = inspections.filter(i => {
        const term = searchTerm.toLowerCase();
        // Usamos '||' para que si es null, use un texto vacío y no falle
        const title = i.template?.title?.toLowerCase() || 'sin título';
        const company = i.company?.name?.toLowerCase() || 'sin empresa';
        const worker = i.worker?.name?.toLowerCase() || 'sin trabajador';

        return title.includes(term) || company.includes(term) || worker.includes(term);
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center text-blue-600 gap-2">
            <Loader2 className="animate-spin" size={32} /> Cargando lista...
        </div>
    );

    // Si hay error, lo mostramos en rojo grande
    if (errorMsg) return (
        <div className="p-10 flex flex-col items-center justify-center text-red-600">
            <AlertCircle size={48} className="mb-4" />
            <h2 className="text-xl font-bold">Ocurrió un problema</h2>
            <p className="font-mono bg-red-50 p-4 rounded mt-2 border border-red-200">{errorMsg}</p>
            <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Reintentar</button>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto pb-24">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <ClipboardList className="text-blue-600" /> Inspecciones
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">{inspections.length} registros encontrados.</p>
                </div>

                <Link href="/templates">
                    <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all">
                        <Plus size={20} /> Nueva Inspección
                    </button>
                </Link>
            </div>

            {/* BUSCADOR */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* LISTADO */}
            {filtered.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No hay inspecciones</h3>
                    <p className="text-gray-500 text-sm">Crea una nueva desde el botón azul.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((inspection) => (
                        <div key={inspection.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">

                            {/* Header Card */}
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1" title={inspection.template?.title}>
                                        {inspection.template?.title || 'Sin Plantilla'}
                                    </h3>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-2 ${inspection.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {inspection.status === 'COMPLETED' ? <FileCheck size={10} /> : <Loader2 size={10} className={inspection.status === 'DRAFT' ? '' : 'animate-spin'} />}
                                        {inspection.status === 'COMPLETED' ? 'Finalizada' : 'Borrador'}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-gray-900">{inspection.score}%</span>
                                    <p className="text-[10px] text-gray-400 uppercase">Score</p>
                                </div>
                            </div>

                            {/* Body Card */}
                            <div className="p-5 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Building size={16} className="text-gray-400" />
                                    <span className="truncate">{inspection.company?.name || 'Empresa no asignada'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <User size={16} className="text-gray-400" />
                                    <span className="truncate">{inspection.worker?.name || 'Trabajador no asignado'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>{new Date(inspection.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Footer / Botón */}
                            <div className="p-4 pt-0">
                                <Link href={`/inspections/${inspection.id}`} className="block">
                                    <button className="w-full bg-white border border-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2 group-hover:border-blue-300">
                                        {inspection.status === 'COMPLETED' ? 'Ver Reporte' : 'Continuar'} <ArrowRight size={16} />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}