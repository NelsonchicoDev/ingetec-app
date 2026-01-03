import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    // Opcional: Incluir conteo de trabajadores o inspecciones si lo necesitas
    include: {
      _count: {
        select: { inspections: true, workers: true },
      },
    },
  });

  return NextResponse.json(companies);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Solo Admins o SuperAdmins deberían crear empresas
    const userRole = (session?.user as unknown as { role: string })?.role;
    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    // 👇 AJUSTADO A TU SCHEMA
    const { name, rut, address, phone, industry } = body;

    // Validar RUT duplicado
    const existing = await prisma.company.findUnique({ where: { rut } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una empresa con ese RUT" },
        { status: 400 }
      );
    }

    const newCompany = await prisma.company.create({
      data: {
        name,
        rut,
        address,
        phone,
        industry,
        status: "ACTIVE", // Valor por defecto
      },
    });

    return NextResponse.json(newCompany);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear empresa" },
      { status: 500 }
    );
  }
}
