import {it,expect,vi} from 'vitest';
it('all callers await the same actual upload; an empty flush cannot lock the queue',async()=>{
 vi.resetModules();const saved=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v)});
 const s=await import('../src/services/session');s.profile.identity={id:'me',token:'test'};
 await s.flushQueue();await s.flushQueue(); // empty attempts must release the lock
 const ticket={id:'run-46',seed:17,rules:'test',content:'test',expires:999999};s.enqueue(ticket,[]);
 let resolve!:(value:unknown)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise(r=>resolve=r)));
 const a=s.flushQueue(),b=s.flushQueue();expect(a).toBe(b);expect(s.submissionState(ticket)).toBe('pending');let done=false;void b.then(()=>done=true);await Promise.resolve();expect(done).toBe(false);
 resolve({ok:true,json:async()=>({verified:true})});await b;expect(done).toBe(true);expect(s.submissionState(ticket)).toBe('verified');expect(fetch).toHaveBeenCalledTimes(1);vi.unstubAllGlobals();
});
