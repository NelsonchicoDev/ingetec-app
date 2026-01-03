export const formatRut = (rut: string): string => {
  if (!rut) return "";
  const value = rut.replace(/[^0-9kK]/g, ""); // Limpiar puntos y guiones

  const body = value.slice(0, -1);
  const dv = value.slice(-1).toUpperCase();

  if (value.length < 2) return value; // Si es muy corto, devolvemos como está

  // Formato 1.000.000
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
};

export const validateRut = (rut: string): boolean => {
  if (!rut || rut.trim().length < 2) return false;

  // 1. Limpiar el RUT (dejar solo números y K)
  const value = rut.replace(/[^0-9kK]/g, "");

  // 2. Separar Cuerpo y Dígito Verificador
  const body = value.slice(0, -1);
  const dv = value.slice(-1).toUpperCase();

  // 3. Validar que el cuerpo sean solo números
  if (!/^[0-9]+$/.test(body)) return false;

  // 4. Algoritmo de validación (Módulo 11)
  let suma = 0;
  let multiplo = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body[i]) * multiplo;
    if (multiplo < 7) multiplo += 1;
    else multiplo = 2;
  }

  const dvEsperado = 11 - (suma % 11);

  let dvCalculado = "";
  if (dvEsperado === 11) dvCalculado = "0";
  else if (dvEsperado === 10) dvCalculado = "K";
  else dvCalculado = dvEsperado.toString();

  // 5. Comparar
  return dvCalculado === dv;
};
