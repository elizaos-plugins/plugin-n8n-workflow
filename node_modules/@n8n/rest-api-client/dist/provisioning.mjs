import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/provisioning.ts
const getProvisioningConfig = async (context) => {
	return await makeRestApiRequest(context, "GET", "/sso/provisioning/config");
};
const saveProvisioningConfig = async (context, config) => {
	return await makeRestApiRequest(context, "PATCH", "/sso/provisioning/config", config);
};

//#endregion
export { saveProvisioningConfig as n, getProvisioningConfig as t };
//# sourceMappingURL=provisioning.mjs.map