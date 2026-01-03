'use client';

import { useState, useEffect } from 'react';
import { Worker as WorkerType, Company } from '@/types';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface FormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData: WorkerType | null;
}


interface FormState {
    name: string;
    email: string;
    role: string;
    phone: string;
    companyId: string;
}

export default function CreateWorkerForm({ onSuccess, onCancel, initialData }: FormProps) {
    const [saving, setSaving] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]); // Estado para guardar empresas

    const [formData, setFormData] = useState<FormState>({
        name: '',
        email: '',
        role: 'PREVENCIONISTA',
        phone: '',
        companyId: ''
    });

    // 1. Cargar lista de empresas al abrir el formulario
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await fetch('/api/v1/companies');
                if (res.ok) {
                    setCompanies(await res.json());
                }
            } catch (error) {
                console.error("Error cargando empresas");
            }
        };
        fetchCompanies();
    }, []);

    // 2. Rellenar datos si estamos editando
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                // Como ya tipamos FormState, TypeScript sabe que esto debe ser string
                email: initialData.email || '',
                role: initialData.role || 'PREVENCIONISTA',
                phone: initialData.phone || '',
                companyId: initialData.companyId || ''
            });
        } else {
            // Reset limpio
            setFormData({ name: '', email: '', role: 'PREVENCIONISTA', phone: '', companyId: '' });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = initialData
                ? `/api/v1/workers/${initialData.id}`
                : '/api/v1/workers';

            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(initialData ? 'Trabajador actualizado' : 'Trabajador creado');
                onSuccess();
            } else {
                toast.error(data.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800">
                    {initialData ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </h3>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

                {/* 👇 SELECTOR DE EMPRESA NUEVO */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <select
                        className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.companyId}
                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    >
                        <option value="">-- Sin asignar / Freelance --</option>
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                        type="tel"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <select
                        className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="PREVENCIONISTA">Prevencionista</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                        <option value="OPERARIO">Operario</option>
                    </select>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}