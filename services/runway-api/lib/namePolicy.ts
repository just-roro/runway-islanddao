/** Small, deliberately conservative English/Spanish name policy, shared with the client. */
export function offensiveName(value:string){
 const folded=value.normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu,'').toLowerCase().replace(/[013457@$!]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i'}[c]!));
 const words=folded.match(/[a-z]+/g)??[],joined=words.join('');
 // Severe slurs also match inside handles, including separator/zero-width evasions.
 if(/nigg(?:er|a)|faggot/.test(joined))return true;
 const blocked=new Set(['fuck','fucker','fucking','motherfucker','shit','asshole','bitch','cunt','mierda','puta','puto','cabron','gilipollas']);
 return blocked.has(joined)||words.some(word=>blocked.has(word));
}
export const NAME_POLICY_MESSAGE='Use a respectful name without offensive language.';
