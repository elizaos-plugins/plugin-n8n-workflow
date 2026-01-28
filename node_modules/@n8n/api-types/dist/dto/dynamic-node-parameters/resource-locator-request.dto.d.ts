import { z } from 'zod';
import { BaseDynamicParametersRequestDto } from './base-dynamic-parameters-request.dto';
declare const ResourceLocatorRequestDto_base: {
    MethodName: z.ZodString;
    Filter: z.ZodOptional<z.ZodString>;
    PaginationToken: z.ZodOptional<z.ZodString>;
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
} & import("zod-class").ZodClass<{
    methodName: string;
} & {
    filter?: string | undefined;
    paginationToken?: string | undefined;
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
}, {
    methodName: string;
} & {
    filter?: string | undefined;
    paginationToken?: string | undefined;
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
}, "filter" | "methodName" | "paginationToken"> & {
    methodName: z.ZodString;
    filter: z.ZodOptional<z.ZodString>;
    paginationToken: z.ZodOptional<z.ZodString>;
}>;
export declare class ResourceLocatorRequestDto extends ResourceLocatorRequestDto_base {
}
export {};
