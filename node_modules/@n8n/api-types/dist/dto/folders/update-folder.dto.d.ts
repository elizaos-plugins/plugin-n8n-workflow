import { z } from 'zod';
import { Z } from 'zod-class';
declare const UpdateFolderDto_base: Z.Class<{
    name: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, string, string>, z.ZodString>>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    parentFolderId: z.ZodOptional<z.ZodString>;
}>;
export declare class UpdateFolderDto extends UpdateFolderDto_base {
}
export {};
