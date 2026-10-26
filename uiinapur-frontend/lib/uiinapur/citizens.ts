import type { Appearance } from './avatarMotion';
export type Citizen={id:string;name:string;home:string;personality:string;role:string;appearance:Appearance;hello:string;tip:string};
const names=['Mira Vale','Arin Sol','Nila Cove','Theo Fern','Isha Bloom','Ravi Moss','Lumi Ash','Dev Rowan','Sora Wren','Kian Reed','Tara Lune','Eli Ember','Anya Rain','Noor Flint','Rhea Pine','Oren Dawn'];
const homes=['Aurayarr','Umbuiina','Inaris','Pinkyork','Fuina'];
const shirts=['#438c79','#c5a568','#7794b6','#ba7c94','#798c68','#b97d61','#8a80b2','#599caa'];
const skins=['#dfb395','#a87555','#714a37','#ecc6a9'];
const roles=['Plaza host','Nature sketcher','Local storyteller','Design enthusiast'];
const personalities=['Warm, curious and always ready to welcome a new explorer.','Quietly observant; loves trees, small gardens and unhurried walks.','Playful and imaginative; collects little stories about the five states.','Thoughtful and creative; notices windows, colors and architectural details.'];
const greetings=['Welcome to Uiinapur! Have you explored our National Plaza?','Hello! I was admiring how the garden colors change beside the stone paving.','A new face! Every little street here seems to invite another story.','Hello, explorer. The studio and Welcome Center are my favorite facades.'];
export const CITIZENS:Citizen[]=names.map((name,i)=>({id:`DEMO-UI-${String(i+1).padStart(4,'0')}`,name,home:homes[i%5],role:roles[i%4],personality:personalities[i%4],appearance:{shirt:shirts[i%8],skin:skins[(i+Math.floor(i/4))%4],hair:['#242d34','#514033','#975d3f','#cac5af'][Math.floor(i/4)],pants:['#253a44','#474454','#34584d','#5c5042'][i%4]},hello:greetings[i%4],tip:['Try the paved route toward the original National Unity Monument.','There are flowering planters and a quiet bench beside the fountain.','Follow the shared street past the café and little marketplace.','Look up at the studio skylight fins and the villa roof.'][i%4]}));
export type ReplyKind='hello'|'wave'|'place';
export function citizenReply(c:Citizen,kind:ReplyKind,location:string,turn:number) {
  if(kind==='wave')return `${c.name} waves back. “Glad to see you here!”`;
  if(kind==='place')return `We’re near ${location}. ${c.tip}`;
  return turn%2===0?c.hello:`I call ${c.home} home. ${c.tip}`;
}
