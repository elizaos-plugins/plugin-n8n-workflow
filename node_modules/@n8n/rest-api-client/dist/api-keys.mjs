import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/api-keys.ts
async function getApiKeys(context) {
	return await makeRestApiRequest(context, "GET", "/api-keys");
}
async function getApiKeyScopes(context) {
	return await makeRestApiRequest(context, "GET", "/api-keys/scopes");
}
async function createApiKey(context, payload) {
	return await makeRestApiRequest(context, "POST", "/api-keys", payload);
}
async function deleteApiKey(context, id) {
	return await makeRestApiRequest(context, "DELETE", `/api-keys/${id}`);
}
async function updateApiKey(context, id, payload) {
	return await makeRestApiRequest(context, "PATCH", `/api-keys/${id}`, payload);
}

//#endregion
export { updateApiKey as a, getApiKeys as i, deleteApiKey as n, getApiKeyScopes as r, createApiKey as t };
//# sourceMappingURL=api-keys.mjs.map