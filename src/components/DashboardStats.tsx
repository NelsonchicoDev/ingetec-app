'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, ClipboardCheck, Activity, Loader2 } from 'lucide-react';

export default function DashboardStats() {
    const [stats, setStats] = useState({
        companies: 0,
        workers: 0,
        inspections: 0,
        approvalRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/v1/dashboard');
                const json = await res.json();
                if (json.data) {
                    setStats(json.data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse h-32">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-gray-100 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

            {/* Tarjeta 1: Empresas */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Building2 size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.companies}</h3>
                <p className="text-sm text-gray-500 mt-1">Empresas Activas</p>
            </div>

            {/* Tarjeta 2: Trabajadores */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Users size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.workers}</h3>
                <p className="text-sm text-gray-500 mt-1">Trabajadores</p>
            </div>

            {/* Tarjeta 3: Inspecciones */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                    <ClipboardCheck size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.inspections}</h3>
                <p className="text-sm text-gray-500 mt-1">Auditorías Realizadas</p>
            </div>

            {/* Tarjeta 4: Tasa de Aprobación */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <Activity size={24} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats.approvalRate}%</h3>
                <p className="text-sm text-gray-500 mt-1">Tasa de Aprobación</p>

                {/* Barra de progreso visual */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                    <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-1000"
                        style={{ width: `${stats.approvalRate}%` }}
                    ></div>
                </div>
            </div>

        </div>
    );
}