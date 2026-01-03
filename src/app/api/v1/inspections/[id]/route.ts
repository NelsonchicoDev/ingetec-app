import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// 👇 CORRECCIÓN NEXT.JS 15: Definimos el tipo con Promise
type RouteParams = { params: Promise<{ id: string }> };

// GET: Obtener la inspección para llenarla
export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const params = await props.params;
    const { id } = params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        company: { select: { name: true, rut: true } },
        worker: {
          select: {
            name: true,
            role: true,
            rut: true,
            secRegistrationNumber: true,
            digitalSignature: true,
          },
        },
        template: {
          select: {
            title: true,
            customFields: true,
          },
        },
      },
    });

    if (!inspection)
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    return NextResponse.json(inspection);
  } catch (error) {
    console.error("Error GET Inspection:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT: Guardar respuestas y finalizar
export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const params = await props.params;
    const body = await req.json();

    // Extraemos todo lo que envía el frontend
    const { checklistData, customValues, status, score, signature, photos } =
      body;

    const updatedInspection = await prisma.inspection.update({
      where: { id: params.id },
      data: {
        checklistData,
        customValues: customValues || {},
        status,
        score,
        signature, // Firma de la inspección
        photos: photos || [], // Fotos de evidencia
        signedAt: status === "COMPLETED" ? new Date() : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedInspection);
  } catch (error) {
    console.error("Error PATCH Inspection:", error);
    return NextResponse.json(
      { error: "Error actualizando inspección" },
      { status: 500 }
    );
  }
}
