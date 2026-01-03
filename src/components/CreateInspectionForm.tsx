'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import { Company, Worker, ApiListResponse } from '@/types';

// Plantilla base (en una app real vendría de la BD)
const BASE_QUESTIONS = [
    "¿El personal cuenta con EPP completo?",
    "¿Extintores vigentes y señalizados?",
    "¿Vías de evacuación despejadas?",
    "¿Tableros eléctricos bloqueados?",
    "¿Orden y limpieza en el área?"
];

export default function CreateInspectionForm({ onSuccess }: { onSuccess: () => void }) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);

    // Estado del formulario
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedWorker, setSelectedWorker] = useState('');
    const [title, setTitle] = useState('Inspección General');

    // Estado del Checklist (inicializamos todas en false)
    const [checklist, setChecklist] = useState(
        BASE_QUESTIONS.map(q => ({ question: q, approved: false }))
    );

    const [loading, setLoading] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        Promise.all([
            fetch('/api/v1/companies').then(r => r.json()),
            fetch('/api/v1/workers').then(r => r.json())
        ]).then(([companiesRes, workersRes]) => {
            if (companiesRes.data) setCompanies(companiesRes.data);
            if (workersRes.data) setWorkers(workersRes.data);
        });
    }, []);

    const toggleCheck = (index: number) => {
        const newChecklist = [...checklist];
        newChecklist[index].approved = !newChecklist[index].approved;
        setChecklist(newChecklist);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await fetch('/api/v1/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: selectedCompany,
                    workerId: selectedWorker,
                    title,
                    checklist
                })
            });
            onSuccess(); // Recargar lista
            // Reset simple
            setChecklist(BASE_QUESTIONS.map(q => ({ question: q, approved: false })));
        } catch (error) {
            alert('Error guardando inspección');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <ClipboardCheck className="text-blue-600" />
                Nueva Auditoría en Terreno
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selectores Superiores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Cliente</label>
                        <select
                            className="w-full p-2 border rounded bg-slate-50 text-black"
                            value={selectedCompany}
                            onChange={e => setSelectedCompany(e.target.value)}
                            required
                        >
                            <option value="">-- Seleccionar --</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (Prevencionista)</label>
                        <select
                            className="w-full p-2 border rounded bg-slate-50 text-black"
                            value={selectedWorker}
                            onChange={e => setSelectedWorker(e.target.value)}
                            required
                        >
                            <option value="">-- Seleccionar --</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* El Checklist Interactivo */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Items de Revisión</h4>
                    <div className="space-y-3">
                        {checklist.map((item, idx) => (
                            <div key={idx}
                                className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all
                  ${item.approved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                onClick={() => toggleCheck(idx)}
                            >
                                <span className={`text-sm ${item.approved ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                                    {item.question}
                                </span>

                                {item.approved ? (
                                    <CheckCircle className="text-green-600" size={20} />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${(checklist.filter(i => i.approved).length / checklist.length) * 100}%` }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !selectedCompany || !selectedWorker}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : 'Finalizar Inspección'}
                </button>
            </form>
        </div>
    );
}