const assert=require('node:assert/strict');
const {freshWalkInput,WALK}=require('../work/social-test/walk.js');
const {createKeyboard,readMovement,resetMovement,toggleRun,joystickVector,createCameraPointers}=require('../work/social-test/walkInput.js');
const {animateAvatar}=require('../work/social-test/avatarMotion.js');
const {CITIZENS,citizenReply}=require('../work/social-test/citizens.js');
const {createCrowd,freshSocial,lineOfSight}=require('../work/social-test/social.js');
const {clearStreet}=require('../work/social-test/city.js');
const THREE=require('three');
const {terrainSampler,buildCity}=require('../work/social-test/cityGeometry.js');
const {territories}=require('../work/social-test/data.js');
let prevented=0,escaped=0,editing=false;
const event=(code,shift=false,repeat=false)=>({code,shiftKey:shift,repeat,preventDefault(){prevented++;}});
const input=freshWalkInput(),keys=new Set(),keyboard=createKeyboard(input,keys,()=>editing,()=>escaped++);
const velocity=()=>{const m=readMovement(input,keys,0);return Math.hypot(m.dir.x,m.dir.z)*m.speed;};
const distance=(seconds)=>{let x=0,z=0;for(let i=0;i<60*seconds;i++){const m=readMovement(input,keys,.47);x+=m.dir.x*m.speed/60;z+=m.dir.z*m.speed/60;}return Math.hypot(x,z);};
keyboard.down(event('KeyW'));const walking=distance(2);assert(Math.abs(walking-2.4)<1e-10);
for(const shift of ['ShiftLeft','ShiftRight']){
 keyboard.down(event(shift,true));assert(Math.abs(distance(2)/walking-1.7)<1e-10);
 keyboard.down(event('KeyD',true));assert(Math.abs(distance(2)/walking-1.7)<1e-10,'Diagonal is normalized');
 keyboard.up(event('KeyD',true));keyboard.up(event(shift,false));assert.equal(velocity(),WALK.speed);
}
keyboard.down(event('ShiftLeft',true));keyboard.down(event('ShiftRight',true));keyboard.up(event('ShiftLeft',true));assert.equal(velocity(),WALK.runSpeed);keyboard.up(event('ShiftRight',false));
// Regression: mode mounts while Shift is already held, so its original keydown was never delivered.
keyboard.clear();keyboard.down(event('KeyW',true));assert.equal(velocity(),WALK.runSpeed);keyboard.up(event('KeyW',false));
keyboard.down({key:'W',shiftKey:true,preventDefault(){}});assert.equal(velocity(),WALK.runSpeed);keyboard.clear();
for(let mode=0;mode<4;mode++){const i=freshWalkInput(),k=new Set(),h=createKeyboard(i,k,()=>false,()=>{});h.down(event('KeyW',true));assert.equal(readMovement(i,k,0).speed,WALK.runSpeed);h.clear();assert.equal(k.size,0);assert(!i.shift&&!i.run);}
editing=true;const old=prevented;keyboard.down(event('KeyW',true));assert.equal(prevented,old);assert.equal(keys.size,0);keyboard.down(event('Escape'));assert.equal(escaped,0);editing=false;
keyboard.down(event('Escape'));assert.equal(escaped,1);
// Exact shared helpers used by the mobile JSX event handlers.
const stick=joystickVector(100,-100,36);assert(Math.abs(Math.hypot(stick.x,stick.y)-1)<1e-10);input.x=stick.x;input.y=stick.y;
assert.equal(toggleRun(input),true);assert(Math.abs(velocity()-WALK.runSpeed)<1e-10);assert.equal(toggleRun(input),false);assert(Math.abs(velocity()-WALK.speed)<1e-10);
assert.deepEqual(joystickVector(1,1,36),{x:0,y:0});input.jump=true;resetMovement(input,keys);assert(!input.jump&&!input.run&&input.x===0&&input.y===0);
input.blocked=true;assert.equal(toggleRun(input),false);keyboard.down(event('KeyW',true));assert.equal(velocity(),0);input.blocked=false;
const camera={yaw:0,pitch:.3,distance:2.1},pointer=createCameraPointers(camera);pointer.down(3,10,10);pointer.move(3,50,30);assert(camera.yaw!==0);const yaw=camera.yaw;
pointer.down(4,100,30);pointer.move(4,150,30);assert(camera.distance<2.1);assert.equal(camera.yaw,yaw);pointer.end(4);pointer.move(3,60,30);assert.notEqual(camera.yaw,yaw);pointer.clear();const oldYaw=camera.yaw;pointer.move(3,90,30);assert.equal(camera.yaw,oldYaw);
const a={speed:WALK.speed,grounded:true,phase:0},b={speed:WALK.runSpeed,grounded:true,phase:0};for(let i=0;i<120;i++){animateAvatar(a,1/60);animateAvatar(b,1/60);}assert(b.phase>a.phase*1.4);b.speed=0;for(let i=0;i<120;i++)animateAvatar(b,1/60);assert(b.visualSpeed<.001);
console.log('PASS: actual input helper regression for held-before-entry Shift, both Shift keys, release, normalized diagonals, 1.7x displacement, re-entry, input/dialog suppression, mobile Run ON/OFF, joystick deadzone, jump reset, drag/pinch/end and speed-based animation.');
assert.equal(CITIZENS.length,16);assert.equal(new Set(CITIZENS.map(c=>c.id)).size,16);assert.equal(new Set(CITIZENS.map(c=>c.name)).size,16);assert.equal(new Set(CITIZENS.map(c=>c.home)).size,5);
const root=new THREE.Group(),material=new THREE.MeshBasicMaterial();
for(const t of territories){const shape=new THREE.Shape();t.points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.12,bevelThickness:.15}),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=.25;mesh.userData.walkGround=true;root.add(mesh);}
const sample=terrainSampler(root),city=buildCity(sample);const height=(x,z)=>{const h=sample(x,z);return h?Math.max(h.y,city.surfaceAt(x,z)??-Infinity):null;};
const crowd=createCrowd(height),replay=createCrowd(height),session=freshSocial(()=>{},()=>{}),other=freshSocial(()=>{},()=>{});session.agents=crowd.agents;
for(let frame=0;frame<3600;frame++){
 crowd.step(1/60,session);replay.step(1/60,other);
 if(frame%60===0)for(const agent of crowd.agents){assert(clearStreet(agent.x,agent.z,.11),'NPC stays in walkable public space');assert(Math.abs(agent.y-height(agent.x,agent.z))<.04);}
}
assert.deepEqual(crowd.agents,replay.agents,'Deterministic navigation');assert(crowd.agents.every(n=>n.travelled>2),'All citizens genuinely moved');
const target=crowd.agents[0];session.player={x:target.x,y:target.y,z:target.z+.2,ready:true};session.activeId=CITIZENS[0].id;const saved=[target.x,target.z],heading=target.heading;session.waveRequest++;crowd.step(.05,session);assert.deepEqual([target.x,target.z],saved);assert.equal(target.motion.wave,2.4);assert.notEqual(target.heading,heading);
assert(!lineOfSight([-5,-.5],[-5,.5]),'Cannot talk through the fountain');
assert(citizenReply(CITIZENS[0],'place','Café Aurayarr',0).includes('Café Aurayarr'));assert(citizenReply(CITIZENS[0],'wave','plaza',0).includes('waves back'));
city.dispose();root.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});material.dispose();
console.log('PASS: 16 unique demo citizens, 5 homes, deterministic 60-second navigation on actual extruded terrain, all agents moving, safe paths, terrain following, talk stops movement/turns/waves, line-of-sight and scripted contextual dialogue.');
