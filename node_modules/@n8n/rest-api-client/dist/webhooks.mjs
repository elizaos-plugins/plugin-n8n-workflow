import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/webhooks.ts
const findWebhook = async (context, data) => {
	return await makeRestApiRequest(context, "POST", "/webhooks/find", data);
};

//#endregion
export { findWebhook as t };
//# sourceMappingURL=webhooks.mjs.map