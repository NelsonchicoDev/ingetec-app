import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Listar todas las plantillas
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" }, // Las más nuevas primero
      include: {
        _count: {
          select: { inspections: true }, // Contamos cuántas veces se ha usado
        },
      },
    });

    // Devolvemos los datos
    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("Error obteniendo plantillas:", error);
    return NextResponse.json(
      { error: "Error obteniendo plantillas" },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva plantilla
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as unknown as { role: string })?.role;

    // Verificamos permisos
    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "Solo administradores pueden crear plantillas" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Extraemos los datos, incluyendo customFields
    const { title, description, structure, customFields } = body;

    if (!title || !structure) {
      return NextResponse.json(
        { error: "Falta título o estructura" },
        { status: 400 }
      );
    }

    // Guardamos en la base de datos
    const newTemplate = await prisma.template.create({
      data: {
        title,
        description,
        structure,
        // Aseguramos que se guarden los campos personalizados
        customFields: customFields || [],
      },
    });

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Error creando plantilla:", error);
    return NextResponse.json(
      { error: "Error al crear plantilla" },
      { status: 500 }
    );
  }
}
