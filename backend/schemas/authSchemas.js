const { z } = require('zod');

// Esquema de registro de nuevo usuario
const registroSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(20, 'El nombre no puede superar los 20 caracteres'),
  username: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(15, 'El nombre de usuario no puede superar los 15 caracteres'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El formato del correo electrónico no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres')
});

// Esquema de login
const loginSchema = z.object({
  identificador: z
    .string({ required_error: 'Ingresa tu usuario o correo electrónico' })
    .trim()
    .min(1, 'Ingresa tu usuario o correo electrónico'),
  password: z
    .string({ required_error: 'Ingresa tu contraseña' })
    .min(1, 'Ingresa tu contraseña')
});

// Esquema de cambio de contraseña
const cambiarPasswordSchema = z.object({
  passwordActual: z
    .string({ required_error: 'Ingresa tu contraseña actual' })
    .min(1, 'Ingresa tu contraseña actual'),
  passwordNueva: z
    .string({ required_error: 'Ingresa la nueva contraseña' })
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
    .max(72, 'La nueva contraseña no puede superar los 72 caracteres')
});

module.exports = {
  registroSchema,
  loginSchema,
  cambiarPasswordSchema
};
