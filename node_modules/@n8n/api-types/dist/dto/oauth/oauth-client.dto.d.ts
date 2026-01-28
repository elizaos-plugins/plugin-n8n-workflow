import { z } from 'zod';
import { Z } from 'zod-class';
declare const OAuthClientResponseDto_base: Z.Class<{
    id: z.ZodString;
    name: z.ZodString;
    redirectUris: z.ZodArray<z.ZodString, "many">;
    grantTypes: z.ZodArray<z.ZodString, "many">;
    tokenEndpointAuthMethod: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}>;
export declare class OAuthClientResponseDto extends OAuthClientResponseDto_base {
}
declare const ListOAuthClientsResponseDto_base: Z.Class<{
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        redirectUris: z.ZodArray<z.ZodString, "many">;
        grantTypes: z.ZodArray<z.ZodString, "many">;
        tokenEndpointAuthMethod: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        redirectUris: string[];
        grantTypes: string[];
        tokenEndpointAuthMethod: string;
    }, {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
        redirectUris: string[];
        grantTypes: string[];
        tokenEndpointAuthMethod: string;
    }>, "many">;
    count: z.ZodNumber;
}>;
export declare class ListOAuthClientsResponseDto extends ListOAuthClientsResponseDto_base {
}
declare const DeleteOAuthClientResponseDto_base: Z.Class<{
    success: z.ZodBoolean;
    message: z.ZodString;
}>;
export declare class DeleteOAuthClientResponseDto extends DeleteOAuthClientResponseDto_base {
}
export {};
