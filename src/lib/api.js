export async function call(promise){const r=await promise;if(!r?.ok)throw new Error(r?.error||'Eternal backend request failed.');return r.data;} export const api=window.eternal;
