import { z } from 'zod';
import { Z } from 'zod-class';
declare const CreateRoleDto_base: Z.Class<{
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    roleType: z.ZodEnum<["project"]>;
    scopes: z.ZodArray<z.ZodEffects<z.ZodString, string, string>, "many">;
}>;
export declare class CreateRoleDto extends CreateRoleDto_base {
}
export {};
