/**
 * Middleware de validación centralizada mediante esquemas de Zod
 */
const { ZodError } = require('zod');

const validarBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Extrae el primer mensaje de error amigable para el usuario
      const primerError = error.errors[0]?.message || 'Datos de entrada inválidos';
      return res.status(400).json({ error: primerError });
    }
    return res.status(400).json({ error: 'Error en el formato de los datos enviados' });
  }
};

module.exports = {
  validarBody
};
