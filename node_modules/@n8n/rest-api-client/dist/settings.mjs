import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/settings.ts
async function getSettings(context) {
	return await makeRestApiRequest(context, "GET", "/settings");
}

//#endregion
export { getSettings as t };
//# sourceMappingURL=settings.mjs.map