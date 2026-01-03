import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/api-response";

export async function GET() {
  try {
    // Promise.all ejecuta las 3 consultas en paralelo (muy rápido)
    const [companiesCount, workersCount, inspectionsCount] = await Promise.all([
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.worker.count(),
      prisma.inspection.count(),
    ]);

    // Calculamos tasa de aprobación (Lógica de negocio simple)
    const totalInspections = inspectionsCount || 1; // Evitar división por cero
    const approvedInspections = await prisma.inspection.count({
      where: { status: "APPROVED" },
    });

    const approvalRate = Math.round(
      (approvedInspections / totalInspections) * 100
    );

    return apiResponse({
      data: {
        companies: companiesCount,
        workers: workersCount,
        inspections: inspectionsCount,
        approvalRate: approvalRate,
      },
    });
  } catch (error) {
    return apiResponse({ error: "Error cargando estadísticas", status: 500 });
  }
}
