import { z } from 'zod';
import { Z } from 'zod-class';
declare const SamlPreferencesAttributeMapping_base: Z.Class<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    userPrincipalName: z.ZodString;
    n8nInstanceRole: z.ZodOptional<z.ZodString>;
    n8nProjectRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}>;
export declare class SamlPreferencesAttributeMapping extends SamlPreferencesAttributeMapping_base {
}
declare const SamlPreferences_base: Z.Class<{
    mapping: z.ZodOptional<typeof SamlPreferencesAttributeMapping>;
    metadata: z.ZodOptional<z.ZodString>;
    metadataUrl: z.ZodOptional<z.ZodString>;
    ignoreSSL: z.ZodDefault<z.ZodBoolean>;
    loginBinding: z.ZodDefault<z.ZodEnum<["redirect", "post"]>>;
    loginEnabled: z.ZodOptional<z.ZodBoolean>;
    loginLabel: z.ZodOptional<z.ZodString>;
    authnRequestsSigned: z.ZodDefault<z.ZodBoolean>;
    wantAssertionsSigned: z.ZodDefault<z.ZodBoolean>;
    wantMessageSigned: z.ZodDefault<z.ZodBoolean>;
    acsBinding: z.ZodDefault<z.ZodEnum<["redirect", "post"]>>;
    signatureConfig: z.ZodDefault<z.ZodObject<{
        prefix: z.ZodDefault<z.ZodString>;
        location: z.ZodObject<{
            reference: z.ZodString;
            action: z.ZodEnum<["before", "after", "prepend", "append"]>;
        }, "strip", z.ZodTypeAny, {
            action: "before" | "after" | "prepend" | "append";
            reference: string;
        }, {
            action: "before" | "after" | "prepend" | "append";
            reference: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        prefix: string;
        location: {
            action: "before" | "after" | "prepend" | "append";
            reference: string;
        };
    }, {
        location: {
            action: "before" | "after" | "prepend" | "append";
            reference: string;
        };
        prefix?: string | undefined;
    }>>;
    relayState: z.ZodDefault<z.ZodString>;
}>;
export declare class SamlPreferences extends SamlPreferences_base {
}
export {};
