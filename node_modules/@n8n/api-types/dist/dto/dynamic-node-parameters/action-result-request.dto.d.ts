import { z } from 'zod';
import { BaseDynamicParametersRequestDto } from './base-dynamic-parameters-request.dto';
declare const ActionResultRequestDto_base: {
    Handler: z.ZodString;
    Payload: z.ZodOptional<z.ZodUnion<[z.ZodObject<{}, "strip", z.ZodAny, z.objectOutputType<{}, z.ZodAny, "strip">, z.objectInputType<{}, z.ZodAny, "strip">>, z.ZodString]>>;
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
    handler: string;
} & {
    payload?: string | z.objectOutputType<{}, z.ZodAny, "strip"> | undefined;
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
    handler: string;
} & {
    payload?: string | z.objectOutputType<{}, z.ZodAny, "strip"> | undefined;
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
}, "payload" | "handler"> & {
    handler: z.ZodString;
    payload: z.ZodOptional<z.ZodUnion<[z.ZodObject<{}, "strip", z.ZodAny, z.objectOutputType<{}, z.ZodAny, "strip">, z.objectInputType<{}, z.ZodAny, "strip">>, z.ZodString]>>;
}>;
export declare class ActionResultRequestDto extends ActionResultRequestDto_base {
}
export {};
