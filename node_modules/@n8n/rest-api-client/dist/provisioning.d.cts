import { t as IRestApiContext } from "./types2.cjs";

//#region src/api/provisioning.d.ts
interface ProvisioningConfig {
  scopesInstanceRoleClaimName: string;
  scopesName: string;
  scopesProjectsRolesClaimName: string;
  scopesProvisionInstanceRole: boolean;
  scopesProvisionProjectRoles: boolean;
}
declare const getProvisioningConfig: (context: IRestApiContext) => Promise<ProvisioningConfig>;
declare const saveProvisioningConfig: (context: IRestApiContext, config: Partial<ProvisioningConfig>) => Promise<ProvisioningConfig>;
//#endregion
export { getProvisioningConfig as n, saveProvisioningConfig as r, ProvisioningConfig as t };
//# sourceMappingURL=provisioning.d.cts.map