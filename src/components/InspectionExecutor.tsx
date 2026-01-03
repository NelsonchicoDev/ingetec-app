'use client';

import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, Share2, CheckCircle, Circle, Plus, Trash2, PenTool, Loader2, RefreshCw, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

interface InspectionPhoto {
    id: string;
    url: string; // Base64
    timestamp: string;
}

interface Props {
    inspectionId: string;
    initialData?: ChecklistItem[];
    initialSignature?: string;
    // 👇 Recibimos las fotos iniciales si existen
    initialPhotos?: InspectionPhoto[];
    companyName: string;
    workerName: string;
}

// Función auxiliar para comprimir imágenes (Para que no pesen tanto en la BD)
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Reducimos a 800px de ancho
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Convertimos a JPEG calidad 0.7
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
};

export default function InspectionExecutor({ inspectionId, initialData, initialSignature, initialPhotos, companyName, workerName }: Props) {
    const router = useRouter();
    const sigPad = useRef<SignatureCanvas>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // Referencia invisible para el input de archivo

    const [loading, setLoading] = useState(false);
    const [isSigned, setIsSigned] = useState(!!initialSignature && initialSignature.length > 100);

    // Estado para las fotos
    const [photos, setPhotos] = useState<InspectionPhoto[]>(initialPhotos || []);

    const DEFAULT_CHECKLIST = [
        { id: '1', text: '¿Extintores vigentes y señalizados?', checked: false },
        { id: '2', text: '¿Personal con EPP completo?', checked: false },
        { id: '3', text: '¿Vías de evacuación despejadas?', checked: false },
        { id: '4', text: '¿Tableros eléctricos bloqueados?', checked: false },
    ];

    const [items, setItems] = useState<ChecklistItem[]>(() => {
        if (initialData && Array.isArray(initialData) && initialData.length > 0) return initialData;
        return DEFAULT_CHECKLIST;
    });

    // --- Lógica Checklist ---
    const toggleItem = (id: string) => {
        if (isSigned) return toast.warning("Desbloquea para editar");
        setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const addItem = () => {
        const text = prompt("Nuevo punto a revisar:");
        if (text) setItems([...items, { id: Date.now().toString(), text, checked: false }]);
    };

    // --- Lógica FOTOS ---
    const handleCameraClick = () => {
        fileInputRef.current?.click(); // Simula click en el input oculto
    };

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
                setPhotos([...photos, newPhoto]);
                toast.success("Foto agregada");
            } catch (error) {
                toast.error("Error al procesar la imagen");
            }
        }
    };

    const removePhoto = (id: string) => {
        if (confirm("¿Borrar esta foto?")) {
            setPhotos(photos.filter(p => p.id !== id));
        }
    };

    // --- Guardar ---
    const handleSave = async () => {
        let signatureData = initialSignature;
        if (sigPad.current && !sigPad.current.isEmpty()) {
            signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        }

        if (!signatureData) return toast.error("Firma requerida");

        setLoading(true);

        try {
            const res = await fetch(`/api/v1/inspections/${inspectionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checklistData: items,
                    photos: photos, // 👇 ENVIAMOS LAS FOTOS
                    signature: signatureData,
                    status: 'COMPLETED',
                    signedAt: new Date(),
                }),
            });

            if (!res.ok) throw new Error('Error al guardar');

            setIsSigned(true);
            toast.success("Guardado correctamente");
            router.refresh();

        } catch (error) {
            toast.error("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (method: 'whatsapp' | 'email') => {
        const url = window.location.href.replace('/edit', '');
        const text = `Reporte Inspección ${companyName} (${workerName}). Ver: ${url}`;
        if (method === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        else window.open(`mailto:?subject=Reporte&body=${encodeURIComponent(text)}`);
    };

    return (
        <div className="max-w-2xl mx-auto pb-24">
            {/* Input oculto para la cámara */}
            <input
                type="file"
                accept="image/*"
                capture="environment" // Esto fuerza la cámara trasera en celulares
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm sticky top-4 z-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Inspección</h1>
                        <div className="text-sm text-gray-500">{companyName}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSigned ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isSigned ? 'FIRMADO' : 'EDITANDO'}
                    </div>
                </div>
            </div>

            <div className="space-y-6">

                {/* 1. CHECKLIST */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <CheckCircle size={18} className="text-blue-600" /> Checklist
                        </h3>
                        {!isSigned && (
                            <button onClick={addItem} className="text-sm text-blue-600 font-medium flex items-center gap-1 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                                <Plus size={16} /> Agregar
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} onClick={() => toggleItem(item.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${item.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    {item.checked ? <CheckCircle className="text-green-600" size={20} /> : <Circle className="text-gray-300" size={20} />}
                                    <span className={item.checked ? 'text-gray-900 font-medium' : 'text-gray-600'}>{item.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. FOTOS (NUEVA SECCIÓN) */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Camera size={18} className="text-blue-600" /> Evidencia Fotográfica
                        </h3>
                        {!isSigned && (
                            <button onClick={handleCameraClick} className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                                <Camera size={16} /> Tomar Foto
                            </button>
                        )}
                    </div>

                    {/* Grilla de Fotos */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                {/* 👇 CAMBIO AQUÍ: Usamos Image con 'fill' */}
                                <Image
                                    src={photo.url}
                                    alt="Evidencia"
                                    fill
                                    className="object-cover"
                                    unoptimized // Importante para Base64 para evitar sobrecarga en servidor
                                />

                                {!isSigned && (
                                    <button
                                        onClick={() => removePhoto(photo.id)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100 z-10"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center truncate z-10">
                                    {photo.timestamp}
                                </div>
                            </div>
                        ))}
                        {/* ... mensaje si no hay fotos ... */}
                    </div>

                </div>

                {/* 3. FIRMA */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><PenTool size={18} className="text-blue-600" /> Firma</h3>
                    <div className={`border-2 border-dashed rounded-xl overflow-hidden relative h-40 ${isSigned ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                        {isSigned && initialSignature ? (
                            <div className="relative h-full w-full">
                                {/* 👇 CAMBIO AQUÍ: Firma con Image */}
                                <Image
                                    src={initialSignature}
                                    alt="Firma Inspector"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />

                                <button
                                    onClick={() => { setIsSigned(false); setTimeout(() => sigPad.current?.clear(), 100); }}
                                    className="absolute inset-0 bg-white/80 flex items-center justify-center opacity-0 hover:opacity-100 font-bold text-blue-600 z-20"
                                >
                                    Editar Firma
                                </button>
                            </div>
                        ) : (
                            <SignatureCanvas ref={sigPad} penColor="black" canvasProps={{ className: 'w-full h-full cursor-crosshair' }} />
                        )}
                    </div>
                    {!isSigned && <button onClick={() => sigPad.current?.clear()} className="text-xs text-red-500 mt-2 flex items-center gap-1"><Trash2 size={12} /> Limpiar</button>}
                </div>

                <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex justify-center items-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} {isSigned ? "Actualizar" : "Finalizar"}
                </button>

                {isSigned && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <button onClick={() => handleShare('whatsapp')} className="bg-green-500 text-white py-3 rounded-lg font-bold flex justify-center gap-2"><Share2 size={20} /> WhatsApp</button>
                        <button onClick={() => handleShare('email')} className="bg-slate-800 text-white py-3 rounded-lg font-bold flex justify-center gap-2">Email</button>
                    </div>
                )}
            </div>
        </div>
    );
}