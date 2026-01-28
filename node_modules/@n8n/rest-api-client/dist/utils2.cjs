//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let __n8n_constants = require("@n8n/constants");
let __n8n_utils_assert = require("@n8n/utils/assert");
let axios = require("axios");
axios = __toESM(axios);
let n8n_workflow = require("n8n-workflow");

//#region src/utils.ts
const getBrowserId = () => {
	let browserId = localStorage.getItem(__n8n_constants.BROWSER_ID_STORAGE_KEY);
	if (!browserId) {
		browserId = crypto.randomUUID();
		localStorage.setItem(__n8n_constants.BROWSER_ID_STORAGE_KEY, browserId);
	}
	return browserId;
};
const NO_NETWORK_ERROR_CODE = 999;
const STREAM_SEPARATOR = "⧉⇋⇋➽⌑⧉§§\n";
var MfaRequiredError = class extends n8n_workflow.ApplicationError {
	constructor() {
		super("MFA is required to access this resource. Please set up MFA in your user settings.");
		this.name = "MfaRequiredError";
	}
};
var ResponseError = class extends n8n_workflow.ApplicationError {
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
	if ({}.env.NODE_ENV !== "production" && !baseURL.includes("api.n8n.io") && !baseURL.includes("n8n.cloud")) options.withCredentials = options.withCredentials ?? true;
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
		return (await axios.default.request(options)).data;
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
						data = (0, n8n_workflow.jsonParse)(splitChunk, { errorMessage: "Invalid json" });
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
		(0, __n8n_utils_assert.assert)(e instanceof Error);
		onErrorOnce?.(e);
	}
}

//#endregion
Object.defineProperty(exports, 'MfaRequiredError', {
  enumerable: true,
  get: function () {
    return MfaRequiredError;
  }
});
Object.defineProperty(exports, 'NO_NETWORK_ERROR_CODE', {
  enumerable: true,
  get: function () {
    return NO_NETWORK_ERROR_CODE;
  }
});
Object.defineProperty(exports, 'ResponseError', {
  enumerable: true,
  get: function () {
    return ResponseError;
  }
});
Object.defineProperty(exports, 'STREAM_SEPARATOR', {
  enumerable: true,
  get: function () {
    return STREAM_SEPARATOR;
  }
});
Object.defineProperty(exports, '__toESM', {
  enumerable: true,
  get: function () {
    return __toESM;
  }
});
Object.defineProperty(exports, 'get', {
  enumerable: true,
  get: function () {
    return get;
  }
});
Object.defineProperty(exports, 'getFullApiResponse', {
  enumerable: true,
  get: function () {
    return getFullApiResponse;
  }
});
Object.defineProperty(exports, 'makeRestApiRequest', {
  enumerable: true,
  get: function () {
    return makeRestApiRequest;
  }
});
Object.defineProperty(exports, 'patch', {
  enumerable: true,
  get: function () {
    return patch;
  }
});
Object.defineProperty(exports, 'post', {
  enumerable: true,
  get: function () {
    return post;
  }
});
Object.defineProperty(exports, 'request', {
  enumerable: true,
  get: function () {
    return request;
  }
});
Object.defineProperty(exports, 'streamRequest', {
  enumerable: true,
  get: function () {
    return streamRequest;
  }
});
//# sourceMappingURL=utils2.cjs.map