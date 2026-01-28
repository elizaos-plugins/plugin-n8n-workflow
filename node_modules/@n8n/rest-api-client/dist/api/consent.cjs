const require_utils = require('../utils2.cjs');

//#region src/api/consent.ts
async function getConsentDetails(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/consent/details");
}
async function approveConsent(context, approved) {
	return await require_utils.makeRestApiRequest(context, "POST", "/consent/approve", { approved });
}

//#endregion
exports.approveConsent = approveConsent;
exports.getConsentDetails = getConsentDetails;
//# sourceMappingURL=consent.cjs.map