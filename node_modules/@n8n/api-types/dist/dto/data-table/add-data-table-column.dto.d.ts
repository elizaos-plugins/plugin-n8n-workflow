import { Z } from 'zod-class';
declare const AddDataTableColumnDto_base: Z.Class<{
    name: import("zod").ZodString;
    type: import("zod").ZodEnum<["string", "number", "boolean", "date"]>;
    index: import("zod").ZodOptional<import("zod").ZodNumber>;
}>;
export declare class AddDataTableColumnDto extends AddDataTableColumnDto_base {
}
export {};
