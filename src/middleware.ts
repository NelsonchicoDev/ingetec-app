import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // 1. Obtener estado de la sesión
  const isLoggedIn = !!req.auth;

  // Usamos el truco del 'unknown' para leer el rol sin errores de TS
  const userRole = (req.auth?.user as unknown as { role: string })?.role;

  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // 2. Definir rutas protegidas
  // Si la ruta empieza con /users, es zona restringida
  const isAdminRoute = path.startsWith("/users");

  // Si la ruta es el dashboard o cualquier otra interna
  const isProtectedRoute = path === "/" || path.startsWith("/dashboard");

  // CASO A: Usuario NO logueado intentando entrar a zona privada
  if ((isAdminRoute || isProtectedRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // CASO B: Usuario logueado pero SIN PERMISOS (Intenta entrar a /users)
  if (isAdminRoute && userRole !== "ADMIN" && userRole !== "SUPERADMIN") {
    // Lo mandamos de vuelta al inicio (Dashboard)
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // CASO C: Usuario ya logueado intentando ver el Login
  if (path === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

// Configuración: Evita que el middleware corra en archivos estáticos o API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
