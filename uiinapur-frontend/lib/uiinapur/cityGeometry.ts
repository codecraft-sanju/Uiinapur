import * as THREE from 'three';
import { BENCHES, CITY_BUILDINGS, GARDENS, LAMPS, PLAZA, createCityPlan, publicLand, type Architecture, type Rect } from './city';

type Vec3 = [number,number,number];
type Shape = 'box'|'cylinder'|'cone'|'sphere'|'ring';
type Finish = 'stone'|'dark'|'gold'|'glass'|'leaf'|'wood'|'water'|'light'|'flower'|'road'|'cream'|'terra';
type Part = {shape:Shape;finish:Finish;position:Vec3;scale:Vec3;rotation:Vec3;ground?:boolean;solid?:boolean};
type Surface=Rect&{y:number};
export type TerrainSample={y:number;slope:number}|null;
export type CityScene={group:THREE.Group;surfaceAt:(x:number,z:number)=>number|undefined;dispose:()=>void;surfaces:Surface[]};

export function terrainSampler(root:THREE.Object3D) {
  root.updateWorldMatrix(true,true);
  const meshes:THREE.Mesh[]=[];
  root.traverse(o=>{if(o instanceof THREE.Mesh&&o.userData.walkGround)meshes.push(o);});
  const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0),normal=new THREE.Vector3();
  return (x:number,z:number):TerrainSample=>{
    ray.set(origin.set(x,30,z),down);ray.far=40;
    const hit=ray.intersectObjects(meshes,false)[0];if(!hit?.face)return null;
    normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
    return {y:hit.point.y,slope:normal.y};
  };
}

/** Pure scene construction; no external assets, fetching, or frame-by-frame geometry allocation. */
export function buildCity(sample:(x:number,z:number)=>TerrainSample):CityScene {
  const group=new THREE.Group();group.name='Uiinapur National Plaza';
  const parts:Part[]=[],surfaces:Surface[]=[],textures:THREE.Texture[]=[],extraMaterials:THREE.Material[]=[];
  const plan=createCityPlan();
  const roadKeys=new Set(plan.roads.map(([x,z])=>Math.round(x*10)+','+Math.round(z*10)));
  const add=(shape:Shape,finish:Finish,position:Vec3,scale:Vec3,rotation:Vec3=[0,0,0],solid=false)=>parts.push({shape,finish,position,scale,rotation,solid});
  const box=(finish:Finish,p:Vec3,s:Vec3,solid=false)=>add('box',finish,p,s,[0,0,0],solid);
  function ground(rect:Rect) {
    const levels:number[]=[];
    for(const [dx,dz] of [[0,0],[-.5,-.5],[-.5,.5],[.5,-.5],[.5,.5]]){
      const hit=sample(rect.x+dx*rect.w,rect.z+dz*rect.d);
      if(!hit||hit.slope<.65)throw new Error('City site has no walkable terrain support');levels.push(hit.y);
    }
    if(Math.max(...levels)-Math.min(...levels)>.025)throw new Error('City site needs a terrain transition');
    return Math.max(...levels);
  }
  function paving(rect:Rect,finish:Finish) {
    const y=ground(rect);
    box(finish,[rect.x,y+.012,rect.z],[rect.w,.026,rect.d]);
    surfaces.push({...rect,y:y+.025});return y+.025;
  }
  // Small joined tiles produce flush intersections, with a stone pedestrian margin around each shared street.
  const seen=new Set<string>();
  for(const [x,z] of plan.roads){
    for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
      const tx=Math.round((x+ix*.1)*10)/10,tz=Math.round((z+iz*.1)*10)/10,key=tx+','+tz;
      if(seen.has(key)||!publicLand(tx,tz,.052)||(Math.abs(tx-PLAZA.x)<PLAZA.w/2&&Math.abs(tz-PLAZA.z)<PLAZA.d/2))continue;seen.add(key);
      paving({x:tx,z:tz,w:.101,d:.101},'stone');
    }
  }
  for(const [x,z] of plan.roads){
    if(Math.abs(x-PLAZA.x)<PLAZA.w/2&&Math.abs(z-PLAZA.z)<PLAZA.d/2)continue;
    const y=ground({x,z,w:.11,d:.11});box('road',[x,y+.026,z],[.105,.002,.105]);
    // Gold studs are pedestrian-priority road markings; no raised curb blocks the avatar.
    if(Math.round(x*10)%4===0&&Math.round(z*10)%4===0)box('gold',[x,y+.028,z],[.035,.002,.015]);
    const degree=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dz])=>roadKeys.has((Math.round(x*10)+dx)+','+(Math.round(z*10)+dz))).length;
    if(degree>=3)for(const offset of [-.03,0,.03])box('cream',[x,y+.029,z+offset],[.095,.002,.012]);
  }
  // Checker stone plaza, clipped against existing parcel reservations and old trees.
  for(let ix=-11;ix<=11;ix++)for(let iz=-6;iz<=6;iz++){
    const x=PLAZA.x+ix*.1,z=PLAZA.z+iz*.1;
    if(publicLand(x,z,.052))paving({x,z,w:.1,d:.1},(ix+iz)%4===0?'cream':'stone');
  }
  const base=ground(PLAZA)+.026;
  // Tiered reflecting fountain: a sealed basin with an illuminated national star.
  add('cylinder','dark',[-5,base+.04,0],[.58,.08,.58]);
  add('cylinder','water',[-5,base+.085,0],[.49,.01,.49]);
  add('ring','gold',[-5,base+.09,0],[.27,.27,.27],[Math.PI/2,0,0]);
  add('cylinder','cream',[-5,base+.23,0],[.085,.3,.085]);
  add('cone','gold',[-5,base+.48,0],[.15,.25,.15]);
  add('sphere','light',[-5,base+.61,0],[.06,.06,.06]);
  box('dark',[-5,base+.32,0],[.58,.64,.58],true);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;add('cylinder','water',[-5+Math.sin(a)*.16,base+.17,Math.cos(a)*.16],[.008,.17,.008]);
  }
  for(const b of BENCHES){
    const y=ground(b)+.026;
    for(let i=0;i<4;i++)box('wood',[b.x,y+.18,b.z-.055+i*.035],[b.w,.028,.026]);
    for(let i=0;i<3;i++)box('wood',[b.x,y+.26+i*.035,b.z-.07],[b.w,.025,.025]);
    for(const x of [-.16,.16])box('dark',[b.x+x,y+.08,b.z],[.025,.16,.13]);
    box('dark',[b.x,y+.19,b.z],[b.w,.38,b.d],true);
  }
  for(const g of GARDENS){
    const y=ground(g)+.026;
    box('cream',[g.x,y+.04,g.z],[g.w,.08,g.d]);box('leaf',[g.x,y+.085,g.z],[g.w-.025,.015,g.d-.025]);
    add('cylinder','wood',[g.x,y+.29,g.z],[.035,.5,.035]);
    for(const [dx,dy,dz] of [[0,.58,0],[-.035,.68,.025],[.035,.7,-.02]])add('sphere','leaf',[g.x+dx,y+dy,g.z+dz],[.15,.23,.15]);
    for(let i=0;i<12;i++){
      const a=i*2.4,r=.06+(i%2)*.018;
      add('sphere',i%3?'flower':'gold',[g.x+Math.cos(a)*r,y+.12,g.z+Math.sin(a)*r],[.025,.035,.025]);
    }
    box('dark',[g.x,y+.4,g.z],[g.w,.8,g.d],true);
  }
  for(const [x,z] of LAMPS){
    const y=ground({x,z,w:.12,d:.12})+.026;
    add('cylinder','dark',[x,y+.46,z],[.025,.92,.025]);
    add('cylinder','gold',[x,y+.05,z],[.08,.1,.08]);
    box('gold',[x,y+.94,z],[.12,.025,.12]);box('light',[x,y+.89,z],[.07,.07,.07]);
    box('dark',[x,y+.5,z],[.12,1,.12],true);
  }
  function sign(text:string,p:Vec3,w:number,h:number,rotation=0) {
    // Canvas is only touched after the R3F scene mounts; SSR never accesses document.
    if(typeof document==='undefined')return;
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.fillStyle='#102b2e';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#d9bf86';ctx.lineWidth=5;ctx.strokeRect(12,12,1000,232);
    ctx.fillStyle='#eee5cb';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 52px sans-serif';ctx.fillText(text.toUpperCase(),512,128,940);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.7,emissive:'#ffffff',emissiveMap:texture,emissiveIntensity:.2});extraMaterials.push(mat);
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);mesh.position.set(...p);mesh.rotation.y=rotation;group.add(mesh);
  }
  // Six distinct silhouettes share materials and draw batches, while all detail stays in the reserved envelope.
  function architecture(b:Architecture) {
    const y=ground({x:b.x,z:b.z,w:b.w+.08,d:b.d+.08})+.026,start=parts.length;
    const w=b.w,d=b.d,h=b.h;
    const local=(f:Finish,x:number,yy:number,z:number,sx:number,sy:number,sz:number)=>box(f,[x,yy,z],[sx,sy,sz]);
    const body:Finish=b.kind==='cafe'?'terra':b.kind==='studio'?'dark':'cream';
    local('stone',0,.025,0,w+.06,.05,d+.06);
    local(body,0,h/2,0,w,h,d);
    local('dark',0,h+.025,0,w+.07,.05,d+.07);
    // Front entrance and sidelights. The door remains a solid exterior, as requested.
    local('gold',0,.29,d/2+.008,.23,.57,.012);local('glass',0,.29,d/2+.016,.19,.53,.014);
    local('gold',.064,.27,d/2+.028,.012,.09,.012);
    for(const side of [-1,1]){
      local('dark',side*w*.34,.36,d/2+.009,.13,.3,.015);
      local('glass',side*w*.34,.36,d/2+.02,.1,.27,.012);
      for(const z of [-.16,.16])local('glass',side*(w/2+.009),.38,z,.014,.26,.16);
    }
    if(b.kind==='residence'){
      for(const x of [-.19,0,.19]){local('glass',x,.88,d/2+.012,.13,.27,.014);local('gold',x,.75,d/2+.022,.14,.018,.02);}
      local('stone',0,.69,d/2,.63,.045,.07);
      for(const x of [-.25,-.125,0,.125,.25])local('dark',x,.75,d/2+.03,.012,.16,.012);
      local('gold',0,.83,d/2+.03,.58,.012,.012);
    } else if(b.kind==='villa'){
      add('cone','terra',[0,h+.14,0],[w+.065,.26,d+.065],[0,Math.PI/4,0]);
      for(const x of [-.25,.25])local('cream',x,.32,d/2+.015,.035,.6,.035);
      local('wood',0,.65,d/2+.015,.56,.04,.04);
    } else if(b.kind==='cafe'||b.kind==='market'){
      const n=b.kind==='market'?6:8;
      for(let i=0;i<n;i++)local(i%2?'cream':b.kind==='market'?'leaf':'terra',-w/2+(i+.5)*w/n,.61,d/2+.012,w/n,.04,.055);
      for(const x of [-.24,.24])local('gold',x,.3,d/2+.025,.014,.58,.014);
      if(b.kind==='market')for(let i=0;i<6;i++)local(i%2?'gold':'flower',-.24+i*.095,.12,d/2+.018,.065,.065,.025);
    } else if(b.kind==='welcome'){
      for(const x of [-.24,-.12,.12,.24])local('gold',x,h*.55,d/2+.017,.018,h*.9,.025);
      local('glass',0,.85,d/2+.01,.5,.22,.016);
      add('cylinder','gold',[0,h+.15,0],[.012,.24,.012]);
      local('leaf',.07,h+.22,0,.13,.075,.014);
    } else {
      // Stepped studio clerestory and skylight fins.
      local('glass',0,.86,d/2+.012,.48,.3,.014);
      local('gold',-.24,.9,d/2+.025,.025,.38,.025);
      for(let i=0;i<5;i++)local('gold',-.22+i*.11,h+.065,0,.022,.07,.49);
    }
    // Simple closed collider covers the exterior including awnings, not its approach path.
    const colliderHeight=h+(b.kind==='villa'?.28:b.kind==='welcome'?.27:.1);
    box('dark',[0,colliderHeight/2,0],[w+.08,colliderHeight,d+.08],true);
    for(let i=start;i<parts.length;i++){
      const p=parts[i],x=p.position[0],z=p.position[2];
      p.position=[b.x+x*Math.cos(b.rotation)+z*Math.sin(b.rotation),y+p.position[1],b.z-x*Math.sin(b.rotation)+z*Math.cos(b.rotation)];p.rotation[1]+=b.rotation;
    }
    sign(b.name,[b.x,y+.68,b.z+d/2+.039],w*.94,.105,b.rotation);
  }
  CITY_BUILDINGS.forEach(architecture);
  box('dark',[-5,base+.23,.065],[.54,.14,.02]);
  sign('UIINAPUR CENTRAL PLAZA',[-5,base+.23,.076],.52,.12);
  // Two unshadowed accent lights; existing world sun and shadow map remain unchanged.
  for(const [x,z] of [[-5,0],[-3.5,-.5]]){const light=new THREE.PointLight('#ffe3a3',.6,3,2);light.position.set(x,base+1.2,z);group.add(light);}

  const geometry:Record<Shape,THREE.BufferGeometry>={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(.5,.5,1,12),cone:new THREE.ConeGeometry(.5,1,4),sphere:new THREE.IcosahedronGeometry(.5,1),ring:new THREE.TorusGeometry(1,.05,5,32)};
  const colors:Record<Finish,string>={stone:'#8d9e96',dark:'#183333',gold:'#d6bd87',glass:'#376b70',leaf:'#326f57',wood:'#8c6546',water:'#57b9b0',light:'#ffdf9b',flower:'#d891ac',road:'#314747',cream:'#ded5bd',terra:'#b56e55'};
  const materials=Object.fromEntries(Object.entries(colors).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='glass'||key==='water'?.25:.78,metalness:key==='gold'?.65:key==='glass'?.4:.05,emissive:key==='light'?color:key==='water'?'#17483f':'#000000',emissiveIntensity:key==='light'?1.4:.2})])) as Record<Finish,THREE.MeshStandardMaterial>;
  const collisionMaterial=new THREE.MeshBasicMaterial({visible:false});
  const batches=new Map<string,Part[]>();
  for(const part of parts){const key=part.solid?'collider':part.shape+':'+part.finish;const batch=batches.get(key)||[];batch.push(part);batches.set(key,batch);}
  const matrix=new THREE.Object3D();
  for(const [key,batch] of batches){
    const first=batch[0],solid=key==='collider';
    const mesh=new THREE.InstancedMesh(geometry[first.shape],solid?collisionMaterial:materials[first.finish],batch.length);
    mesh.name=key;mesh.castShadow=!solid&&first.finish!=='road';mesh.receiveShadow=!solid;mesh.userData.walkSolid=solid;
    batch.forEach((part,i)=>{matrix.position.set(...part.position);matrix.rotation.set(...part.rotation);matrix.scale.set(...part.scale);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
  }
  // Exact lookup of generated pavement tops, avoiding hundreds of instanced ray tests per movement substep.
  const cells=new Map<string,Surface[]>(),cell=.2;
  for(const s of surfaces)for(let x=Math.floor((s.x-s.w/2)/cell);x<=Math.floor((s.x+s.w/2)/cell);x++)for(let z=Math.floor((s.z-s.d/2)/cell);z<=Math.floor((s.z+s.d/2)/cell);z++){
    const key=x+','+z,items=cells.get(key)||[];items.push(s);cells.set(key,items);
  }
  return {group,surfaces,surfaceAt(x,z){let top:number|undefined;for(const s of cells.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[])if(Math.abs(x-s.x)<=s.w/2+1e-7&&Math.abs(z-s.z)<=s.d/2+1e-7)top=Math.max(top??-Infinity,s.y);return top;},dispose(){
    const geometries=new Set<THREE.BufferGeometry>(Object.values(geometry));group.traverse(o=>{if(o instanceof THREE.Mesh)geometries.add(o.geometry);if(o instanceof THREE.InstancedMesh)o.dispose();});
    geometries.forEach(g=>g.dispose());Object.values(materials).forEach(m=>m.dispose());collisionMaterial.dispose();extraMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  }};
}
