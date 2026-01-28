import { z } from 'zod';
import { Z } from 'zod-class';
declare const ProvisioningConfigDto_base: Z.Class<{
    scopesProvisionInstanceRole: z.ZodBoolean;
    scopesProvisionProjectRoles: z.ZodBoolean;
    scopesName: z.ZodString;
    scopesInstanceRoleClaimName: z.ZodString;
    scopesProjectsRolesClaimName: z.ZodString;
}>;
export declare class ProvisioningConfigDto extends ProvisioningConfigDto_base {
}
declare const ProvisioningConfigPatchDto_base: Z.Class<{
    scopesProvisionInstanceRole: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    scopesProvisionProjectRoles: z.ZodNullable<z.ZodOptional<z.ZodBoolean>>;
    scopesName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scopesInstanceRoleClaimName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scopesProjectsRolesClaimName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}>;
export declare class ProvisioningConfigPatchDto extends ProvisioningConfigPatchDto_base {
}
export {};
