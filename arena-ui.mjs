import {FIELD_CM} from "./route-safety.mjs";
import {normalizeUserSlots,userTaskSlots,userObstacleSlots} from "./board-slots.mjs?v=20261103-cross-v5";
import {MODEL_META,SLOTS,OBSTACLE_SLOTS} from "./placement.mjs?v=20261103-cross-v5";
import {escapeHtml as E} from "./core.mjs?v=20261103-cross-v5";
const FOCUS={compass:[490,158],paper:[510,170],gun:[308,128],printing:[530,205],seismo:[334,145],pyramid:[495,176],wall:[622,200]};
export function modelPicture(id,compact=false,reversed=false){
 const m=MODEL_META[id]||MODEL_META.bonus;
 if(!m?.image)return '<span class="model-thumb model-thumb-empty">★</span>';
 const [x,y]=FOCUS[id]||[500,150],scale=compact?260:390;
 return '<span class="model-thumb '+(compact?"compact":"large")+(id==="wall"&&reversed?" wall-reversed":"")+'"><img src="'+E(m.image)+'" loading="lazy" alt="'+E(m.name)+'" style="width:'+scale+'px;left:calc(50% - '+(x*scale/1000)+'px);top:calc(50% - '+(y*scale/1000)+'px)"></span>';
}
export function angleName(value){
 return ({0:"Đông →",45:"Đông Nam ↘",90:"Nam ↓",135:"Tây Nam ↙",180:"Tây ←",225:"Tây Bắc ↖",270:"Bắc ↑",315:"Đông Bắc ↗"})[value]||String(value)+"°";
}
export function renderArena(layout,image="https://d2ol7oe51mr4n9.cloudfront.net/user_3JNDYQ5PZuMnwdk0qFlQVt5Q5Hf/ed5dc29c-27c0-4906-8c95-36ab419c033d.jpg"){
 const assigned=new Map((layout?.tasks||[]).map(t=>[t.slot,t]));
 const obstacleIds=new Set(layout?.obstacles||[]);
 // Snapshot per proposal: editing a user slot later never shifts old layouts.
 const userSlots=normalizeUserSlots(layout?.slotDefinitions||[]);
 const customTask=userTaskSlots(userSlots),customObstacle=userObstacleSlots(userSlots);
 const tasks=[...SLOTS.filter(s=>layout?.generatorVersion!==4||s.edge!=="white"),...customTask];
 const obstacles=[...OBSTACLE_SLOTS.filter(s=>layout?.generatorVersion!==4||!s.id.startsWith("W")),...customObstacle];
 const zone=(slot,isObstacle=false)=>{
  const width=slot.widthCm/FIELD_CM.width*100,height=slot.heightCm/FIELD_CM.height*100;
  const rotation=Number(slot.rotation||0);
  return '<span class="user-placement-zone '+(isObstacle?"zone-obstacle":"zone-task")+
   '" style="left:'+slot.x+'%;top:'+slot.y+'%;width:'+width+'%;height:'+height+
   '%;transform:translate(-50%,-50%) rotate('+rotation+'deg)" title="Vùng tự vẽ '+E(slot.label)+' · '+slot.widthCm+' × '+slot.heightCm+' cm · xoay '+rotation+'°"></span>';
 };
 return '<div class="arena-board real-arena">'+
 '<img class="arena-background" src="'+E(image)+'" alt="Ảnh sa bàn Enjoy AI 2026">'+
 customTask.filter(slot=>assigned.has(slot.id)).map(slot=>zone(slot)).join("")+
 tasks.map(slot=>{
  const p=assigned.get(slot.id);
  if(!p&&slot.edge==="white")return "";
  if(!p&&slot.edge==="custom")return "";
  if(!p)return '<span class="slot-marker empty-slot" style="left:'+slot.x+'%;top:'+slot.y+'%" title="Khung nhiệm vụ '+E(slot.id)+'">'+E(slot.id)+'</span>';
  return '<button class="mission-marker" data-map-slot="'+E(slot.id)+'" type="button" style="left:'+slot.x+'%;top:'+slot.y+'%" title="'+E(MODEL_META[p.id]?.name||p.id)+' / ô '+E(slot.id)+'">'+
   modelPicture(p.id,true,Boolean(p.reversed))+'<span class="marker-info"><strong>'+E(slot.id)+' · '+E(MODEL_META[p.id]?.name||p.id)+(p.id==="wall"&&p.reversed?'<span class="wall-reverse-mark"> ↻ Đảo</span>':"")+'</strong></span></button>';
 }).join("")+
 obstacles.filter(slot=>obstacleIds.has(slot.id)).map(slot=>
  '<span class="obstacle-rect" style="left:'+slot.x+'%;top:'+slot.y+'%;width:'+slot.w+'%;height:'+slot.h+
  '%;transform:translate(-50%,-50%) rotate('+(slot.rotation||0)+'deg)" title="Vật cản '+E(slot.id)+'" aria-label="Vật cản '+E(slot.id)+'"><span class="obstacle-label">'+E(slot.id)+'</span></span>'
 ).join("")+
 '</div><div class="arena-legend"><span><i></i>Mô hình nhiệm vụ</span><span><i class="orange"></i>Vật cản</span><span><i class="gray"></i>Khung gốc còn trống</span><span>Ô tự vẽ: kích thước và góc theo cấu hình của bạn</span></div>';
}
export function modelPopup(p){
 const meta=MODEL_META[p.id]||MODEL_META.bonus;
 return '<div class="modal-box" role="dialog" aria-modal="true"><h3>'+E(meta.name)+' — ô '+E(p.slot)+'</h3><div class="popup-model">'+modelPicture(p.id,false,Boolean(p.reversed))+'</div>'+
 (p.id==="wall"?'<p><strong>Hướng lắp Tường Thành:</strong> '+(p.reversed?"Đảo mô hình 180°":"Giữ nguyên")+'.</p>':"")+
 '<p>'+E(meta.guide||"")+'</p><p class="muted">Hướng robot tiếp cận do người dùng tự quyết định; hãy kiểm tra cách bố trí và khoảng trống trên sa bàn thực tế.</p>'+
 '<button class="btn" id="close-model-popup">Đóng</button></div>';
}
