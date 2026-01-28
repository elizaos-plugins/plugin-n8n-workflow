import { z } from 'zod';
import { Z } from 'zod-class';
declare const OidcConfigDto_base: Z.Class<{
    clientId: z.ZodString;
    clientSecret: z.ZodString;
    discoveryEndpoint: z.ZodString;
    loginEnabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    prompt: z.ZodDefault<z.ZodOptional<z.ZodEnum<["none", "login", "consent", "select_account", "create"]>>>;
    authenticationContextClassReference: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}>;
export declare class OidcConfigDto extends OidcConfigDto_base {
}
export {};
