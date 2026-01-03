import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type RouteParams = { params: Promise<{ id: string }> };

// GET: Obtener una plantilla para editarla
export async function GET(req: NextRequest, props: RouteParams) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const params = await props.params;
  const template = await prisma.template.findUnique({
    where: { id: params.id },
  });

  if (!template)
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json(template);
}

// PUT: Actualizar una plantilla existente
export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    const userRole = (session?.user as unknown as { role: string })?.role;

    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const params = await props.params;
    const body = await req.json();
    const { title, description, structure, customFields } = body;

    const updatedTemplate = await prisma.template.update({
      where: { id: params.id },
      data: {
        title,
        description,
        structure,
        customFields: customFields || [],
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error actualizando" }, { status: 500 });
  }
}

// DELETE: Borrar plantilla
export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const params = await props.params;

    await prisma.template.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // 👇 AQUÍ CAPTURAMOS EL ERROR DE PRISMA
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar: Esta plantilla tiene inspecciones asociadas. Por seguridad legal y de historial, no debe borrarse.",
        },
        { status: 400 } // Bad Request
      );
    }

    console.error("Error eliminando plantilla:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
