import { a as get, l as post } from "./utils2.mjs";

//#region src/api/cloudPlans.ts
async function getCurrentPlan(context) {
	return await get(context.baseUrl, "/admin/cloud-plan");
}
async function getCurrentUsage(context) {
	return await get(context.baseUrl, "/cloud/limits");
}
async function getCloudUserInfo(context) {
	return await get(context.baseUrl, "/cloud/proxy/user/me");
}
async function sendConfirmationEmail(context) {
	return await post(context.baseUrl, "/cloud/proxy/user/resend-confirmation-email");
}
async function getAdminPanelLoginCode(context) {
	return await get(context.baseUrl, "/cloud/proxy/login/code");
}
async function sendUserEvent(context, eventData) {
	return await post(context.baseUrl, "/cloud/proxy/user/event", eventData);
}

//#endregion
export { sendConfirmationEmail as a, getCurrentUsage as i, getCloudUserInfo as n, sendUserEvent as o, getCurrentPlan as r, getAdminPanelLoginCode as t };
//# sourceMappingURL=cloudPlans.mjs.map