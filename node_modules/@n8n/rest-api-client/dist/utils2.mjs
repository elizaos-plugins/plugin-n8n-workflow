import { BROWSER_ID_STORAGE_KEY } from "@n8n/constants";
import { assert } from "@n8n/utils/assert";
import axios from "axios";
import { ApplicationError, jsonParse } from "n8n-workflow";

//#region src/utils.ts
const getBrowserId = () => {
	let browserId = localStorage.getItem(BROWSER_ID_STORAGE_KEY);
	if (!browserId) {
		browserId = crypto.randomUUID();
		localStorage.setItem(BROWSER_ID_STORAGE_KEY, browserId);
	}
	return browserId;
};
const NO_NETWORK_ERROR_CODE = 999;
const STREAM_SEPARATOR = "⧉⇋⇋➽⌑⧉§§\n";
var MfaRequiredError = class extends ApplicationError {
	constructor() {
		super("MFA is required to access this resource. Please set up MFA in your user settings.");
		this.name = "MfaRequiredError";
	}
};
var ResponseError = class extends ApplicationError {
	httpStatusCode;
	errorCode;
	serverStackTrace;
	meta;
	hint;
	/**
	* Creates an instance of ResponseError.
	* @param {string} message The error message
	* @param {number} [errorCode] The error code which can be used by frontend to identify the actual error
	* @param {number} [httpStatusCode] The HTTP status code the response should have
	* @param {string} [stack] The stack trace
	* @param {Record<string, unknown>} [meta] Additional metadata from the server
	* @param {string} [hint] Additional hint from the server
	*/
	constructor(message, options = {}) {
		super(message);
		this.name = "ResponseError";
		const { errorCode, httpStatusCode, stack, meta, hint } = options;
		if (errorCode) this.errorCode = errorCode;
		if (httpStatusCode) this.httpStatusCode = httpStatusCode;
		if (stack) this.serverStackTrace = stack;
		if (meta) this.meta = meta;
		if (hint) this.hint = hint;
	}
};
const legacyParamSerializer = (params) => Object.keys(params).filter((key) => params[key] !== void 0).map((key) => {
	if (Array.isArray(params[key])) return params[key].map((v) => `${key}[]=${encodeURIComponent(v)}`).join("&");
	if (typeof params[key] === "object") params[key] = JSON.stringify(params[key]);
	return `${key}=${encodeURIComponent(params[key])}`;
}).join("&");
async function request(config) {
	const { method, baseURL, endpoint, headers, data } = config;
	const options = {
		method,
		url: endpoint,
		baseURL,
		headers: headers ?? {}
	};
	if (baseURL.startsWith("/")) options.headers["browser-id"] = getBrowserId();
	if (import.meta.env.NODE_ENV !== "production" && !baseURL.includes("api.n8n.io") && !baseURL.includes("n8n.cloud")) options.withCredentials = options.withCredentials ?? true;
	if ([
		"POST",
		"PATCH",
		"PUT"
	].includes(method)) options.data = data;
	else if (data) {
		options.params = data;
		options.paramsSerializer = legacyParamSerializer;
	}
	try {
		return (await axios.request(options)).data;
	} catch (error) {
		if (error.message === "Network Error") throw new ResponseError("Can't connect to n8n.", { errorCode: NO_NETWORK_ERROR_CODE });
		const errorResponseData = error.response?.data;
		if (errorResponseData?.mfaRequired === true) throw new MfaRequiredError();
		if (errorResponseData?.message !== void 0) {
			if (errorResponseData.name === "NodeApiError") {
				errorResponseData.httpStatusCode = error.response.status;
				throw errorResponseData;
			}
			throw new ResponseError(errorResponseData.message, {
				errorCode: errorResponseData.code,
				httpStatusCode: error.response.status,
				stack: errorResponseData.stack,
				meta: errorResponseData.meta,
				hint: errorResponseData.hint
			});
		}
		throw error;
	}
}
/**
* Sends a request to the API and returns the response without extracting the data key.
* @param context Rest API context
* @param method HTTP method
* @param endpoint relative path to the API endpoint
* @param data request data
* @returns data and total count
*/
async function getFullApiResponse(context, method, endpoint, data) {
	return await request({
		method,
		baseURL: context.baseUrl,
		endpoint,
		headers: { "push-ref": context.pushRef },
		data
	});
}
async function makeRestApiRequest(context, method, endpoint, data) {
	return (await request({
		method,
		baseURL: context.baseUrl,
		endpoint,
		headers: { "push-ref": context.pushRef },
		data
	})).data;
}
async function get(baseURL, endpoint, params, headers) {
	return await request({
		method: "GET",
		baseURL,
		endpoint,
		headers,
		data: params
	});
}
async function post(baseURL, endpoint, params, headers) {
	return await request({
		method: "POST",
		baseURL,
		endpoint,
		headers,
		data: params
	});
}
async function patch(baseURL, endpoint, params, headers) {
	return await request({
		method: "PATCH",
		baseURL,
		endpoint,
		headers,
		data: params
	});
}
async function streamRequest(context, apiEndpoint, payload, onChunk, onDone, onError, separator = STREAM_SEPARATOR, abortSignal) {
	let onErrorOnce = (e) => {
		onErrorOnce = void 0;
		onError?.(e);
	};
	const assistantRequest = {
		headers: {
			"browser-id": getBrowserId(),
			"Content-Type": "application/json"
		},
		method: "POST",
		credentials: "include",
		body: JSON.stringify(payload),
		signal: abortSignal
	};
	try {
		const response = await fetch(`${context.baseUrl}${apiEndpoint}`, assistantRequest);
		if (response.body) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder("utf-8");
			let buffer = "";
			async function readStream() {
				const { done, value } = await reader.read();
				if (done) {
					if (response.ok) onDone?.();
					else onErrorOnce?.(new ResponseError(response.statusText, { httpStatusCode: response.status }));
					return;
				}
				const chunk = decoder.decode(value);
				buffer += chunk;
				const splitChunks = buffer.split(separator);
				buffer = "";
				for (const splitChunk of splitChunks) if (splitChunk) {
					let data;
					try {
						data = jsonParse(splitChunk, { errorMessage: "Invalid json" });
					} catch (e) {
						buffer += splitChunk;
						continue;
					}
					try {
						if (response.ok) onChunk?.(data);
						else {
							const message = "message" in data ? data.message : response.statusText;
							onErrorOnce?.(new ResponseError(String(message), { httpStatusCode: response.status }));
						}
					} catch (e) {
						if (e instanceof Error) onErrorOnce?.(e);
					}
				}
				await readStream();
			}
			await readStream();
		} else if (onErrorOnce) onErrorOnce(new Error(response.statusText));
	} catch (e) {
		assert(e instanceof Error);
		onErrorOnce?.(e);
	}
}

//#endregion
export { get as a, patch as c, streamRequest as d, STREAM_SEPARATOR as i, post as l, NO_NETWORK_ERROR_CODE as n, getFullApiResponse as o, ResponseError as r, makeRestApiRequest as s, MfaRequiredError as t, request as u };
//# sourceMappingURL=utils2.mjs.map