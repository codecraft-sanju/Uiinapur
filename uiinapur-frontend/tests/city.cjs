const assert=require('node:assert/strict');
const fs=require('node:fs');
const THREE=require('three');
const city=require('../work/city-test/city.js');
const {buildCity,terrainSampler}=require('../work/city-test/cityGeometry.js');
const {territories,plots}=require('../work/city-test/data.js');
const {dryFootprint,WALK}=require('../work/city-test/walk.js');
const plan=city.createCityPlan();
assert.equal(city.CITY_BUILDINGS.length,6);
assert.equal(new Set(city.CITY_BUILDINGS.map(b=>b.kind)).size,6);
for(const object of city.cityObstacles){
 assert(!city.parcelReservations.some(p=>city.overlaps(object,p)),'No object overlaps reserved parcels');
 assert(!city.legacyTrees.some(p=>city.overlaps(object,p)),'No object overlaps original trees');
}
for(const route of plan.routes){
 assert(Math.hypot(route[0][0]-city.PLAZA_SPAWN[0],route[0][1]-city.PLAZA_SPAWN[1])<.08);
 for(let i=0;i<route.length;i++){
  const [x,z]=route[i];assert(city.clearStreet(x,z));assert(dryFootprint(x,z));
  if(i)assert(Math.abs(Math.hypot(x-route[i-1][0],z-route[i-1][1])-.1)<1e-8);
 }
}
// Rebuild the exact existing extruded terrain parameters from World.tsx, not a flat test plane.
const worldSource=fs.readFileSync('components/uiinapur/World.tsx','utf8');
assert(worldSource.includes('depth: .7, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .12, bevelThickness: .15'));
const terrain=new THREE.Group(),mat=new THREE.MeshBasicMaterial();
for(const t of territories){
 const shape=new THREE.Shape();t.points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.12,bevelThickness:.15}),mat);
 mesh.rotation.x=-Math.PI/2;mesh.position.y=.25;mesh.userData.walkGround=true;terrain.add(mesh);
}
const sample=terrainSampler(terrain),scene=buildCity(sample);scene.group.updateWorldMatrix(true,true);
const solids=[];scene.group.traverse(o=>{if(o.userData.walkSolid)solids.push(o);});
assert(solids.length>0);
assert(scene.group.children.length<45,'Procedural scene draw batches remain bounded');
for(const surface of scene.surfaces){
 const hit=sample(surface.x,surface.z);assert(hit);assert(Math.abs(surface.y-hit.y-.025)<1e-5);
 assert(!plots.some(p=>city.overlaps(surface,{x:p.x,z:p.z,w:.67,d:.67})),'Paving never occupies parcels');
}
// Exercise the same swept rays as the walk controller along every generated route.
const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),direction=new THREE.Vector3();
for(const route of plan.routes)for(let i=1;i<route.length;i++){
 const [x,z]=route[i-1],[nx,nz]=route[i],dx=nx-x,dz=nz-z,len=Math.hypot(dx,dz),y=scene.surfaceAt(x,z)??sample(x,z).y;
 direction.set(dx/len,0,dz/len);
 for(const level of [.07,.32,.61])for(const side of [-1,0,1]){
  origin.set(x-dz/len*WALK.radius*side,y+level,z+dx/len*WALK.radius*side);ray.set(origin,direction);ray.far=len+WALK.radius;
  assert.equal(ray.intersectObjects(solids,false).length,0,'Road segment collides at '+[x,z,nx,nz]);
 }
}
for(const b of city.CITY_BUILDINGS){
 const y=sample(b.x,b.z).y;ray.set(new THREE.Vector3(b.x,y+.35,b.z+1),new THREE.Vector3(0,0,-1));ray.far=1;
 assert(ray.intersectObjects(solids,false).length>0,'Building exterior blocks avatar and camera');
}
const [sx,sz]=city.PLAZA_SPAWN,sy=scene.surfaceAt(sx,sz);assert(sy!==undefined);
const body=new THREE.Box3(new THREE.Vector3(sx-WALK.radius,sy+.01,sz-WALK.radius),new THREE.Vector3(sx+WALK.radius,sy+WALK.height,sz+WALK.radius));
const matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
for(const mesh of solids){mesh.geometry.computeBoundingBox();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);assert(!mesh.geometry.boundingBox.clone().applyMatrix4(matrix).intersectsBox(body),'Arrival is collision-free');}}
scene.dispose();terrain.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});mat.dispose();
console.log(`PASS: 6 architectural sites; ${plan.routes.length} connected routes; ${scene.surfaces.length} terrain-aligned pavement cells; parcel/tree preservation; swept collision clearance; exterior walls; safe plaza spawn; bounded draw batches.`);
