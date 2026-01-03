import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InspectionExecutor from '@/components/InspectionExecutor';

// 👇 CAMBIO 1: Definimos params como una Promesa
interface Props {
    params: Promise<{ id: string }>;
}

export default async function ConductInspectionPage({ params }: Props) {
    // 👇 CAMBIO 2: Esperamos a que la promesa se resuelva para sacar el ID
    const { id } = await params;

    // 1. Buscamos la inspección usando el ID ya resuelto
    const inspection = await prisma.inspection.findUnique({
        where: { id }, // Ahora 'id' sí tiene el valor correcto (ej: "12f3ed01...")
        include: {
            company: true,
            worker: true
        },
    });

    if (!inspection) return notFound();

    // 2. Le pasamos los datos al componente interactivo
    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <InspectionExecutor
                inspectionId={inspection.id}
                companyName={inspection.company?.name || 'Empresa Desconocida'}
                workerName={inspection.worker?.name || 'Inspector'}

                // Si ya hay checklist guardado, lo pasamos.
                initialData={inspection.checklistData as any}
                initialPhotos={inspection.photos as any || []}
                initialSignature={inspection.signature || undefined}
            />
        </div>
    );
}