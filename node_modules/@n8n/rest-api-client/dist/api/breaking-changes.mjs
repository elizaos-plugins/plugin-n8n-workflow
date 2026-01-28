import { a as get, s as makeRestApiRequest } from "../utils2.mjs";

//#region src/api/breaking-changes.ts
async function getReport(context, query) {
	return (await get(context.baseUrl, "/breaking-changes/report", query)).data;
}
async function refreshReport(context, query) {
	return await makeRestApiRequest(context, "POST", query?.version ? `/breaking-changes/report/refresh?version=${query.version}` : "/breaking-changes/report/refresh");
}
async function getReportForRule(context, ruleId) {
	return (await get(context.baseUrl, `/breaking-changes/report/${ruleId}`)).data;
}

//#endregion
export { getReport, getReportForRule, refreshReport };
//# sourceMappingURL=breaking-changes.mjs.map