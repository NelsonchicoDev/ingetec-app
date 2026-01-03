'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useSession } from "next-auth/react";
// 👇 Agregamos Building2 a los imports
import { LayoutDashboard, Users, ClipboardCheck, Settings, LogOut, X, FileText, UserCog, PlusCircle, Building2 } from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inspections', label: 'Inspecciones', icon: ClipboardCheck },
    // 👇 Agregamos el enlace a Empresas aquí
    { href: '/companies', label: 'Empresas', icon: Building2 },
    { href: '/templates', label: 'Plantillas', icon: FileText },
    { href: '/workers', label: 'Trabajadores', icon: Users },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const userRole = (session?.user as unknown as { role: string })?.role;

    return (
        <>
            {/* 1. Overlay (Fondo oscuro) para móvil */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* 2. El Sidebar en sí */}
            <aside
                className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-900 text-white transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                {/* Header del Sidebar */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">P</div>
                            Ingetec-Prev
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">v1.0.0 Enterprise</p>
                    </div>
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Acceso Rápido: Nueva Inspección */}
                <div className="p-4 pb-0">
                    <Link
                        href="/inspections/new"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <PlusCircle size={18} /> Nueva Inspección
                    </Link>
                </div>

                {/* Lista de Navegación Principal */}
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                                        ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer del Sidebar (Config y Usuario) */}
                <div className="p-4 border-t border-slate-800 space-y-1">

                    {/* Gestión de Usuarios (Solo Admin) */}
                    {(userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                        <Link
                            href="/users"
                            onClick={onClose}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <UserCog size={20} />
                            Gestión de Usuarios
                        </Link>
                    )}

                    <Link
                        href="/settings"
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Settings size={20} />
                        Configuración
                    </Link>

                    <button
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 w-full hover:bg-slate-800 rounded-lg transition-colors mt-2"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}