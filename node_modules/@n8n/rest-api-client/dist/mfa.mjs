import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/mfa.ts
async function canEnableMFA(context) {
	return await makeRestApiRequest(context, "POST", "/mfa/can-enable");
}
async function getMfaQR(context) {
	return await makeRestApiRequest(context, "GET", "/mfa/qr");
}
async function enableMfa(context, data) {
	return await makeRestApiRequest(context, "POST", "/mfa/enable", data);
}
async function verifyMfaCode(context, data) {
	return await makeRestApiRequest(context, "POST", "/mfa/verify", data);
}
async function disableMfa(context, data) {
	return await makeRestApiRequest(context, "POST", "/mfa/disable", data);
}
async function updateEnforceMfa(context, enforce) {
	return await makeRestApiRequest(context, "POST", "/mfa/enforce-mfa", { enforce });
}

//#endregion
export { updateEnforceMfa as a, getMfaQR as i, disableMfa as n, verifyMfaCode as o, enableMfa as r, canEnableMFA as t };
//# sourceMappingURL=mfa.mjs.map