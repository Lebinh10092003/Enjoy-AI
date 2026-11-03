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
  const approach=numeric("approach",0,359.99);
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
   rotation:round(rotation,2),approach:round(approach,2),
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
