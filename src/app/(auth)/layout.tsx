// src/app/(auth)/layout.tsx

// Este layout solo se aplica a las rutas dentro de la carpeta (auth)
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        // Este div asegura que el fondo sea oscuro y ocupe toda la pantalla
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            {/* Aquí se renderizará tu página de login */}
            {children}
        </div>
    )
}