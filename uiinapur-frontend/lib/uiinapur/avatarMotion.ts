export type AvatarMotion={speed:number;grounded:boolean;phase:number;wave?:number;visualSpeed?:number};
export type Appearance={shirt:string;skin:string;hair:string;pants:string};
export const PLAYER_APPEARANCE:Appearance={shirt:'#39796c',skin:'#d7ae91',hair:'#17252c',pants:'#20323e'};
export function animateAvatar(m:AvatarMotion,delta:number) {
  const dt=Math.min(delta,.05);
  m.visualSpeed=(m.visualSpeed??0)+(m.speed-(m.visualSpeed??0))*(1-Math.exp(-14*dt));
  const speed=m.visualSpeed;
  m.phase+=dt*(speed>.04?3+speed*5.5:2);
  m.wave=Math.max(0,(m.wave??0)-dt);
  const swing=Math.sin(m.phase)*(speed>.04?Math.min(.8,speed*.4):.025);
  return {leftArm:m.grounded?-swing:-.8,rightArm:m.grounded?swing:-.8,
    waveZ:m.wave>0?-2.3+Math.sin(m.phase*2)*.3:0,
    leftLeg:m.grounded?swing:.4,rightLeg:m.grounded?-swing:-.35,
    bob:m.grounded?Math.abs(Math.sin(m.phase))*(speed>.04?.012:.003):0};
}
