import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/usage.ts
const getLicense = async (context) => {
	return await makeRestApiRequest(context, "GET", "/license");
};
const activateLicenseKey = async (context, data) => {
	return await makeRestApiRequest(context, "POST", "/license/activate", data);
};
const renewLicense = async (context) => {
	return await makeRestApiRequest(context, "POST", "/license/renew");
};
const requestLicenseTrial = async (context) => {
	return await makeRestApiRequest(context, "POST", "/license/enterprise/request_trial");
};
const registerCommunityEdition = async (context, params) => {
	return await makeRestApiRequest(context, "POST", "/license/enterprise/community-registered", params);
};

//#endregion
export { requestLicenseTrial as a, renewLicense as i, getLicense as n, registerCommunityEdition as r, activateLicenseKey as t };
//# sourceMappingURL=usage.mjs.map