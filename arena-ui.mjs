import {MODEL_META,SLOTS} from "./placement.mjs";
import {escapeHtml as E} from "./core.mjs";
const FOCUS={compass:[490,158],paper:[510,170],gun:[308,128],printing:[530,205],seismo:[334,145],pyramid:[495,176],wall:[622,200]};
export function modelPicture(id,compact=false){
 const m=MODEL_META[id]||MODEL_META.bonus;
 if(!m?.image)return '<span class="model-thumb model-thumb-empty">★</span>';
 const [x,y]=FOCUS[id]||[500,150],scale=compact?260:390;
 return '<span class="model-thumb '+(compact?"compact":"large")+'"><img src="'+E(m.image)+'" loading="lazy" alt="'+E(m.name)+'" style="width:'+scale+'px;left:calc(50% - '+(x*scale/1000)+'px);top:calc(50% - '+(y*scale/1000)+'px)"></span>';
}
export function angleName(value){
 return ({0:"Đông →",45:"Đông Nam ↘",90:"Nam ↓",135:"Tây Nam ↙",180:"Tây ←",225:"Tây Bắc ↖",270:"Bắc ↑",315:"Đông Bắc ↗"})[value]||String(value)+"°";
}
export function renderArena(layout,image="https://d2ol7oe51mr4n9.cloudfront.net/user_3JNDYQ5PZuMnwdk0qFlQVt5Q5Hf/ed5dc29c-27c0-4906-8c95-36ab419c033d.jpg"){
 const assigned=new Map((layout?.tasks||[]).map(t=>[t.slot,t]));
 const obstacles=new Set(layout?.obstacles||[]);
 return '<div class="arena-board real-arena">'+
 '<img class="arena-background" src="'+E(image)+'" alt="Ảnh sa bàn Enjoy AI 2026 người dùng cung cấp có 10 vị trí mô hình">'+
 SLOTS.map(slot=>{
  const p=assigned.get(slot.id);
  if(!p&&!obstacles.has(slot.id))return '<span class="slot-marker empty-slot" style="left:'+slot.x+'%;top:'+slot.y+'%" title="Khung '+slot.id+'">'+slot.id+'</span>';
  if(!p)return '<span class="slot-marker obstacle" style="left:'+slot.x+'%;top:'+slot.y+'%" title="Vật cản '+slot.id+'">'+slot.id+' · Cản</span>';
  return '<button class="mission-marker" data-map-slot="'+E(slot.id)+'" type="button" style="left:'+slot.x+'%;top:'+slot.y+'%" title="'+E(MODEL_META[p.id]?.name||p.id)+' / ô '+slot.id+' / hướng '+p.angle+'°">'+
   modelPicture(p.id,true)+'<span class="marker-info"><strong>'+E(slot.id)+' · '+E(MODEL_META[p.id]?.name||p.id)+'</strong><span class="marker-arrow" style="transform:rotate('+p.angle+'deg)">➜</span><small>'+E(angleName(p.angle))+' · '+p.angle+'°</small></span></button>';
 }).join("")+'</div><div class="arena-legend"><span><i></i>Mô hình: chọn để xem</span><span><i class="orange"></i>Vật cản</span><span><i class="gray"></i>Khung trống</span></div>';
}
export function modelPopup(p){
 const meta=MODEL_META[p.id]||MODEL_META.bonus;
 return '<div class="modal-box" role="dialog" aria-modal="true"><h3>'+E(meta.name)+' — ô '+E(p.slot)+'</h3><div class="popup-model">'+modelPicture(p.id)+'</div>'+
 '<p><strong>Hướng tiếp cận:</strong> '+E(angleName(p.angle))+' · '+p.angle+'°.</p>'+
 '<p>'+E(meta.guide||"")+'</p><p class="muted">Mũi tên là hướng tiếp cận trên sa bàn. Mô hình thật cần kiểm tra hướng tay gạt, đầu nhận vật, khung cố định và độ rộng robot để xác nhận có thể thực hiện.</p>'+
 '<button class="btn" id="close-model-popup">Đóng</button></div>';
}
