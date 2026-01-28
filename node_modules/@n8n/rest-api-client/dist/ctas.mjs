import { a as get } from "./utils2.mjs";

//#region src/api/ctas.ts
async function getBecomeCreatorCta(context) {
	return await get(context.baseUrl, "/cta/become-creator");
}

//#endregion
export { getBecomeCreatorCta as t };
//# sourceMappingURL=ctas.mjs.map