'use client';

import dynamic from 'next/dynamic';
import { FileDown, Loader2 } from 'lucide-react';
import { InspectionPDF } from './InspectionPDF';

// Carga dinámica para evitar errores de SSR (Server Side Rendering)
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => (
            <button disabled className="flex items-center gap-2 bg-gray-200 text-gray-400 px-3 py-2 rounded-lg text-sm font-bold cursor-wait">
                <Loader2 className="animate-spin" size={16} /> Cargando librería...
            </button>
        ),
    }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DownloadButton({ inspection }: { inspection: any }) {
    return (
        <PDFDownloadLink
            document={<InspectionPDF inspection={inspection} />}
            fileName={`inspeccion-${inspection.company?.name || 'reporte'}.pdf`}
            className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
        >
            {({ loading }: { loading: boolean }) => (
                loading ? (
                    <><Loader2 className="animate-spin" size={16} /> Generando...</>
                ) : (
                    <><FileDown size={16} /> PDF</>
                )
            )}
        </PDFDownloadLink>
    );
}