export function obtenerTextoErrorAuth(status: number): string {
  switch (status) {
    case 401:
      return 'PIN o credenciales incorrectas. Vuelve a intentarlo.';
    case 423:
      return 'Usuario bloqueado por superar los 5 intentos fallidos. Contacta al Admin.';
    case 404:
      return 'El QR o token ingresado no es válido para este restaurante.';
    default:
      return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
}