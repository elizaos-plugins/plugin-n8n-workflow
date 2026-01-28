import { t as IRestApiContext } from "./types2.mjs";
import { PublicInstalledPackage } from "n8n-workflow";

//#region src/api/communityNodes.d.ts
declare function getInstalledCommunityNodes(context: IRestApiContext): Promise<PublicInstalledPackage[]>;
declare function installNewPackage(context: IRestApiContext, name: string, verify?: boolean, version?: string): Promise<PublicInstalledPackage>;
declare function uninstallPackage(context: IRestApiContext, name: string): Promise<void>;
declare function updatePackage(context: IRestApiContext, name: string, version?: string, checksum?: string): Promise<PublicInstalledPackage>;
declare function getAvailableCommunityPackageCount(): Promise<number>;
//#endregion
export { updatePackage as a, uninstallPackage as i, getInstalledCommunityNodes as n, installNewPackage as r, getAvailableCommunityPackageCount as t };
//# sourceMappingURL=communityNodes.d.mts.map