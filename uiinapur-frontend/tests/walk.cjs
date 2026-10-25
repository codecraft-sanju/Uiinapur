const assert=require('node:assert/strict');
const {dryFootprint,movement,verticalStep,WALK,riverDistance}=require('../work/walk-test/walk.js');
const {territories,inside}=require('../work/walk-test/data.js');
for(const yaw of [0,.3,Math.PI/2,Math.PI]) {
 const d=movement(1,1,yaw);assert(Math.abs(Math.hypot(d.x,d.z)-1)<1e-10,'no diagonal speed boost');
}
assert.deepEqual(movement(0,1,0),{x:0,z:-1});
assert(Math.abs(movement(0,1,Math.PI/2).x+1)<1e-10);
assert(!dryFootprint(80,80));assert(!dryFootprint(0,-2));assert(riverDistance(0,-2)<1e-8);
for(const t of territories){let safe=0;for(let x=-24;x<25;x+=.2)for(let z=-16;z<18;z+=.2)if(inside([x,z],t.points)&&dryFootprint(x,z))safe++;assert(safe>10,t.name+' has safe spawn candidates');}
// Shared state boundaries are not artificial walls.
assert(dryFootprint(-4.5,3),'Internal AUR/INA border remains passable');
for(const fps of [20,30,60,120]) {
 let p={y:1.1,velocity:WALK.jumpSpeed,grounded:false},peak=p.y;
 for(let i=0;i<fps*2;i++){p=verticalStep(p.y,p.velocity,1.1,1/fps);peak=Math.max(peak,p.y);}
 assert.equal(p.y,1.1);assert.equal(p.velocity,0);assert(p.grounded);assert(peak>1.35&&peak<1.5);
}
console.log('PASS: normalized camera-relative movement, 7 territory footprints, coastline/river blocking, shared borders, gravity, jump and landing at 20/30/60/120 Hz.');
