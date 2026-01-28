import { s as makeRestApiRequest } from "./utils2.mjs";

//#region src/api/npsSurvey.ts
async function updateNpsSurveyState(context, state) {
	await makeRestApiRequest(context, "PATCH", "/user-settings/nps-survey", state);
}

//#endregion
export { updateNpsSurveyState as t };
//# sourceMappingURL=npsSurvey.mjs.map