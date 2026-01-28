import { t as IRestApiContext } from "./types2.cjs";
import { CredentialResolver, CredentialResolverType } from "@n8n/api-types";

//#region src/api/credentialResolvers.d.ts
declare function getCredentialResolvers(context: IRestApiContext): Promise<CredentialResolver[]>;
declare function getCredentialResolverTypes(context: IRestApiContext): Promise<CredentialResolverType[]>;
declare function getCredentialResolver(context: IRestApiContext, resolverId: string): Promise<CredentialResolver>;
declare function createCredentialResolver(context: IRestApiContext, payload: {
  name: string;
  type: string;
  config: Record<string, unknown>;
}): Promise<CredentialResolver>;
declare function updateCredentialResolver(context: IRestApiContext, resolverId: string, payload: {
  name: string;
  type: string;
  config: Record<string, unknown>;
  clearCredentials?: boolean;
}): Promise<CredentialResolver>;
declare function deleteCredentialResolver(context: IRestApiContext, resolverId: string): Promise<void>;
//#endregion
export { getCredentialResolvers as a, getCredentialResolverTypes as i, deleteCredentialResolver as n, updateCredentialResolver as o, getCredentialResolver as r, createCredentialResolver as t };
//# sourceMappingURL=credentialResolvers.d.cts.map