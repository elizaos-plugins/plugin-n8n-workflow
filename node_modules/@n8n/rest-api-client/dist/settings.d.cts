import { t as IRestApiContext } from "./types2.cjs";
import { FrontendSettings } from "@n8n/api-types";

//#region src/api/settings.d.ts
declare function getSettings(context: IRestApiContext): Promise<FrontendSettings>;
//#endregion
export { getSettings as t };
//# sourceMappingURL=settings.d.cts.map