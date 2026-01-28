import { z } from 'zod';
import { Z } from 'zod-class';
export declare const KEY_NAME_REGEX: RegExp;
export declare const KEY_MAX_LENGTH = 50;
export declare const VALUE_MAX_LENGTH = 1000;
export declare const TYPE_ENUM: readonly ["string"];
export declare const TYPE_DEFAULT: (typeof TYPE_ENUM)[number];
export declare const variableKeySchema: z.ZodString;
export declare const variableValueSchema: z.ZodString;
export declare const variableTypeSchema: z.ZodDefault<z.ZodEnum<["string"]>>;
declare const BaseVariableRequestDto_base: Z.Class<{
    key: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["string"]>>;
    value: z.ZodString;
}>;
export declare class BaseVariableRequestDto extends BaseVariableRequestDto_base {
}
export {};
