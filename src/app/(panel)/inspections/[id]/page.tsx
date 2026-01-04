'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Section } from '@/types';
import { Save, CheckCircle, ArrowLeft, Loader2, Camera, Eraser, PenTool, X, Share2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import PDFModal from '@/components/pdf/PDFModal';
import SignatureCanvas from 'react-signature-canvas'; // 👈 Librería de firma
import Image from 'next/image';

// --- UTILIDADES ---
// Función para comprimir fotos antes de subirlas (Vital para que no pesen mucho)
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

// --- TIPOS ---
interface InspectionPhoto {
    id: string;
    url: string;
    timestamp: string;
}

interface InspectionData {
    id: string;
    status: string;
    checklistData: Section[];
    customValues: Record<string, any>;
    company: { name: string; rut: string };
    worker: { name: string; role: string };
    template: { title: string };
    score: number;
    signature?: string;   // 👈 Agregamos firma
    photos?: InspectionPhoto[]; // 👈 Agregamos fotos
}

export default function InspectionRunnerPage() {
    const params = useParams();
    const router = useRouter();

    // Estados principales
    const [inspection, setInspection] = useState<InspectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Estados para Fotos y Firma
    const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
    const sigPad = useRef<SignatureCanvas>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSigned, setIsSigned] = useState(false);
    const [showPdf, setShowPdf] = useState(false);
    // 1. CARGAR DATOS
    useEffect(() => {
        const fetchInspection = async () => {
            try {
                // params.id puede ser promesa en Next 15, pero useParams lo maneja
                const res = await fetch(`/api/v1/inspections/${params.id}`);


                if (!res.ok) throw new Error('Error de carga');

                const data = await res.json();

                if (!Array.isArray(data.checklistData)) {
                    data.checklistData = [];
                }

                // Asegurar estructura
                if (!data.checklistData) data.checklistData = [];

                setInspection(data);

                // Cargar fotos y firma existentes si las hay
                if (data.photos) setPhotos(data.photos);
                if (data.signature) setIsSigned(true);

            } catch (error) {
                toast.error("No se pudo cargar la inspección");
            } finally {
                setLoading(false);
            }
        };
        fetchInspection();
    }, [params.id]);

    // 2. MANEJAR RESPUESTAS DEL CHECKLIST
    const handleAnswerChange = (sectionId: string, questionId: string, value: any) => {
        if (!inspection) return;
        if (isSigned) return toast.warning("La inspección está firmada y bloqueada.");

        const updatedSections = inspection.checklistData.map(section => {
            if (section.id === sectionId) {
                const updatedItems = section.items.map(item => {
                    if (item.id === questionId) {
                        return { ...item, answer: value };
                    }
                    return item;
                });
                return { ...section, items: updatedItems };
            }
            return section;
        });

        setInspection({ ...inspection, checklistData: updatedSections });
    };

    // 3. MANEJAR FOTOS
    const handleCameraClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            toast.info("Procesando imagen...");
            try {
                const compressedBase64 = await compressImage(file);
                const newPhoto: InspectionPhoto = {
                    id: Date.now().toString(),
                    url: compressedBase64,
                    timestamp: new Date().toLocaleTimeString()
                };
                setPhotos(prev => [...prev, newPhoto]);
                toast.success("Foto agregada");
            } catch (error) {
                toast.error("Error al procesar imagen");
            }
        }
    };

    const removePhoto = (id: string) => {
        if (confirm("¿Borrar foto?")) setPhotos(photos.filter(p => p.id !== id));
    };

    // 4. GUARDAR / FINALIZAR
    const saveProgress = async (finalize = false) => {
        if (!inspection) return;

        // Validación de firma para finalizar
        let signatureData = inspection.signature;

        // Si hay algo nuevo dibujado en el canvas, lo capturamos
        if (sigPad.current && !sigPad.current.isEmpty()) {
            signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        }

        if (finalize && !signatureData) {
            return toast.error("Debes firmar para finalizar la inspección");
        }

        setSaving(true);

        try {
            // Calcular Score
            let totalItems = 0;
            let answeredItems = 0;
            inspection.checklistData.forEach(section => {
                section.items.forEach(item => {
                    if (item.type === 'YES_NO' || item.type === 'RATING_ABC') {
                        totalItems++;
                        if (item.answer && item.answer !== 'N/A') answeredItems++;
                    }
                });
            });
            const score = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

            const payload = {
                checklistData: inspection.checklistData,
                customValues: inspection.customValues,
                status: finalize ? 'COMPLETED' : 'DRAFT',
                score: score,
                signature: signatureData, // Enviamos firma
                photos: photos            // Enviamos fotos
            };

            const res = await fetch(`/api/v1/inspections/${inspection.id}`, {
                method: 'PATCH', // Usamos PATCH según tu API actualizada
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (signatureData) setIsSigned(true);
                toast.success(finalize ? "Inspección finalizada" : "Progreso guardado");
                if (finalize) router.push('/inspections'); // dashboard
            } else {
                toast.error("Error al guardar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    if (!inspection) return null;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">

            {/* Input oculto cámara */}
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {/* Header Sticky */}
            <div className="sticky top-0 bg-gray-50/95 backdrop-blur z-20 py-4 border-b mb-6 flex justify-between items-center transition-all shadow-sm">
                <div>
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1 mb-1">
                        <ArrowLeft size={14} /> Volver
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">{inspection.template.title}</h1>
                    <p className="text-xs text-gray-500">{inspection.company.name} • {inspection.worker.name}</p>
                </div>

                <div className="flex items-center gap-2">

                    {/* 👇 BOTÓN NUEVO: VISOR PDF */}
                    <button
                        onClick={() => setShowPdf(true)}
                        className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <Eye size={18} /> Ver PDF
                    </button>

                    <div className="text-right hidden md:block">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${inspection.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {inspection.status === 'COMPLETED' ? 'FINALIZADA' : 'BORRADOR'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 1. SECCIONES DEL CHECKLIST */}
            <div className="space-y-8 mb-8">
                {inspection.checklistData.map((section, sIndex) => (
                    <div key={section.id} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-sm">{sIndex + 1}</span>
                            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">{section.title}</h2>
                        </div>

                        <div className="grid gap-4">
                            {(section.items || []).map((q) => (
                                <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="font-medium text-gray-900 mb-3">{q.text}</p>

                                    {/* RATING ABC */}
                                    {q.type === 'RATING_ABC' && (
                                        <div className="flex gap-2">
                                            {['B', 'M', 'N/A'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => handleAnswerChange(section.id, q.id, opt)}
                                                    disabled={isSigned}
                                                    className={`flex-1 py-3 rounded-lg text-sm font-bold border transition-all ${q.answer === opt
                                                        ? (opt === 'B' ? 'bg-green-600 text-white border-green-600' : opt === 'M' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-600 text-white border-gray-600')
                                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {opt === 'B' ? 'BUENO' : opt === 'M' ? 'MALO' : 'N/A'}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* TEXTO */}
                                    {q.type === 'TEXT' && (
                                        <textarea
                                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
                                            value={typeof q.answer === 'string' ? q.answer : ''}
                                            onChange={(e) => handleAnswerChange(section.id, q.id, e.target.value)}
                                            placeholder="Escribir observación..."
                                            rows={2}
                                            disabled={isSigned}
                                        />
                                    )}

                                    {/* FOTO (Item específico) */}
                                    {q.type === 'PHOTO' && (
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400">
                                            <Camera className="mx-auto mb-2" />
                                            <span className="text-xs">Usa la sección de fotos abajo</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. EVIDENCIA FOTOGRÁFICA (GLOBAL) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Camera className="text-blue-600" /> Evidencia Fotográfica</h3>
                    {!isSigned && (
                        <button onClick={handleCameraClick} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 font-medium">
                            <Camera size={16} /> Agregar Foto
                        </button>
                    )}
                </div>

                {photos.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-sm">
                        Sin fotos adjuntas
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map(p => (
                            <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                <Image src={p.url} alt="Evidencia" fill className="object-cover unoptimized" unoptimized />
                                {!isSigned && (
                                    <button onClick={() => removePhoto(p.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100">
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="absolute bottom-0 w-full bg-black/60 text-white text-[10px] p-1 text-center truncate">
                                    {p.timestamp}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. FIRMA DIGITAL */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><PenTool className="text-blue-600" /> Firma del Inspector</h3>
                    {!isSigned && (
                        <button onClick={() => sigPad.current?.clear()} className="text-red-500 text-xs flex items-center gap-1 font-medium">
                            <Eraser size={14} /> Borrar Firma
                        </button>
                    )}
                </div>

                <div className={`border-2 border-dashed rounded-xl overflow-hidden relative h-40 ${isSigned ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                    {isSigned && inspection.signature ? (
                        <div className="relative h-full w-full">
                            <Image src={inspection.signature} alt="Firma" fill className="object-contain" unoptimized />
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                                <span className="text-green-700 font-bold border border-green-600 px-3 py-1 rounded bg-green-100">FIRMADO DIGITALMENTE</span>
                            </div>
                        </div>
                    ) : (
                        <SignatureCanvas
                            ref={sigPad}
                            penColor="blue"
                            canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                        />
                    )}
                </div>
                {!isSigned && <p className="text-xs text-gray-400 mt-2 text-center">Firma aquí usando tu dedo o mouse.</p>}
            </div>

            {/* BARRA INFERIOR */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t flex justify-between md:pl-72 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <span className="text-xs text-gray-400 hidden md:block self-center">
                    {photos.length} fotos • Completado: {inspection.score}%
                </span>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => saveProgress(false)}
                        disabled={saving}
                        className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={18} className="mr-2 inline" />}
                        Guardar
                    </button>
                    <button
                        onClick={() => { if (confirm("¿Finalizar inspección?")) saveProgress(true); }}
                        disabled={saving}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                    >
                        <CheckCircle size={18} className="mr-2 inline" /> Finalizar
                    </button>
                </div>
            </div>
            {showPdf && <PDFModal inspection={inspection} onClose={() => setShowPdf(false)} />}
        </div>
    );
}