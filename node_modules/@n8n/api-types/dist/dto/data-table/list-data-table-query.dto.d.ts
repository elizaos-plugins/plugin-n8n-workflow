import { z } from 'zod';
import { Z } from 'zod-class';
declare const VALID_SORT_OPTIONS: readonly ["name:asc", "name:desc", "createdAt:asc", "createdAt:desc", "updatedAt:asc", "updatedAt:desc", "sizeBytes:asc", "sizeBytes:desc"];
export type ListDataTableQuerySortOptions = (typeof VALID_SORT_OPTIONS)[number];
declare const ListDataTableQueryDto_base: Z.Class<{
    filter: z.ZodEffects<z.ZodOptional<z.ZodString>, {
        id?: string | string[] | undefined;
        name?: string | string[] | undefined;
        projectId?: string | string[] | undefined;
    } | undefined, string | undefined>;
    sortBy: z.ZodOptional<z.ZodEnum<["name:asc", "name:desc", "createdAt:asc", "createdAt:desc", "updatedAt:asc", "updatedAt:desc", "sizeBytes:asc", "sizeBytes:desc"]>>;
    skip: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>, number, string | undefined>;
    take: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>, number, string | undefined>, number, string | undefined>, number, string | undefined>;
}>;
export declare class ListDataTableQueryDto extends ListDataTableQueryDto_base {
}
export {};
