import { z } from 'zod';
import { Z } from 'zod-class';
declare const AddDataTableRowsDto_base: Z.Class<{
    data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull, z.ZodDate]>>, "many">;
    returnType: z.ZodUnion<[z.ZodLiteral<"all">, z.ZodLiteral<"count">, z.ZodLiteral<"id">]>;
}>;
export declare class AddDataTableRowsDto extends AddDataTableRowsDto_base {
}
export {};
