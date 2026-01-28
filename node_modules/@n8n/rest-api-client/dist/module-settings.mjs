import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/module-settings.ts
async function getModuleSettings(context) {
	return await makeRestApiRequest(context, "GET", "/module-settings");
}

//#endregion
export { getModuleSettings as t };
//# sourceMappingURL=module-settings.mjs.map