import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Definir el email a arreglar (cámbialo si usas otro)
    const targetEmail = "nelsonchico@gmail.com";
    const newPassword = "123456";

    // 2. Buscar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `¡Usuario ${targetEmail} NO encontrado en la Base de Datos!`,
          tip: "Revisa si escribiste bien el correo en este archivo.",
        },
        { status: 404 }
      );
    }

    // 3. Encriptar la contraseña "123456"
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar el usuario
    await prisma.user.update({
      where: { email: targetEmail },
      data: {
        password: hashedPassword,
        role: "SUPERADMIN", // De paso nos aseguramos que seas SuperAdmin
      },
    });

    return NextResponse.json({
      success: true,
      message: `Usuario ${targetEmail} actualizado correctamente.`,
      info: "Ahora tu contraseña es 123456 y eres SUPERADMIN.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
