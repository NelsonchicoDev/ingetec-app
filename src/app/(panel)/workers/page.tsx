'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, User, Eraser, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';

// 👇 FUNCIÓN PARA FORMATEAR RUT CHILENO (Puntos y Guion)
const formatRut = (value: string) => {
    if (!value) return "";
    // 1. Limpiar (dejar solo números y k)
    const clean = value.replace(/[^0-9kK]/g, "");
    // 2. Si es muy corto, devolvemos tal cual
    if (clean.length <= 1) return clean;

    // 3. Separar cuerpo y dígito verificador (DV)
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    // 4. Poner puntos al cuerpo
    let formattedBody = "";
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        formattedBody = body.charAt(i) + ((j > 0 && j % 3 === 0) ? "." : "") + formattedBody;
    }

    return `${formattedBody}-${dv}`;
};

export default function WorkersPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWorker, setEditingWorker] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 👇 ESTADO (Incluye email)
    const [formData, setFormData] = useState({
        name: '', role: '', companyId: '',
        rut: '', secRegistrationNumber: '', digitalSignature: '',
        email: '' // 👈 Inicializamos email
    });

    const sigCanvas = useRef<SignatureCanvas>(null);

    // Cargar datos
    useEffect(() => {
        const loadData = async () => {
            try {
                const [resW, resC] = await Promise.all([
                    fetch('/api/v1/workers').then(r => r.json()),
                    fetch('/api/v1/companies').then(r => r.json())
                ]);
                setWorkers(Array.isArray(resW) ? resW : resW.data || []);
                setCompanies(Array.isArray(resC) ? resC : resC.data || []);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadData();
    }, []);

    // Manejador especial para el RUT
    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRut(e.target.value);
        setFormData({ ...formData, rut: formatted });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar Email si es obligatorio
        if (!formData.email) return toast.error("El email es obligatorio");

        let finalSignature = formData.digitalSignature;
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            finalSignature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        }

        try {
            const url = editingWorker ? `/api/v1/workers/${editingWorker.id}` : '/api/v1/workers';
            const method = editingWorker ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, digitalSignature: finalSignature })
            });

            if (res.ok) {
                toast.success("Trabajador guardado");
                setIsModalOpen(false);
                window.location.reload();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al guardar");
            }
        } catch (error) { toast.error("Error de conexión"); }
    };

    const openModal = (worker: any = null) => {
        setEditingWorker(worker);
        if (worker) {
            setFormData({
                name: worker.name, role: worker.role, companyId: worker.companyId,
                rut: worker.rut || '',
                secRegistrationNumber: worker.secRegistrationNumber || '',
                digitalSignature: worker.digitalSignature || '',
                email: worker.email || '' // 👈 Cargamos email si existe
            });
            setTimeout(() => {
                if (sigCanvas.current && worker.digitalSignature) {
                    sigCanvas.current.fromDataURL(worker.digitalSignature);
                }
            }, 100);
        } else {
            setFormData({ name: '', role: '', companyId: '', rut: '', secRegistrationNumber: '', digitalSignature: '', email: '' });
            setTimeout(() => sigCanvas.current?.clear(), 100);
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-2"><User className="text-blue-600" /> Gestión de Trabajadores</h1>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex gap-2">
                    <Plus size={18} /> Nuevo Trabajador
                </button>
            </div>

            {/* LISTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map(worker => (
                    <div key={worker.id} className="bg-white p-6 rounded-xl border shadow-sm relative group">
                        <button onClick={() => openModal(worker)} className="absolute top-4 right-4 text-gray-300 hover:text-blue-600"><Edit size={18} /></button>
                        <h3 className="font-bold text-lg">{worker.name}</h3>
                        <p className="text-sm font-medium text-blue-600">{worker.role}</p>
                        <p className="text-xs text-gray-400">{worker.email}</p> {/* Mostramos email */}
                        {worker.rut && <p className="text-xs text-gray-500 mt-1">RUT: {worker.rut}</p>}
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingWorker ? 'Editar' : 'Crear'} Trabajador</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Nombre */}
                            <input className="w-full border rounded p-2" placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />

                            {/* Email (NUEVO CAMPO PARA ARREGLAR ERROR) */}
                            <input
                                type="email"
                                className="w-full border rounded p-2"
                                placeholder="Correo Electrónico (Obligatorio)"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                required
                            />

                            {/* RUT (CON FORMATO AUTOMÁTICO) */}
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    className="w-full border rounded p-2"
                                    placeholder="RUT (ej: 12.345.678-9)"
                                    value={formData.rut}
                                    onChange={handleRutChange} // 👈 Usamos el formateador aquí
                                    maxLength={12}
                                />
                                <input className="w-full border rounded p-2" placeholder="N° Registro (Solo Expertos)" value={formData.secRegistrationNumber} onChange={e => setFormData({ ...formData, secRegistrationNumber: e.target.value })} />
                            </div>

                            <input className="w-full border rounded p-2" placeholder="Cargo (Ej: Chofer, Prevención)" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required />

                            <select className="w-full border rounded p-2" value={formData.companyId} onChange={e => setFormData({ ...formData, companyId: e.target.value })} required>
                                <option value="">Seleccionar Empresa...</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <div className="border-t pt-4">
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm font-bold text-gray-700">Firma Digital</label>
                                    <button type="button" onClick={() => sigCanvas.current?.clear()} className="text-xs text-red-500 flex items-center gap-1"><Eraser size={12} /> Limpiar</button>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                    <SignatureCanvas ref={sigCanvas} penColor="blue" canvasProps={{ className: 'w-full h-32 rounded-lg' }} />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-2 rounded">Cancelar</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}