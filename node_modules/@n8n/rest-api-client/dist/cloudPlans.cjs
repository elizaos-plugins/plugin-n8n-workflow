const require_utils = require('./utils2.cjs');

//#region src/api/cloudPlans.ts
async function getCurrentPlan(context) {
	return await require_utils.get(context.baseUrl, "/admin/cloud-plan");
}
async function getCurrentUsage(context) {
	return await require_utils.get(context.baseUrl, "/cloud/limits");
}
async function getCloudUserInfo(context) {
	return await require_utils.get(context.baseUrl, "/cloud/proxy/user/me");
}
async function sendConfirmationEmail(context) {
	return await require_utils.post(context.baseUrl, "/cloud/proxy/user/resend-confirmation-email");
}
async function getAdminPanelLoginCode(context) {
	return await require_utils.get(context.baseUrl, "/cloud/proxy/login/code");
}
async function sendUserEvent(context, eventData) {
	return await require_utils.post(context.baseUrl, "/cloud/proxy/user/event", eventData);
}

//#endregion
Object.defineProperty(exports, 'getAdminPanelLoginCode', {
  enumerable: true,
  get: function () {
    return getAdminPanelLoginCode;
  }
});
Object.defineProperty(exports, 'getCloudUserInfo', {
  enumerable: true,
  get: function () {
    return getCloudUserInfo;
  }
});
Object.defineProperty(exports, 'getCurrentPlan', {
  enumerable: true,
  get: function () {
    return getCurrentPlan;
  }
});
Object.defineProperty(exports, 'getCurrentUsage', {
  enumerable: true,
  get: function () {
    return getCurrentUsage;
  }
});
Object.defineProperty(exports, 'sendConfirmationEmail', {
  enumerable: true,
  get: function () {
    return sendConfirmationEmail;
  }
});
Object.defineProperty(exports, 'sendUserEvent', {
  enumerable: true,
  get: function () {
    return sendUserEvent;
  }
});
//# sourceMappingURL=cloudPlans.cjs.map