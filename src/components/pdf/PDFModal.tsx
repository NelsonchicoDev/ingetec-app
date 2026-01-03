'use client';

import dynamic from 'next/dynamic';
import { X, Loader2 } from 'lucide-react';
import { InspectionPDF } from './InspectionPDF';

// Importamos el Visor dinámicamente para que no falle en Next.js
const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full text-blue-600">
                <Loader2 className="animate-spin mr-2" /> Cargando motor PDF...
            </div>
        ),
    }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PDFModal({ inspection, onClose }: { inspection: any; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-6">

            {/* Contenedor Blanco */}
            <div className="bg-white w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Barra Superior del Modal */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg">Vista Previa del Reporte</h3>
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* El Visor PDF */}
                <div className="flex-1 bg-gray-100 relative">
                    <PDFViewer width="100%" height="100%" className="absolute inset-0 border-none">
                        <InspectionPDF inspection={inspection} />
                    </PDFViewer>
                </div>
            </div>
        </div>
    );
}