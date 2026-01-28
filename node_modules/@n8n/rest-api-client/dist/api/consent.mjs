import { s as makeRestApiRequest } from "../utils2.mjs";

//#region src/api/consent.ts
async function getConsentDetails(context) {
	return await makeRestApiRequest(context, "GET", "/consent/details");
}
async function approveConsent(context, approved) {
	return await makeRestApiRequest(context, "POST", "/consent/approve", { approved });
}

//#endregion
export { approveConsent, getConsentDetails };
//# sourceMappingURL=consent.mjs.map