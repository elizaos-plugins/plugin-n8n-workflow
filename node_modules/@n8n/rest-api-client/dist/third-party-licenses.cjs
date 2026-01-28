const require_utils = require('./utils2.cjs');

//#region src/api/third-party-licenses.ts
async function getThirdPartyLicenses(context) {
	return await require_utils.request({
		method: "GET",
		baseURL: context.baseUrl,
		endpoint: "/third-party-licenses"
	});
}

//#endregion
Object.defineProperty(exports, 'getThirdPartyLicenses', {
  enumerable: true,
  get: function () {
    return getThirdPartyLicenses;
  }
});
//# sourceMappingURL=third-party-licenses.cjs.map