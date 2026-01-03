'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Phone, Briefcase, Loader2, X, Activity } from 'lucide-react';
import { toast } from 'sonner';

// 👇 AJUSTADO A TU SCHEMA
interface Company {
    id: string;
    rut: string;
    name: string;
    address: string | null;
    phone: string | null;
    industry: string | null;
    status: string;
    _count?: {
        inspections: number;
        workers: number;
    };
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // 👇 Estado ajustado a tus campos
    const [formData, setFormData] = useState({
        rut: '',
        name: '',
        address: '',
        phone: '',
        industry: ''
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/v1/companies');
            if (res.ok) setCompanies(await res.json());
        } catch (error) {
            toast.error("Error al cargar empresas");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/v1/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Empresa registrada correctamente");
                setIsModalOpen(false);
                setFormData({ rut: '', name: '', address: '', phone: '', industry: '' });
                fetchCompanies();
            } else {
                toast.error(data.error || "Error al guardar");
            }
        } catch (err) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-blue-600" /> Empresas / Clientes
                    </h1>
                    <p className="text-gray-500 text-sm">Gestiona las organizaciones a inspeccionar.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <Plus size={18} /> Nueva Empresa
                </button>
            </div>

            {/* LISTADO DE TARJETAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-10 flex justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : companies.length === 0 ? (
                    <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed">
                        <p className="text-gray-500">No hay empresas registradas aún.</p>
                    </div>
                ) : (
                    companies.map((company) => (
                        <div key={company.id} className="bg-white p-5 rounded-xl border hover:shadow-md transition-shadow group relative overflow-hidden">
                            {/* Borde izquierdo de estado */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${company.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 truncate pr-2">{company.name}</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                                        {company.rut}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Building2 size={16} />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 pl-2 mb-4">
                                {company.industry && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                                        <Briefcase size={14} />
                                        <span>{company.industry}</span>
                                    </div>
                                )}
                                {company.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span className="truncate">{company.address}</span>
                                    </div>
                                )}
                                {company.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} className="text-gray-400" />
                                        <span>{company.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer con estadísticas */}
                            <div className="pl-2 pt-3 border-t flex justify-between items-center text-xs text-gray-500">
                                <div className="flex gap-3">
                                    <span title="Inspecciones realizadas">📋 {company._count?.inspections || 0} Insp.</span>
                                    <span title="Trabajadores registrados">👷 {company._count?.workers || 0} Trab.</span>
                                </div>
                                {company.status === 'ACTIVE' && (
                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <Activity size={12} /> Activa
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Registrar Nueva Empresa</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium mb-1 text-gray-700">RUT Empresa</label>
                                <input
                                    required
                                    placeholder="Ej: 76.123.456-K"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.rut}
                                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Nombre / Razón Social</label>
                                <input
                                    required
                                    placeholder="Ej: Minera Escondida"
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Dirección</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Av. Principal 123, Antofagasta"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Rubro / Industria</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: Minería, Construcción"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center">
                                    {saving && <Loader2 className="animate-spin" size={16} />} Guardar Empresa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}