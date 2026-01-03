import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    // Si no hay sesión, devolvemos lista vacía para no romper el front (o error 401 si prefieres)
    if (!session) return NextResponse.json([]);

    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { title: true } },
        company: { select: { name: true } },
        worker: { select: { name: true } },
      },
    });

    // 👇 LA SOLUCIÓN: Si por alguna razón es null/undefined, devolvemos []
    return NextResponse.json(Array.isArray(inspections) ? inspections : []);
  } catch (error) {
    console.error("Error listando inspecciones:", error);
    // En caso de error, devolvemos lista vacía para que la página cargue igual
    return NextResponse.json([]);
  }
}

// POST: Crear una nueva inspección (Borrador)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const userId = session.user?.id;
    const body = await req.json();
    const { companyId, workerId, templateId } = body;

    // 1. Validar datos
    if (!companyId || !workerId || !templateId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // 2. Buscar la plantilla original para copiar su estructura
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // 3. Crear la Inspección (Snapshot)
    // Guardamos la estructura de la plantilla dentro de 'checklistData'
    // para que si la plantilla cambia mañana, esta inspección no se rompa.
    const newInspection = await prisma.inspection.create({
      data: {
        companyId,
        workerId,
        templateId,
        userId: userId, // El inspector que la creó
        title: template.title, // Copiamos el título
        status: "DRAFT",
        checklistData: template.structure || [], // 👈 AQUÍ OCURRE LA MAGIA
        score: 0,
      },
    });

    return NextResponse.json(newInspection);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al iniciar inspección" },
      { status: 500 }
    );
  }
}
