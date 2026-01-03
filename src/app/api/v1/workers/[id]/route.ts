import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// 👇 CORRECCIÓN PARA NEXT.JS 15: Definimos params como una Promesa
type RouteParams = { params: Promise<{ id: string }> };

// GET: Obtener un trabajador
export async function GET(req: NextRequest, props: RouteParams) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // 👇 AQUÍ ESTÁ EL ARREGLO: Usamos "await" antes de usar params
  const params = await props.params;
  const { id } = params;

  const worker = await prisma.worker.findUnique({
    where: { id },
    include: { company: true },
  });

  if (!worker)
    return NextResponse.json(
      { error: "Trabajador no encontrado" },
      { status: 404 }
    );

  return NextResponse.json(worker);
}

// PUT: Actualizar trabajador
export async function PUT(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    // Validación de permisos
    const userRole = (session?.user as unknown as { role: string })?.role;
    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 👇 AQUÍ ESTÁ EL ARREGLO: Usamos "await"
    const params = await props.params;
    const { id } = params;

    const body = await req.json();

    // Validamos que el ID exista antes de llamar a Prisma
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const updatedWorker = await prisma.worker.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        phone: body.phone,
        // Si envían companyId vacío, lo guardamos como null
        companyId: body.companyId || null,
      },
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error actualizando trabajador:", error);
    return NextResponse.json(
      { error: "Error actualizando trabajador" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar trabajador
export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth();
    const userRole = (session?.user as unknown as { role: string })?.role;

    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 👇 AQUÍ ESTÁ EL ARREGLO: Usamos "await"
    const params = await props.params;
    const { id } = params;

    await prisma.worker.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando trabajador:", error);
    return NextResponse.json(
      { error: "Error eliminando trabajador" },
      { status: 500 }
    );
  }
}
