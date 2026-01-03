import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
// Usamos tus iconos originales + los nuevos
import { Building2, Users, ClipboardCheck, Activity, Plus, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import UVWidget from "@/components/UVWidget";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const [
        companiesCount,
        workersCount,
        inspectionsCount,
        approvalStats,
        recentInspections
    ] = await Promise.all([
        prisma.company.count(),
        prisma.worker.count(),
        prisma.inspection.count(),
        prisma.inspection.aggregate({
            _avg: { score: true },
            where: { status: 'COMPLETED' }
        }),
        prisma.inspection.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                company: { select: { name: true } },
                template: { select: { title: true } }
            }
        })
    ]);

    const approvalRate = Math.round(approvalStats._avg.score || 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">

            {/* 1. BIENVENIDA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Hola, {session.user?.name} 👋</h1>
                    <p className="text-blue-100">Aquí tienes el resumen de operaciones de PrevApp.</p>
                </div>
                <Link
                    href="/inspections/new"
                    className="bg-white text-blue-700 px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
                >
                    <Plus size={20} /> Nueva Inspección
                </Link>
            </div>

            {/* 2. GRID DE TARJETAS (Ahora soporta 5 elementos) */}
            {/* Ajusté el grid para que el widget UV encaje bien */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                {/* Tarjeta UV (La ponemos primero o donde gustes) */}
                <UVWidget />

                {/* Tarjeta 1: Empresas */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <Building2 size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{companiesCount}</h3>
                    <p className="text-sm text-gray-500 mt-1">Empresas Activas</p>
                </div>

                {/* Tarjeta 2: Trabajadores */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <Users size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{workersCount}</h3>
                    <p className="text-sm text-gray-500 mt-1">Trabajadores</p>
                </div>

                {/* Tarjeta 3: Inspecciones */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                        <ClipboardCheck size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{inspectionsCount}</h3>
                    <p className="text-sm text-gray-500 mt-1">Auditorías Realizadas</p>
                </div>

                {/* Tarjeta 4: Tasa de Aprobación */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{approvalRate}%</h3>
                    <p className="text-sm text-gray-500 mt-1">Promedio General</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${approvalRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* 3. ACTIVIDAD RECIENTE */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Últimas Inspecciones</h3>
                    <Link href="/inspections" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                        Ver todas <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="divide-y">
                    {recentInspections.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay actividad reciente.</div>
                    ) : (
                        recentInspections.map(insp => (
                            <Link
                                key={insp.id}
                                href={`/inspections/${insp.id}`}
                                className="block p-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{insp.template.title}</p>
                                    <p className="text-sm text-gray-500">{insp.company.name}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${insp.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {insp.status === 'COMPLETED' ? 'FINALIZADA' : 'BORRADOR'}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}