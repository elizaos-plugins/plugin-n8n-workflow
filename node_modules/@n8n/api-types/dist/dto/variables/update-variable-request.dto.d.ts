import { z } from 'zod';
import { Z } from 'zod-class';
declare const UpdateVariableRequestDto_base: Z.Class<{
    key: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["string"]>>>;
    value: z.ZodOptional<z.ZodString>;
    projectId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}>;
export declare class UpdateVariableRequestDto extends UpdateVariableRequestDto_base {
}
export {};
