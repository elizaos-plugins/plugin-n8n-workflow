import { t as IRestApiContext } from "./types2.mjs";
import { Method, RawAxiosRequestHeaders } from "axios";
import { ApplicationError, GenericValue, IDataObject } from "n8n-workflow";

//#region src/utils.d.ts
declare const NO_NETWORK_ERROR_CODE = 999;
declare const STREAM_SEPARATOR = "\u29C9\u21CB\u21CB\u27BD\u2311\u29C9\u00A7\u00A7\n";
declare class MfaRequiredError extends ApplicationError {
  constructor();
}
declare class ResponseError extends ApplicationError {
  httpStatusCode?: number;
  errorCode?: number;
  serverStackTrace?: string;
  meta?: Record<string, unknown>;
  hint?: string;
  constructor(message: string, options?: {
    errorCode?: number;
    httpStatusCode?: number;
    stack?: string;
    meta?: Record<string, unknown>;
    hint?: ResponseError['hint'];
  });
}
declare function request(config: {
  method: Method;
  baseURL: string;
  endpoint: string;
  headers?: RawAxiosRequestHeaders;
  data?: GenericValue | GenericValue[];
  withCredentials?: boolean;
}): Promise<any>;
declare function getFullApiResponse<T>(context: IRestApiContext, method: Method, endpoint: string, data?: GenericValue | GenericValue[]): Promise<{
  count: number;
  data: T;
}>;
declare function makeRestApiRequest<T>(context: IRestApiContext, method: Method, endpoint: string, data?: GenericValue | GenericValue[]): Promise<T>;
declare function get(baseURL: string, endpoint: string, params?: IDataObject, headers?: RawAxiosRequestHeaders): Promise<any>;
declare function post(baseURL: string, endpoint: string, params?: IDataObject, headers?: RawAxiosRequestHeaders): Promise<any>;
declare function patch(baseURL: string, endpoint: string, params?: IDataObject, headers?: RawAxiosRequestHeaders): Promise<any>;
declare function streamRequest<T extends object>(context: IRestApiContext, apiEndpoint: string, payload: object, onChunk?: (chunk: T) => void, onDone?: () => void, onError?: (e: Error) => void, separator?: string, abortSignal?: AbortSignal): Promise<void>;
//#endregion
export { get as a, patch as c, streamRequest as d, STREAM_SEPARATOR as i, post as l, NO_NETWORK_ERROR_CODE as n, getFullApiResponse as o, ResponseError as r, makeRestApiRequest as s, MfaRequiredError as t, request as u };
//# sourceMappingURL=utils2.d.mts.map