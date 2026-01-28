import type { ILoadOptions } from 'n8n-workflow';
import { z } from 'zod';
import { BaseDynamicParametersRequestDto } from './base-dynamic-parameters-request.dto';
declare const OptionsRequestDto_base: {
    LoadOptions: z.ZodType<ILoadOptions | undefined, z.ZodTypeDef, ILoadOptions | undefined>;
} & {
    Credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    schema: <T>(this: {
        new (input: any): T;
        [key: string]: any;
    }) => z.ZodType<T>;
    ProjectId: z.ZodOptional<z.ZodString>;
    Path: z.ZodString;
    NodeTypeAndVersion: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodEffects<z.ZodNumber, number, number>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: number;
    }, {
        name: string;
        version: number;
    }>;
    CurrentNodeParameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    MethodName: z.ZodOptional<z.ZodString>;
    prototype: BaseDynamicParametersRequestDto;
    staticProps: {
        Path: z.ZodString;
        NodeTypeAndVersion: z.ZodObject<{
            name: z.ZodString;
            version: z.ZodEffects<z.ZodNumber, number, number>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            version: number;
        }, {
            name: string;
            version: number;
        }>;
        CurrentNodeParameters: z.ZodRecord<z.ZodString, z.ZodAny>;
        MethodName: z.ZodOptional<z.ZodString>;
        Credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        ProjectId: z.ZodOptional<z.ZodString>;
    };
} & import("zod-class").ZodClass<{} & {
    loadOptions?: ILoadOptions | undefined;
} & {
    path: string;
    nodeTypeAndVersion: {
        name: string;
        version: number;
    } & {};
    currentNodeParameters: {
        [x: string]: any;
    };
} & {
    credentials?: {
        [x: string]: any;
    } | undefined;
    projectId?: string | undefined;
    methodName?: string | undefined;
}, {} & {
    loadOptions?: ILoadOptions | undefined;
} & BaseDynamicParametersRequestDto, Omit<{
    path: z.ZodString;
    nodeTypeAndVersion: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodEffects<z.ZodNumber, number, number>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        version: number;
    }, {
        name: string;
        version: number;
    }>;
    currentNodeParameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    methodName: z.ZodOptional<z.ZodString>;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    projectId: z.ZodOptional<z.ZodString>;
}, "loadOptions"> & {
    loadOptions: z.ZodType<ILoadOptions | undefined>;
}>;
export declare class OptionsRequestDto extends OptionsRequestDto_base {
}
export {};
