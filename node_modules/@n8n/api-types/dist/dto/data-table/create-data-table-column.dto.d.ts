import { Z } from 'zod-class';
declare const CreateDataTableColumnDto_base: Z.Class<{
    name: import("zod").ZodString;
    type: import("zod").ZodEnum<["string", "number", "boolean", "date"]>;
}>;
export declare class CreateDataTableColumnDto extends CreateDataTableColumnDto_base {
}
export {};
