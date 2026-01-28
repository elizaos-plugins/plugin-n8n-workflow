import { t as IRestApiContext } from "../types2.cjs";
import { BreakingChangeLightReportResult, BreakingChangeVersion, BreakingChangeWorkflowRuleResult } from "@n8n/api-types";

//#region src/api/breaking-changes.d.ts
type BreakingChangeQuery = {
  version?: BreakingChangeVersion;
};
declare function getReport(context: IRestApiContext, query?: BreakingChangeQuery): Promise<BreakingChangeLightReportResult>;
declare function refreshReport(context: IRestApiContext, query?: BreakingChangeQuery): Promise<BreakingChangeLightReportResult>;
declare function getReportForRule(context: IRestApiContext, ruleId: string): Promise<BreakingChangeWorkflowRuleResult>;
//#endregion
export { getReport, getReportForRule, refreshReport };
//# sourceMappingURL=breaking-changes.d.cts.map