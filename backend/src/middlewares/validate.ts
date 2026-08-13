import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.issues ? error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          })) : []
        });
        return;
      }
      res.status(400).json({ message: 'Invalid request payload' });
    }
  };
};
