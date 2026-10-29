/** Public resources follow the Vite build base, including runtime loader/cache keys. */
export const publicUrl=(path:string)=>import.meta.env.BASE_URL+path.replace(/^\//,'');
export function invitationUrl(code:string){
 const url=new URL(import.meta.env.VITE_PUBLIC_URL||import.meta.env.BASE_URL,location.origin);
 url.searchParams.set('join',code);
 return url.href;
}
