import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// --- FUNCIÓN HELPER: VALIDAR RUT CHILENO ---
function validarRut(rut: string): boolean {
  if (!rut) return false;

  // 1. Limpiar el RUT (quitar puntos y guión)
  const valor = rut.replace(/\./g, "").replace(/-/g, "").toLowerCase();

  // 2. Separar cuerpo y dígito verificador
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1);

  if (cuerpo.length < 7) return false; // Muy corto

  // 3. Calcular dígito verificador (Algoritmo Módulo 11)
  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
    const index = multiplo * parseInt(valor.charAt(valor.length - i - 1));
    suma = suma + index;
    if (multiplo < 7) {
      multiplo = multiplo + 1;
    } else {
      multiplo = 2;
    }
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = "";

  if (dvEsperado === 11) dvCalculado = "0";
  else if (dvEsperado === 10) dvCalculado = "k";
  else dvCalculado = dvEsperado.toString();

  return dvCalculado === dv;
}

// -------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    // Si no existe el usuario en BD (pero sí en sesión), devolvemos datos vacíos sin error
    if (!user) {
      return NextResponse.json({
        user: {
          name: session.user.name,
          email: session.user.email,
          role: "USER",
        },
        company: {},
      });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      company: user.company || {},
    });
  } catch (error) {
    console.error("Error cargando configuración:", error);
    return NextResponse.json(
      { error: "Error al cargar configuración" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // 1. OBTENER USUARIO ACTUAL (El que está haciendo la petición)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, companyId: true }, // Traemos el rol real de la BD
    });

    if (!currentUser)
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );

    const isSuperAdmin = currentUser.role === "SUPERADMIN";

    // --- ZONA DE SEGURIDAD ---

    // A. ¿Intentan cambiar el Rol?
    if (body.userRole && body.userRole !== currentUser.role) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "No tienes permisos para cambiar roles." },
          { status: 403 }
        );
      }
    }

    // B. ¿Intentan cambiar el Email?
    if (body.userEmail && body.userEmail !== session.user.email) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Solo un SuperAdmin puede modificar correos electrónicos." },
          { status: 403 }
        );
      }
      // Validar duplicados si es SuperAdmin
      const existe = await prisma.user.findUnique({
        where: { email: body.userEmail },
      });
      if (existe)
        return NextResponse.json(
          { error: "Ese correo ya está en uso." },
          { status: 400 }
        );
    }

    // 2. PREPARAR DATOS DE ACTUALIZACIÓN
    // Usamos esta sintaxis para agregar campos solo si se cumplen las condiciones
    const updateData = {
      name: body.userName,
      // Si es SuperAdmin Y enviaron email, lo agregamos al objeto:
      ...(isSuperAdmin && body.userEmail ? { email: body.userEmail } : {}),
      // Si es SuperAdmin Y enviaron rol, lo agregamos al objeto:
      ...(isSuperAdmin && body.userRole ? { role: body.userRole } : {}),
    };

    // 3. ACTUALIZAR USUARIO
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    // 4. ACTUALIZAR EMPRESA (Lógica existente...)
    // (Aquí podrías agregar también que solo ADMIN o SUPERADMIN modifiquen la empresa)
    if (body.companyName) {
      // ... tu código de empresa existente ...
      if (updatedUser.companyId) {
        await prisma.company.update({
          where: { id: updatedUser.companyId },
          data: {
            name: body.companyName,
            rut: body.companyRut,
            address: body.companyAddress,
            logoUrl: body.companyLogoUrl,
          },
        });
      }
      // ...
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Error interno al guardar" },
      { status: 500 }
    );
  }
}
