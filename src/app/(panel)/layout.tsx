// src/app/(panel)/layout.tsx
'use client';

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Barra móvil */}
            <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
                <div className="font-bold flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs">P</div>
                    Ingetec-Prev
                </div>
                <button onClick={() => setSidebarOpen(true)} className="p-1 rounded hover:bg-slate-800">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Contenido Principal */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}