import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/ldap.ts
async function getLdapConfig(context) {
	return await makeRestApiRequest(context, "GET", "/ldap/config");
}
async function testLdapConnection(context) {
	return await makeRestApiRequest(context, "POST", "/ldap/test-connection");
}
async function updateLdapConfig(context, adConfig) {
	return await makeRestApiRequest(context, "PUT", "/ldap/config", adConfig);
}
async function runLdapSync(context, data) {
	return await makeRestApiRequest(context, "POST", "/ldap/sync", data);
}
async function getLdapSynchronizations(context, pagination) {
	return await makeRestApiRequest(context, "GET", "/ldap/sync", pagination);
}

//#endregion
export { updateLdapConfig as a, testLdapConnection as i, getLdapSynchronizations as n, runLdapSync as r, getLdapConfig as t };
//# sourceMappingURL=ldap.mjs.map