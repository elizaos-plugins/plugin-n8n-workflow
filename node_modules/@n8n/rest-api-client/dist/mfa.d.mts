import { t as IRestApiContext } from "./types2.mjs";

//#region src/api/mfa.d.ts
declare function canEnableMFA(context: IRestApiContext): Promise<unknown>;
declare function getMfaQR(context: IRestApiContext): Promise<{
  qrCode: string;
  secret: string;
  recoveryCodes: string[];
}>;
declare function enableMfa(context: IRestApiContext, data: {
  mfaCode: string;
}): Promise<void>;
declare function verifyMfaCode(context: IRestApiContext, data: {
  mfaCode: string;
}): Promise<void>;
type DisableMfaParams = {
  mfaCode?: string;
  mfaRecoveryCode?: string;
};
declare function disableMfa(context: IRestApiContext, data: DisableMfaParams): Promise<void>;
declare function updateEnforceMfa(context: IRestApiContext, enforce: boolean): Promise<void>;
//#endregion
export { getMfaQR as a, enableMfa as i, canEnableMFA as n, updateEnforceMfa as o, disableMfa as r, verifyMfaCode as s, DisableMfaParams as t };
//# sourceMappingURL=mfa.d.mts.map