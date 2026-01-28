import { t as IRestApiContext } from "./types2.cjs";
import { FrontendModuleSettings } from "@n8n/api-types";

//#region src/api/module-settings.d.ts
declare function getModuleSettings(context: IRestApiContext): Promise<FrontendModuleSettings>;
//#endregion
export { getModuleSettings as t };
//# sourceMappingURL=module-settings.d.cts.map