'use client';

import { useState, useEffect } from 'react';
import { User, Building, Save, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para los formularios
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        userRole: '',
        companyName: '',
        companyRut: '',
        companyAddress: '',
        companyLogoUrl: ''
    });

    // Validar si es SuperAdmin para habilitar campos
    const isSuperAdmin = formData.userRole === 'SUPERADMIN';

    // 1. CARGAR DATOS AL INICIAR
    useEffect(() => {
        fetch('/api/v1/settings')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setFormData({
                        userName: data.user.name || '',
                        userEmail: data.user.email || '',
                        userRole: data.user.role || 'USER',
                        companyName: data.company?.name || '',
                        companyRut: data.company?.rut || '',
                        companyAddress: data.company?.address || '',
                        companyLogoUrl: data.company?.logoUrl || ''
                    });
                }
            })
            .catch(err => toast.error("Error cargando datos"))
            .finally(() => setLoading(false));
    }, []);

    // Helpers para Inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const formatearRut = (rut: string) => {
        const valor = rut.replace(/[^0-9kK]/g, '');
        if (valor.length <= 1) return valor;
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1).toUpperCase();
        const cuerpoFormateado = cuerpo.split('').reverse().reduce((acc, curr, i) => {
            return curr + (i > 0 && i % 3 === 0 ? '.' : '') + acc;
        }, '');
        return `${cuerpoFormateado}-${dv}`;
    };

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoRut = formatearRut(e.target.value);
        if (nuevoRut.length <= 12) {
            setFormData({ ...formData, companyRut: nuevoRut });
        }
    };

    // 2. GUARDAR DATOS
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/v1/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (res.ok) {
                toast.success("Configuración guardada correctamente");
                if (activeTab === 'profile') {
                    // Si cambiamos datos críticos, recargamos para actualizar sesión
                    window.location.reload();
                }
            } else {
                toast.error(json.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="max-w-4xl mx-auto pb-10 p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h1>

            <div className="flex flex-col md:flex-row gap-6">

                {/* MENU LATERAL */}
                <div className="w-full md:w-64 shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <User size={18} /> Mi Perfil
                    </button>
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'company' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Building size={18} /> Empresa
                    </button>
                </div>

                {/* AREA DE FORMULARIO */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <form onSubmit={handleSave}>

                        {/* TAB: PERFIL */}
                        {activeTab === 'profile' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Información Personal</h2>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input
                                        name="userName"
                                        value={formData.userName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <input
                                        name="userEmail"
                                        value={formData.userEmail}
                                        onChange={handleChange}
                                        disabled={!isSuperAdmin}
                                        className={`w-full border border-gray-300 rounded-lg p-2 outline-none ${!isSuperAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                                            }`}
                                    />
                                    {!isSuperAdmin && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><ShieldAlert size={12} /> Solo SuperAdmin puede cambiar correos.</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol de Usuario</label>
                                    <select
                                        name="userRole"
                                        value={formData.userRole}
                                        onChange={handleChange}
                                        disabled={!isSuperAdmin}
                                        className={`w-full border border-gray-300 rounded-lg p-2 outline-none ${!isSuperAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                                            }`}
                                    >
                                        <option value="USER">Usuario (Inspector)</option>
                                        <option value="ADMIN">Administrador</option>
                                        <option value="SUPERADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* TAB: EMPRESA */}
                        {activeTab === 'company' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Datos de la Organización</h2>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social / Fantasía</label>
                                    <input
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                                        <input
                                            name="companyRut"
                                            value={formData.companyRut}
                                            onChange={handleRutChange}
                                            placeholder="12.345.678-9"
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                        <input
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleChange}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL del Logo (Opcional)</label>
                                    <input
                                        name="companyLogoUrl"
                                        value={formData.companyLogoUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {formData.companyLogoUrl && (
                                    <div className="mt-2 p-4 border rounded-lg bg-gray-50 text-center">
                                        <p className="text-xs text-gray-400 mb-2">Previsualización:</p>
                                        <div className="relative h-16 w-full mx-auto">
                                            <Image
                                                src={formData.companyLogoUrl}
                                                alt="Logo Preview"
                                                fill
                                                className="object-contain"
                                                unoptimized
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2 disabled:opacity-70"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar Cambios
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}