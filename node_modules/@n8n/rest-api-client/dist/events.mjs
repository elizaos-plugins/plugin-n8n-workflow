import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/events.ts
async function sessionStarted(context) {
	return await makeRestApiRequest(context, "GET", "/events/session-started");
}

//#endregion
export { sessionStarted as t };
//# sourceMappingURL=events.mjs.map