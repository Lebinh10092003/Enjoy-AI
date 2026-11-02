// ENJOY AI 2026, Inventions Trail: physical-space clearance pre-check.
// Field dimensions: 216 x 120 cm (official rules). This tests an estimated
// robot envelope of 30 x 30 cm against conservative *estimated* model footprints.
// It is NOT a physical-world certification; models must be measured on the field.
export const FIELD_CM=Object.freeze({width:216,height:120});
export const MAX_ROBOT_CM=30;
export const SAFETY_MARGIN_CM=1;
// Conservative estimates; they are configuration inputs, not official model sizes.
export const FOOTPRINT_CM=Object.freeze({
 normal:Object.freeze({w:10,h:10}),wide:Object.freeze({w:14,h:12}),
 bonus:Object.freeze({w:10,h:10}),obstacle:Object.freeze({w:8,h:8})
});
export function pctCm(x,y){return {x:x*FIELD_CM.width/100,y:y*FIELD_CM.height/100};}
export function rectangleFromSlot(slot,footprint=FOOTPRINT_CM.obstacle){
 const p=pctCm(slot.x,slot.y);
 return {x:p.x,y:p.y,w:footprint.w,h:footprint.h,id:slot.id};
}
export function overlappingModels(rectangles,gapCm=1){
 for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
  const a=rectangles[i],b=rectangles[j];
  if(Math.abs(a.x-b.x)<(a.w+b.w)/2+gapCm &&
     Math.abs(a.y-b.y)<(a.h+b.h)/2+gapCm)return [a.id,b.id];
 }
 return null;
}
// Sample the free configuration space for the robot's 30cm axis-aligned
// footprint. A 1cm buffer handles minor mapping/printing inaccuracies.
const CELL_CM=3, NX=72,NY=40;
const GATE_POINTS=[
 {id:"upper",x:157,y:40},
 {id:"middle",x:156,y:60},
 {id:"lower",x:157,y:80}
];
export function checkNavigation(rectangles,{robotCm=MAX_ROBOT_CM,marginCm=SAFETY_MARGIN_CM}={}){
 if(!(robotCm>0&&robotCm<=MAX_ROBOT_CM)||!Number.isFinite(marginCm)||marginCm<0)
  throw Error("Cấu hình kích thước robot hoặc biên an toàn không hợp lệ.");
 if(!Array.isArray(rectangles)||rectangles.some(r=>![r.x,r.y,r.w,r.h].every(Number.isFinite)||
   r.w<=0||r.h<=0))throw Error("Kích thước/vị trí vật thể không hợp lệ.");
 const overlap=overlappingModels(rectangles);
 if(overlap)return {ok:false,reason:"overlap",items:overlap,reachedGates:[]};
 const half=robotCm/2+marginCm;
 const blocked=new Uint8Array(NX*NY);
 for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
  const px=(x+.5)*CELL_CM,py=(y+.5)*CELL_CM,idx=y*NX+x;
  if(px<half||px>FIELD_CM.width-half||py<half||py>FIELD_CM.height-half){
   blocked[idx]=1;continue;
  }
  for(const item of rectangles){
   if(Math.abs(px-item.x)<=item.w/2+half &&
      Math.abs(py-item.y)<=item.h/2+half){blocked[idx]=1;break;}
  }
 }
 // Start zone: robot may start at several feasible points of the 30x30cm
 // region at the lower-left, rather than forcing one potentially obstructed pixel.
 const seen=new Uint8Array(NX*NY), queue=new Int32Array(NX*NY),parent=new Int32Array(NX*NY).fill(-1);
 let head=0,tail=0;
 for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
  const px=(x+.5)*CELL_CM,py=(y+.5)*CELL_CM,id=y*NX+x;
  if(px>=17&&px<=42&&py>=76&&py<=103&&!blocked[id]){
   seen[id]=1;parent[id]=-2;queue[tail++]=id;
  }
 }
 if(!tail)return {ok:false,reason:"start-blocked",reachedGates:[]};
 // 4-neighbor BFS with a full robot-sized swept corridor.
 while(head<tail){
  const at=queue[head++],x=at%NX,y=Math.floor(at/NX);
  for(const next of [at-1,at+1,at-NX,at+NX]){
   if(next<0||next>=NX*NY||seen[next]||blocked[next])continue;
   const nx=next%NX,ny=Math.floor(next/NX);
   if(Math.abs(nx-x)+Math.abs(ny-y)!==1)continue;
   seen[next]=1;parent[next]=at;queue[tail++]=next;
  }
 }
 let pathIndex=-1;
 const reachedGates=GATE_POINTS.filter(point=>{
  for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
   const id=y*NX+x;
   if(!seen[id])continue;
   const px=(x+.5)*CELL_CM,py=(y+.5)*CELL_CM;
   if(Math.hypot(px-point.x,py-point.y)<=12){if(pathIndex<0)pathIndex=id;return true;}
  }
  return false;
 }).map(g=>g.id);
 const path=[];
 if(pathIndex>=0){
  const trace=[];let current=pathIndex;
  while(current>=0){trace.push(current);current=parent[current];}
  trace.reverse();
  for(let i=0;i<trace.length;i++){
   if(i%3!==0&&i!==trace.length-1)continue;
   const index=trace[i];
   path.push({x:Number((((index%NX+.5)*CELL_CM)/FIELD_CM.width*100).toFixed(2)),
    y:Number((((Math.floor(index/NX)+.5)*CELL_CM)/FIELD_CM.height*100).toFixed(2))});
  }
 }
 return {ok:reachedGates.length>0,reason:reachedGates.length?"pass":"right-side-line-isolated",
  reachedGates,robotCm,marginCm,visitedCells:tail,path};
}
