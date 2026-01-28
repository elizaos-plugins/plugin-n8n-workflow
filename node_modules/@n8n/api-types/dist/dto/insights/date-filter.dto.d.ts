import { z } from 'zod';
import { Z } from 'zod-class';
declare const InsightsDateFilterDto_base: Z.Class<{
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    projectId: z.ZodOptional<z.ZodString>;
}>;
export declare class InsightsDateFilterDto extends InsightsDateFilterDto_base {
}
export {};
