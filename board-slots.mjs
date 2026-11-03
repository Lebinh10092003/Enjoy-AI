// Board-slot configuration is independent of the RNG and the DOM.
// Coordinates are in percent of the full 216 x 120 cm field;
// slot width and height are editable physical centimetres.
import {FIELD_CM} from "./route-safety.mjs";
export const MAX_USER_SLOTS=100;
export const CUSTOM_SLOT_MODELS=["compass","paper","gun","printing","seismo","pyramid","bonus"];
const MODEL_SET=new Set(CUSTOM_SLOT_MODELS);
export const SLOT_TYPES=["task","obstacle","both"];
const round=(v,d=2)=>Number(Number(v).toFixed(d));
export function rotatedBounds(widthCm,heightCm,rotation=0){
 const r=Number(rotation)*Math.PI/180;
 return {w:Math.abs(Math.cos(r))*widthCm+Math.abs(Math.sin(r))*heightCm,
  h:Math.abs(Math.sin(r))*widthCm+Math.abs(Math.cos(r))*heightCm};
}
export function normalizeUserSlots(input=[]){
 if(!Array.isArray(input)||input.length>MAX_USER_SLOTS)
  throw Error("Danh sách ô tự vẽ phải là mảng tối đa "+MAX_USER_SLOTS+" ô.");
 const seen=new Set();
 return input.map((item,index)=>{
  if(!item||typeof item!=="object")throw Error("Ô thứ "+(index+1)+" không hợp lệ.");
  const id=String(item.id||"");
  if(!/^U[0-9]{3,}$/.test(id)||seen.has(id))throw Error("Mã ô tự vẽ trùng hoặc không hợp lệ: "+id);
  seen.add(id);
  const type=String(item.type||"task");
  if(!SLOT_TYPES.includes(type))throw Error("Loại ô "+id+" không hợp lệ.");
  const numeric=(key,min,max)=>{
   const value=Number(item[key]);
   if(!Number.isFinite(value)||value<min||value>max)
    throw Error("Ô "+id+": "+key+" phải thuộc "+min+"–"+max+".");
   return value;
  };
  const x=numeric("x",0,100),y=numeric("y",0,100);
  const widthCm=numeric("widthCm",2,FIELD_CM.width),heightCm=numeric("heightCm",2,FIELD_CM.height);
  const rotation=numeric("rotation",0,359.99);
  const footprint=rotatedBounds(widthCm,heightCm,rotation);
  const px=x*FIELD_CM.width/100,py=y*FIELD_CM.height/100;
  if(px-footprint.w/2<0||px+footprint.w/2>FIELD_CM.width||
     py-footprint.h/2<0||py+footprint.h/2>FIELD_CM.height)
   throw Error("Ô "+id+" vượt khỏi biên sa bàn khi xoay. Hãy chỉnh vị trí, kích thước hoặc góc xoay.");
  const label=String(item.label||id).trim().slice(0,70);
  let models=Array.isArray(item.allowedModels)?item.allowedModels:[...CUSTOM_SLOT_MODELS];
  if(models.some(v=>!MODEL_SET.has(v)))throw Error("Ô "+id+" có mô hình không hợp lệ.");
  models=[...new Set(models)];
  if((type==="task"||type==="both")&&!models.length)
   throw Error("Ô nhiệm vụ "+id+" phải cho phép ít nhất một mô hình.");
  return {id,label,x:round(x,3),y:round(y,3),
   widthCm:round(widthCm),heightCm:round(heightCm),
   rotation:round(rotation,2),
   type,allowedModels:models};
 });
}
export function nextUserSlotId(items=[]){
 const used=new Set(items.map(i=>i.id));
 for(let n=1;n<=99999;n++){
  const id="U"+String(n).padStart(3,"0");
  if(!used.has(id))return id;
 }
 throw Error("Không còn mã ô trống.");
}
export function slotConfigKey(items=[]){
 return JSON.stringify(normalizeUserSlots(items).slice().sort((a,b)=>a.id.localeCompare(b.id)));
}
export function userTaskSlots(items=[]){
 return normalizeUserSlots(items).filter(i=>i.type!=="obstacle").map(i=>({
  ...i,edge:"custom",path:"custom"}));
}
export function userObstacleSlots(items=[]){
 return normalizeUserSlots(items).filter(i=>i.type!=="task").map(i=>({
  ...i,w:i.widthCm/FIELD_CM.width*100,h:i.heightCm/FIELD_CM.height*100
 }));
}
export function slotHasModel(slot,id){
 return slot.edge!=="custom"||slot.allowedModels?.includes(id)===true;
}


/**
 * True physical intersection of two drawn, arbitrarily rotated rectangles.
 * Touching an edge is allowed; a positive-area cross (+) is an intersection.
 * SAT avoids falsely grouping slots whose axis-aligned bounding boxes merely
 * overlap because of a rotation.
 */
export function userSlotsIntersect(a,b){
 const center=slot=>({x:slot.x*FIELD_CM.width/100,y:slot.y*FIELD_CM.height/100});
 const ca=center(a),cb=center(b);
 const radiansA=a.rotation*Math.PI/180,radiansB=b.rotation*Math.PI/180;
 const basis=r=>[[Math.cos(r),Math.sin(r)],[-Math.sin(r),Math.cos(r)]];
 const axesA=basis(radiansA),axesB=basis(radiansB);
 for(const axis of [...axesA,...axesB]){
  const dot=(x,y)=>x[0]*y[0]+x[1]*y[1];
  const distance=Math.abs((cb.x-ca.x)*axis[0]+(cb.y-ca.y)*axis[1]);
  const reachA=(Math.abs(dot(axesA[0],axis))*a.widthCm+
   Math.abs(dot(axesA[1],axis))*a.heightCm)/2;
  const reachB=(Math.abs(dot(axesB[0],axis))*b.widthCm+
   Math.abs(dot(axesB[1],axis))*b.heightCm)/2;
  if(distance>=reachA+reachB-1e-7)return false;
 }
 return true;
}

/** User-defined overlapping slots remain editable; never use both together. */
export function overlappingUserSlotPairs(input=[]){
 const slots=normalizeUserSlots(input),pairs=[];
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
  if(userSlotsIntersect(slots[i],slots[j]))pairs.push([slots[i].id,slots[j].id]);
 }
 return pairs;
}

/** Slider limits in percentage: the full rotated rectangle remains on the mat. */
export function slotTranslationBounds(slot){
 const {w,h}=rotatedBounds(Number(slot.widthCm),Number(slot.heightCm),Number(slot.rotation));
 if(!Number.isFinite(w)||!Number.isFinite(h)||w>FIELD_CM.width||h>FIELD_CM.height||w<=0||h<=0)
  throw Error("Kích thước hoặc góc xoay không cho phép đặt ô trong sa bàn.");
 const axis=(extent,total)=>{
  const low=extent/(2*total)*100;
  return {min:Number((Math.ceil((low-1e-8)*1000)/1000).toFixed(3)),
   max:Number((Math.floor((100-low+1e-8)*1000)/1000).toFixed(3))};
 };
 return {x:axis(w,FIELD_CM.width),y:axis(h,FIELD_CM.height)};
}

/**
 * 2D transform gizmo geometry in centimetres, like local axes in a 3D editor.
 * mode: free (any direction), x/y (constrained to rotated local axes),
 * rotate (circular motion about rectangle centre).
 */
export function transformUserSlot(slot,mode,start,current){
 if(!["free","x","y","rotate"].includes(mode))throw Error("Chế độ tịnh tiến/xoay không hợp lệ.");
 const result={...slot},x0=start.x,y0=start.y,x1=current.x,y1=current.y;
 if(![x0,y0,x1,y1].every(Number.isFinite))throw Error("Tọa độ trỏ chuột không hợp lệ.");
 const rad=slot.rotation*Math.PI/180,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 if(mode==="rotate"){
  const a=Math.atan2((y0-slot.y)*FIELD_CM.height,(x0-slot.x)*FIELD_CM.width);
  const b=Math.atan2((y1-slot.y)*FIELD_CM.height,(x1-slot.x)*FIELD_CM.width);
  const change=Math.atan2(Math.sin(b-a),Math.cos(b-a))*180/Math.PI;
  result.rotation=round(((slot.rotation+change)%360+360)%360,2)%360;
 }else{
  const dx=(x1-x0)*FIELD_CM.width/100,dy=(y1-y0)*FIELD_CM.height/100;
  const limits=slotTranslationBounds(slot);
  if(mode==="free"){
   result.x=clamp(slot.x+dx/FIELD_CM.width*100,limits.x.min,limits.x.max);
   result.y=clamp(slot.y+dy/FIELD_CM.height*100,limits.y.min,limits.y.max);
  }else{
   const axis=mode==="x"?[Math.cos(rad),Math.sin(rad)]:[-Math.sin(rad),Math.cos(rad)];
   const projected=dx*axis[0]+dy*axis[1];
   const coefficients={x:axis[0]/FIELD_CM.width*100,y:axis[1]/FIELD_CM.height*100};
   let lo=-Infinity,hi=Infinity;
   for(const key of ["x","y"]){
    const factor=coefficients[key];
    if(Math.abs(factor)<1e-12)continue;
    const a=(limits[key].min-slot[key])/factor,b=(limits[key].max-slot[key])/factor;
    lo=Math.max(lo,Math.min(a,b));
    hi=Math.min(hi,Math.max(a,b));
   }
   const distance=clamp(projected,lo,hi);
   result.x=slot.x+distance*coefficients.x;
   result.y=slot.y+distance*coefficients.y;
  }
 }
 // Round consistently with stored slot geometry and reject invalid rotation.
 return normalizeUserSlots([result])[0];
}
