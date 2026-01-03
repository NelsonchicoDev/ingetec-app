import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // 1. Obtener parámetros de la URL
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  try {
    // 2. Filtro de búsqueda (Buscamos por nombre o email)
    const whereCondition = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // 3. Ejecutar consultas en paralelo (Total y Datos)
    const [total, workers] = await Promise.all([
      prisma.worker.count({ where: whereCondition }),
      prisma.worker.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }, // Los más nuevos primero
      }),
    ]);

    // 4. Calcular total de páginas
    const totalPages = Math.ceil(total / limit);

    return apiResponse({
      data: workers,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return apiResponse({ error: "Error obteniendo trabajadores", status: 500 });
  }
}

// POST para crear trabajador
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      role,
      companyId,
      rut,
      secRegistrationNumber,
      digitalSignature,
      email: email,
    } = body;
    // Validación básica
    if (!body.name || !body.email) {
      return apiResponse({
        error: "Nombre y Email son obligatorios",
        status: 400,
      });
    }

    const newWorker = await prisma.worker.create({
      data: {
        name,
        role,
        companyId,
        rut, // 👈 Guardar RUT
        secRegistrationNumber, // 👈 Guardar N° Registro
        digitalSignature, // 👈 Guardar Firma
        email: email,
      },
    });

    return apiResponse({ data: newWorker, status: 201 });
  } catch (error) {
    // Error P2002 de Prisma es "Unique Constraint" (Email repetido)
    if ((error as any).code === "P2002") {
      return apiResponse({
        error: "Ese correo ya está registrado",
        status: 409,
      });
    }
    return apiResponse({ error: "Error creando trabajador", status: 500 });
  }
}
