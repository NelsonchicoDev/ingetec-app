import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

// GET: Listar todos los usuarios
export async function GET(req: NextRequest) {
  const session = await auth();

  // 👇 FIX: Usamos ?. para acceder de forma segura
  const userRole = (session?.user as unknown as { role: string })?.role;

  if (
    !session ||
    !session.user ||
    (userRole !== "ADMIN" && userRole !== "SUPERADMIN")
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(users);
}

// POST: Crear un nuevo usuario
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // 👇 FIX: Guardamos el rol en una variable segura primero
    const userRole = (session?.user as unknown as { role: string })?.role;

    // Validamos sesión y rol
    if (
      !session ||
      !session.user ||
      (userRole !== "ADMIN" && userRole !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para crear usuarios" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    // Validar campos obligatorios
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "El correo ya está registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}
