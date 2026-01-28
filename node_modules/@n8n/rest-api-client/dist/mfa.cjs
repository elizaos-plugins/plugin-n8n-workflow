const require_utils = require('./utils2.cjs');

//#region src/api/mfa.ts
async function canEnableMFA(context) {
	return await require_utils.makeRestApiRequest(context, "POST", "/mfa/can-enable");
}
async function getMfaQR(context) {
	return await require_utils.makeRestApiRequest(context, "GET", "/mfa/qr");
}
async function enableMfa(context, data) {
	return await require_utils.makeRestApiRequest(context, "POST", "/mfa/enable", data);
}
async function verifyMfaCode(context, data) {
	return await require_utils.makeRestApiRequest(context, "POST", "/mfa/verify", data);
}
async function disableMfa(context, data) {
	return await require_utils.makeRestApiRequest(context, "POST", "/mfa/disable", data);
}
async function updateEnforceMfa(context, enforce) {
	return await require_utils.makeRestApiRequest(context, "POST", "/mfa/enforce-mfa", { enforce });
}

//#endregion
Object.defineProperty(exports, 'canEnableMFA', {
  enumerable: true,
  get: function () {
    return canEnableMFA;
  }
});
Object.defineProperty(exports, 'disableMfa', {
  enumerable: true,
  get: function () {
    return disableMfa;
  }
});
Object.defineProperty(exports, 'enableMfa', {
  enumerable: true,
  get: function () {
    return enableMfa;
  }
});
Object.defineProperty(exports, 'getMfaQR', {
  enumerable: true,
  get: function () {
    return getMfaQR;
  }
});
Object.defineProperty(exports, 'updateEnforceMfa', {
  enumerable: true,
  get: function () {
    return updateEnforceMfa;
  }
});
Object.defineProperty(exports, 'verifyMfaCode', {
  enumerable: true,
  get: function () {
    return verifyMfaCode;
  }
});
//# sourceMappingURL=mfa.cjs.map