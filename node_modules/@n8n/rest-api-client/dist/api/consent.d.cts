import { t as IRestApiContext } from "../types2.cjs";

//#region src/api/consent.d.ts
interface ConsentDetails {
  clientName: string;
  clientId: string;
}
interface ConsentApprovalResponse {
  status: string;
  redirectUrl: string;
}
declare function getConsentDetails(context: IRestApiContext): Promise<ConsentDetails>;
declare function approveConsent(context: IRestApiContext, approved: boolean): Promise<ConsentApprovalResponse>;
//#endregion
export { ConsentApprovalResponse, ConsentDetails, approveConsent, getConsentDetails };
//# sourceMappingURL=consent.d.cts.map