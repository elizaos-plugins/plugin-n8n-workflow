import { t as IRestApiContext } from "./types2.cjs";
import { CommunityRegisteredRequestDto, UsageState } from "@n8n/api-types";

//#region src/api/usage.d.ts
declare const getLicense: (context: IRestApiContext) => Promise<UsageState["data"]>;
declare const activateLicenseKey: (context: IRestApiContext, data: {
  activationKey: string;
  eulaUri?: string;
}) => Promise<UsageState["data"]>;
declare const renewLicense: (context: IRestApiContext) => Promise<UsageState["data"]>;
declare const requestLicenseTrial: (context: IRestApiContext) => Promise<UsageState["data"]>;
declare const registerCommunityEdition: (context: IRestApiContext, params: CommunityRegisteredRequestDto) => Promise<{
  title: string;
  text: string;
}>;
//#endregion
export { requestLicenseTrial as a, renewLicense as i, getLicense as n, registerCommunityEdition as r, activateLicenseKey as t };
//# sourceMappingURL=usage.d.cts.map