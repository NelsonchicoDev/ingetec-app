'use client';

import { useState, useEffect } from 'react';
import { Sun, Share2, MapPin, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface UVData {
    index: number;
    risk: string;
    color: string;
    recommendation: string;
}

export default function UVWidget() {
    const [uvData, setUvData] = useState<UVData | null>(null);
    const [loading, setLoading] = useState(true);
    const [location, setLocation] = useState<string>("Detectando ubicación...");

    // Lógica para clasificar el riesgo según normas internacionales (y Chilenas)
    const getRiskLevel = (index: number): UVData => {
        if (index <= 2) return { index, risk: 'Bajo', color: 'bg-green-500', recommendation: 'Uso de lentes de sol.' };
        if (index <= 5) return { index, risk: 'Moderado', color: 'bg-yellow-500', recommendation: 'Usar sombrero y bloqueador.' };
        if (index <= 7) return { index, risk: 'Alto', color: 'bg-orange-500', recommendation: 'Protección obligatoria y sombra.' };
        if (index <= 10) return { index, risk: 'Muy Alto', color: 'bg-red-500', recommendation: 'Evitar sol directo. EPP completo.' };
        return { index, risk: 'Extremo', color: 'bg-purple-600', recommendation: '¡Peligro! No exponerse al sol.' };
    };

    const fetchUV = async (lat: number, lon: number) => {
        try {
            // Usamos la API gratuita de Open-Meteo
            const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=auto`);
            const data = await res.json();

            if (data.current && typeof data.current.uv_index === 'number') {
                setUvData(getRiskLevel(data.current.uv_index));
                setLocation("Ubicación Actual");
            }
        } catch (error) {
            console.error("Error UV:", error);
            toast.error("No se pudo obtener la radiación UV");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchUV(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.log("Ubicación denegada, usando Santiago por defecto");
                    // Coordenadas por defecto (Ej: Santiago/Quillota) si el usuario niega permiso
                    fetchUV(-33.4489, -70.6693);
                    setLocation("Zona Central (Por defecto)");
                }
            );
        } else {
            fetchUV(-33.4489, -70.6693);
        }
    }, []);

    const handleShare = (method: 'whatsapp' | 'email') => {
        if (!uvData) return;

        const text = `⚠️ *Alerta de Radiación UV - PrevApp*\n\n` +
            `☀️ Índice Actual: *${uvData.index} (${uvData.risk})*\n` +
            `📍 Ubicación: ${location}\n` +
            `🛡️ Medida: ${uvData.recommendation}\n\n` +
            `Por favor tomar las precauciones correspondientes.`;

        if (method === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } else {
            window.open(`mailto:?subject=Reporte Radiación UV&body=${encodeURIComponent(text)}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Sun className="text-orange-500" size={18} /> Radiación UV
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {location}
                    </p>
                </div>

                {/* Botón de compartir rápido */}
                {!loading && uvData && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleShare('whatsapp')}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Compartir por WhatsApp"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-blue-600" />
                </div>
            ) : uvData ? (
                <div>
                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-5xl font-bold text-gray-900">{uvData.index.toFixed(1)}</span>
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-bold mb-2 ${uvData.color}`}>
                            {uvData.risk}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 flex items-start gap-2">
                        <ShieldAlert size={16} className="mt-0.5 text-gray-400 flex-shrink-0" />
                        {uvData.recommendation}
                    </p>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                    <AlertTriangle className="mx-auto mb-2 text-yellow-500" />
                    No hay datos disponibles
                </div>
            )}
        </div>
    );
}