import { z } from 'zod';
import { BaseVariableRequestDto } from './base.dto';
declare const CreateVariableRequestDto_base: {
    ProjectId: z.ZodOptional<z.ZodString>;
} & {
    schema: <T>(this: {
        new (input: any): T;
        [key: string]: any;
    }) => z.ZodType<T>;
    Type: z.ZodDefault<z.ZodEnum<["string"]>>;
    prototype: BaseVariableRequestDto;
    staticProps: {
        Key: z.ZodString;
        Type: z.ZodDefault<z.ZodEnum<["string"]>>;
        Value: z.ZodString;
    };
    Key: z.ZodString;
    Value: z.ZodString;
} & import("zod-class").ZodClass<{} & {
    projectId?: string | undefined;
} & {
    value: string;
    type: "string" | undefined;
    key: string;
} & {}, {} & {
    projectId?: string | undefined;
} & BaseVariableRequestDto, Omit<{
    key: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["string"]>>;
    value: z.ZodString;
}, "projectId"> & {
    projectId: z.ZodOptional<z.ZodString>;
}>;
export declare class CreateVariableRequestDto extends CreateVariableRequestDto_base {
}
export {};
