import { u as request } from "./utils2.mjs";

//#region src/api/third-party-licenses.ts
async function getThirdPartyLicenses(context) {
	return await request({
		method: "GET",
		baseURL: context.baseUrl,
		endpoint: "/third-party-licenses"
	});
}

//#endregion
export { getThirdPartyLicenses as t };
//# sourceMappingURL=third-party-licenses.mjs.map