import definitions from './assets/perks.json';
import {publicUrl} from './urls';
export default definitions.map(p=>({...p,image:publicUrl(p.image)}));
