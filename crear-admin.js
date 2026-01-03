const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("⏳ Creando usuario administrador...");

  // 1. Encriptar contraseña "123456"
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 2. Insertar o Actualizar en la BD
  const admin = await prisma.worker.upsert({
    where: { email: "admin@prevapp.cl" },
    update: {
      password: hashedPassword,
      role: "ADMINISTRADOR",
    },
    create: {
      name: "Super Admin",
      email: "admin@prevapp.cl",
      password: hashedPassword,
      role: "ADMINISTRADOR",
      // Si tienes companyId obligatorio, descomenta la siguiente línea y pon un ID real o ajusta tu esquema
      // companyId: "algun-id-de-empresa",
    },
  });

  console.log("✅ ¡Éxito! Usuario creado:");
  console.log("📧 Email: admin@prevapp.cl");
  console.log("🔑 Pass:  123456");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
