import { z } from 'zod';
import { Z } from 'zod-class';
import { CreateDataTableColumnDto } from './create-data-table-column.dto';
declare const CreateDataTableDto_base: Z.Class<{
    name: z.ZodString;
    columns: z.ZodArray<typeof CreateDataTableColumnDto, "many">;
    fileId: z.ZodOptional<z.ZodString>;
    hasHeaders: z.ZodOptional<z.ZodBoolean>;
}>;
export declare class CreateDataTableDto extends CreateDataTableDto_base {
}
export {};
