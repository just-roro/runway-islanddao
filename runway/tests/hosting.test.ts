import {afterEach,expect,it,vi} from 'vitest';
import {publicUrl,invitationUrl} from '../src/urls';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
it('keeps runtime asset paths and invitations under the selected build base',()=>{
 vi.stubGlobal('location',{origin:'http://127.0.0.1:5191'});
 for(const base of ['/','/islanddao/']){
  vi.stubEnv('BASE_URL',base);vi.stubEnv('VITE_PUBLIC_URL','');
  expect(publicUrl('/assets/models/runway-pilot.glb?v=art-33')).toBe(base+'assets/models/runway-pilot.glb?v=art-33');
  expect(publicUrl('licenses.txt')).toBe(base+'licenses.txt');
  expect(invitationUrl('ABCDEF1234')).toBe('http://127.0.0.1:5191'+base+'?join=ABCDEF1234');
 }
 vi.stubEnv('VITE_PUBLIC_URL','https://humanfriendly.global/islanddao/');
 expect(invitationUrl('A&B')).toBe('https://humanfriendly.global/islanddao/?join=A%26B');
});
