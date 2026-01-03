import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/api-response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// 1. GET: Obtener una empresa por ID
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company)
    return apiResponse({ error: "Empresa no encontrada", status: 404 });
  return apiResponse({ data: company });
}

// 2. DELETE: Eliminar empresa
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    await prisma.company.delete({
      where: { id },
    });
    return apiResponse({ data: { success: true } });
  } catch (error) {
    return apiResponse({ error: "No se pudo eliminar", status: 500 });
  }
}

// 3. PATCH: Actualizar empresa (LO NUEVO)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = await req.json();

    // Actualizamos solo los campos que nos envíen
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        rut: body.rut,
        industry: body.industry,
        status: body.status,
      },
    });

    return apiResponse({ data: updatedCompany });
  } catch (error) {
    console.error("Error actualizando:", error);
    return apiResponse({
      error: "Error al actualizar la empresa",
      status: 500,
    });
  }
}
