// Contrasena.java cuenta puntos de código y limita BCrypt a 72 bytes UTF-8.
export function contrasenaValida(password: string): boolean {
  const caracteres = Array.from(password).length
  return caracteres >= 8 && caracteres <= 64 && new TextEncoder().encode(password).length <= 72
}

export function emailValido(email: string): boolean {
  return email.length <= 160 && /^[^\s@]+@[^\s@]+$/.test(email)
}
