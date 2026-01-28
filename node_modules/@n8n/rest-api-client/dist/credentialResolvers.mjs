import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/credentialResolvers.ts
async function getCredentialResolvers(context) {
	return await makeRestApiRequest(context, "GET", "/credential-resolvers");
}
async function getCredentialResolverTypes(context) {
	return await makeRestApiRequest(context, "GET", "/credential-resolvers/types");
}
async function getCredentialResolver(context, resolverId) {
	return await makeRestApiRequest(context, "GET", `/credential-resolvers/${resolverId}`);
}
async function createCredentialResolver(context, payload) {
	return await makeRestApiRequest(context, "POST", "/credential-resolvers", payload);
}
async function updateCredentialResolver(context, resolverId, payload) {
	return await makeRestApiRequest(context, "PATCH", `/credential-resolvers/${resolverId}`, payload);
}
async function deleteCredentialResolver(context, resolverId) {
	return await makeRestApiRequest(context, "DELETE", `/credential-resolvers/${resolverId}`);
}

//#endregion
export { getCredentialResolvers as a, getCredentialResolverTypes as i, deleteCredentialResolver as n, updateCredentialResolver as o, getCredentialResolver as r, createCredentialResolver as t };
//# sourceMappingURL=credentialResolvers.mjs.map