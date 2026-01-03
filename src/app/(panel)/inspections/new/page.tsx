'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, HardHat, FileText, ArrowRight, Loader2, ClipboardCheck, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';


// Definimos la "forma" de los datos que vamos a usar
interface Company {
    id: string;
    name: string;
    rut: string;
}

interface Template {
    id: string;
    title: string;
}

interface Worker {
    id: string;
    name: string;
    role: string;
    companyId: string;
}


export default function NewInspectionPage() {

    const router = useRouter();
    const [loading, setLoading] = useState(false); // Cargando general (guardando)
    const [initialLoading, setInitialLoading] = useState(true); // Cargando datos iniciales

    // Datos para los selectores
    const [companies, setCompanies] = useState<Company[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);

    // Formulario
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedWorker, setSelectedWorker] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // 1. Cargar Empresas y Plantillas al inicio
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [resComp, resTemp] = await Promise.all([
                    fetch('/api/v1/companies'),
                    fetch('/api/v1/templates')
                ]);

                // Cargar Empresas
                if (resComp.ok) {
                    const dataComp = await resComp.json();
                    // Detectar si es array directo o viene en .data
                    const companiesList = Array.isArray(dataComp) ? dataComp : (dataComp.data || []);
                    setCompanies(companiesList);
                }

                // Cargar Plantillas
                if (resTemp.ok) {
                    const dataTemp = await resTemp.json();
                    // 👇 AQUÍ ESTÁ EL ARREGLO PARA LAS PLANTILLAS
                    // Si viene { data: [...] }, extraemos data. Si es [...], lo usamos directo.
                    const templatesList = Array.isArray(dataTemp) ? dataTemp : (dataTemp.data || []);
                    setTemplates(templatesList);
                }

            } catch (error) {
                console.error("Error cargando datos iniciales:", error);
                toast.error("Error cargando datos");
            } finally {
                setInitialLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // 2. Cargar Trabajadores cuando cambia la empresa
    useEffect(() => {
        if (!selectedCompany) {
            setWorkers([]);
            return;
        }

        const fetchWorkers = async () => {
            try {
                // Pedimos 100 para traer todos (por si hay paginación)
                const res = await fetch('/api/v1/workers?limit=100');

                if (res.ok) {
                    const responseJson = await res.json();

                    // 👇 SOLUCIÓN: Detectamos si viene dentro de ".data" o si es un array directo
                    const allWorkersList = Array.isArray(responseJson)
                        ? responseJson
                        : (responseJson.data || []); // Si es objeto, sacamos .data

                    // Ahora sí podemos filtrar porque allWorkersList es seguro un array
                    const filtered = allWorkersList.filter((w: Worker) =>
                        String(w.companyId) === String(selectedCompany)
                    );

                    setWorkers(filtered);
                }
            } catch (error) {
                console.error("Error al cargar trabajadores:", error);
                toast.error("No se pudieron cargar los trabajadores");
            }
        };
        fetchWorkers();
    }, [selectedCompany]);

    const refreshTemplates = async () => {
        const toastId = toast.loading("Actualizando listas...");
        try {
            const res = await fetch('/api/v1/templates');
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.data || []);
                setTemplates(list);
                toast.success("Plantillas actualizadas", { id: toastId });
            }
        } catch (error) {
            toast.error("Error al actualizar", { id: toastId });
        }
    };

    const handleStart = async () => {
        if (!selectedCompany || !selectedWorker || !selectedTemplate) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/v1/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: selectedCompany,
                    workerId: selectedWorker,
                    templateId: selectedTemplate
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Inspección iniciada");
                // 👇 REDIRECCIÓN: Aquí iremos a la pantalla de "Runner" (Paso siguiente)
                router.push(`/inspections/${data.id}`);
            } else {
                toast.error(data.error || "Error al iniciar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-blue-600 p-8 text-center text-white">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <ClipboardCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold">Nueva Inspección</h1>
                    <p className="text-blue-100 mt-2">Configura los detalles para comenzar la auditoría.</p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">

                    {/* 1. Selección de Empresa */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600" /> Empresa / Cliente
                        </label>
                        <select
                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={selectedCompany}
                            onChange={(e) => {
                                setSelectedCompany(e.target.value);
                                setSelectedWorker(''); // Resetear trabajador al cambiar empresa
                            }}
                        >
                            <option value="">Seleccione una empresa...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.rut})</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Selección de Trabajador (Deshabilitado si no hay empresa) */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <HardHat size={16} className="text-orange-600" /> Trabajador a Evaluar
                        </label>
                        <select
                            className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                            disabled={!selectedCompany}
                            value={selectedWorker}
                            onChange={(e) => setSelectedWorker(e.target.value)}
                        >
                            <option value="">
                                {!selectedCompany ? 'Primero seleccione una empresa' : 'Seleccione un trabajador...'}
                            </option>
                            {workers.map(w => (
                                <option key={w.id} value={w.id}>{w.name} - {w.role}</option>
                            ))}
                        </select>
                        {selectedCompany && workers.length === 0 && (
                            <p className="text-xs text-red-500">Esta empresa no tiene trabajadores registrados.</p>
                        )}
                    </div>

                    {/* 3. Selección de Plantilla */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <FileText size={16} className="text-indigo-600" /> Plantilla de Checklist
                        </label>

                        <div className="flex gap-2">
                            {/* El Selector */}
                            <select
                                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="">Seleccione un checklist...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>

                            {/* Botón Recargar (Por si creaste una en otra pestaña) */}
                            <button
                                type="button"
                                onClick={refreshTemplates}
                                className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 border border-gray-200 transition-colors"
                                title="Recargar lista"
                            >
                                <RefreshCw size={20} />
                            </button>

                            {/* Botón Crear (Abre en nueva pestaña) */}
                            <Link
                                href="/templates"
                                target="_blank" // 👈 Abre en pestaña nueva para no perder el formulario actual
                                className="p-3 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 border border-indigo-200 transition-colors flex items-center justify-center"
                                title="Crear nueva plantilla"
                            >
                                <Plus size={20} />
                            </Link>
                        </div>

                        {templates.length === 0 && (
                            <p className="text-xs text-orange-500">
                                No hay plantillas. Haz clic en el botón + para crear una.
                            </p>
                        )}
                    </div>
                    {/* Botón de Acción */}
                    <button
                        onClick={handleStart}
                        disabled={loading || !selectedCompany || !selectedWorker || !selectedTemplate}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none mt-4"
                    >
                        {loading ? (
                            <> <Loader2 className="animate-spin" /> Iniciando... </>
                        ) : (
                            <> Comenzar Inspección <ArrowRight /> </>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}