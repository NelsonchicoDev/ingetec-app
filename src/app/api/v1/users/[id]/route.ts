import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

// PUT: Editar un usuario existente
export async function PUT(
  req: NextRequest,
  // CAMBIO 1: Definimos params como una Promesa
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CAMBIO 2: Esperamos a que se resuelva la promesa para obtener el ID
    const { id } = await params;
    const userId = id;

    const session = await auth();
    // Verificamos permisos (Igual que antes)
    const userRole = (session?.user as unknown as { role: string })?.role;
    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, password } = body;

    // Preparamos los datos a actualizar
    const updateData: any = {
      name,
      email,
      role,
    };

    // Lógica de contraseña: Solo la actualizamos si escribieron algo nuevo
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(
  req: NextRequest,
  // CAMBIO 1: Definimos params como una Promesa
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CAMBIO 2: Esperamos a que se resuelva la promesa para obtener el ID
    const { id } = await params;
    const userIdToDelete = id;

    const session = await auth();
    const userRole = (session?.user as unknown as { role: string })?.role;
    const currentUserId = session?.user?.id;

    if (!session || (userRole !== "ADMIN" && userRole !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // PROTECCIÓN: No permitas que te borres a ti mismo por accidente
    if (userIdToDelete === currentUserId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
// Forzando actualización de Vercel
