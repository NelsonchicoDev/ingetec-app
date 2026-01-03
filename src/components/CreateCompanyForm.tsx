'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Save, X } from 'lucide-react';
import { Company } from '@/types';
import { toast } from "sonner";

interface Props {
    onSuccess: () => void;
    onCancel?: () => void;
    initialData?: Company | null;
}

// ---------------------------------------------------------
// PEGA ESTO ANTES DE "export default function CreateCompanyForm"
// ---------------------------------------------------------

// Función auxiliar para validar RUT (Módulo 11)
function validarRutChileno(rut: string): boolean {
    if (!rut || rut.trim().length < 3) return false;

    // 1. Limpiar (dejar solo números y K)
    const valor = rut.replace(/[^0-9kK]/g, '');

    // 2. Separar cuerpo y DV
    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1).toUpperCase();

    // 3. Validar que el cuerpo sea numérico
    if (!/^[0-9]+$/.test(cuerpo)) return false;

    // 4. Calcular DV esperado
    let suma = 0;
    let multiplo = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    let dvCalculado = '0';

    if (dvEsperado === 11) dvCalculado = '0';
    else if (dvEsperado === 10) dvCalculado = 'K';
    else dvCalculado = dvEsperado.toString();

    // 5. Comparar
    return dvCalculado === dv;
}

// Función auxiliar para formatear
function formatearRutChileno(rut: string): string {
    const valor = rut.replace(/[^0-9kK]/g, '');
    if (valor.length <= 1) return valor;

    const cuerpo = valor.slice(0, -1);
    const dv = valor.slice(-1).toUpperCase();

    // Poner puntos
    return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}
// ---------------------------------------------------------



export default function CreateCompanyForm({ onSuccess, onCancel, initialData }: Props) {
    // Inicializamos el estado. Si es nuevo, status es ACTIVE por defecto.
    const [formData, setFormData] = useState({ name: '', rut: '', industry: '', status: 'ACTIVE' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                rut: initialData.rut,
                industry: initialData.industry || '',
                status: initialData.status // Cargamos el estado actual
            });
        } else {
            setFormData({ name: '', rut: '', industry: '', status: 'ACTIVE' });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Usamos la función local que acabamos de pegar
        const esValido = validarRutChileno(formData.rut);


        if (!esValido) {
            // 👇 Muestra una notificación roja elegante
            toast.error("RUT Inválido", {
                description: "Por favor revisa que el dígito verificador sea correcto."
            });
            return; // Detenemos todo
        }
        setLoading(true);
        setError(null);

        try {
            const url = initialData
                ? `/api/v1/companies/${initialData.id}`
                : '/api/v1/companies';

            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Error al guardar');
            }

            toast.success(initialData ? "Empresa actualizada" : "Empresa creada", {
                description: `Se ha guardado a ${formData.name} correctamente.`
            });

            if (!initialData) setFormData({ name: '', rut: '', industry: '', status: 'ACTIVE' });
            onSuccess();

        } catch (err) {
            // En TypeScript el error es 'unknown'. Debemos verificar qué es.
            const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido';

            toast.error("Error al guardar", {
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 relative">
            {onCancel && (
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            )}

            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                {initialData ? <Save size={20} className="text-orange-600" /> : <PlusCircle size={20} className="text-blue-600" />}
                {initialData ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
            </h3>


            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Nombre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Ej: Minera Escondida"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                {/* RUT */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-gray-50 focus:bg-white transition-colors uppercase" // Agregué uppercase
                        placeholder="76.xxx.xxx-k"
                        maxLength={12} // 👇 Agregamos límite
                        value={formData.rut}
                        onChange={(e) => {
                            // Usa la función local formatearRutChileno
                            const formatted = formatearRutChileno(e.target.value);
                            setFormData({ ...formData, rut: formatted });
                        }}
                        required
                    />

                </div>

                {/* Rubro */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Ej: Minería"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                </div>

                {/* ESTADO (Solo visible al editar) */}
                {initialData && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado Operativo</label>
                        <select
                            className={`w-full p-3 border rounded-lg outline-none font-medium transition-colors appearance-none cursor-pointer
                ${formData.status === 'ACTIVE'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-red-50 border-red-200 text-red-800'}`}
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="ACTIVE">🟢 Activo (Operativo)</option>
                            <option value="INACTIVE">🔴 Inactivo (Suspendido)</option>
                        </select>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-2 px-6 py-3 font-medium rounded-lg text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-lg
            ${initialData ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? 'Actualizar Datos' : 'Guardar Empresa')}
                </button>
            </form>
        </div>
    );
}