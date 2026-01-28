import { t as IRestApiContext } from "./types2.cjs";
import { NpsSurveyState } from "n8n-workflow";

//#region src/api/npsSurvey.d.ts
declare function updateNpsSurveyState(context: IRestApiContext, state: NpsSurveyState): Promise<void>;
//#endregion
export { updateNpsSurveyState as t };
//# sourceMappingURL=npsSurvey.d.cts.map