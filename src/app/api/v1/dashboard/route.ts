import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    // Ejecutamos todas las consultas en paralelo para que sea ultra rápido
    const [
      companiesCount,
      workersCount,
      inspectionsCount,
      approvedInspections,
    ] = await Promise.all([
      prisma.company.count({ where: { status: "ACTIVE" } }), // Solo empresas activas
      prisma.worker.count(),
      prisma.inspection.count(),
      prisma.inspection.count({ where: { status: "APPROVED" } }),
    ]);

    // Calculamos Tasa de Aprobación
    const approvalRate =
      inspectionsCount > 0
        ? Math.round((approvedInspections / inspectionsCount) * 100)
        : 0;

    return apiResponse({
      data: {
        companies: companiesCount,
        workers: workersCount,
        inspections: inspectionsCount,
        approvalRate: approvalRate,
      },
    });
  } catch (error) {
    console.error(error);
    return apiResponse({ error: "Error cargando estadísticas", status: 500 });
  }
}
