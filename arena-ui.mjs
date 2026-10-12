import {MODEL_META,SLOTS,OBSTACLE_SLOTS} from "./placement.mjs?v=20261012-wall-modes-v1";
import {escapeHtml as E} from "./core.mjs?v=20261012-wall-modes-v1";
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
 const obstacles=new Set(layout?.obstacles||[]);
 return '<div class="arena-board real-arena">'+
 '<img class="arena-background" src="'+E(image)+'" alt="Ảnh sa bàn Enjoy AI 2026 người dùng cung cấp có 10 vị trí mô hình">'+
 SLOTS.map(slot=>{
  const p=assigned.get(slot.id);
  if(!p)return '<span class="slot-marker empty-slot" style="left:'+slot.x+'%;top:'+slot.y+'%" title="Khung nhiệm vụ '+slot.id+'">'+slot.id+'</span>';
  return '<button class="mission-marker" data-map-slot="'+E(slot.id)+'" type="button" style="left:'+slot.x+'%;top:'+slot.y+'%" title="'+E(MODEL_META[p.id]?.name||p.id)+' / ô '+slot.id+' / hướng '+p.angle+'°">'+
   modelPicture(p.id,true,Boolean(p.reversed))+'<span class="marker-info"><strong>'+E(slot.id)+' · '+E(MODEL_META[p.id]?.name||p.id)+(p.id==="wall"&&p.reversed?'<span class="wall-reverse-mark"> ↻ Đảo</span>':"")+'</strong><span class="marker-arrow" style="transform:rotate('+p.angle+'deg)">➜</span><small>'+E(angleName(p.angle))+' · '+p.angle+'°</small></span></button>';
 }).join("")+
 OBSTACLE_SLOTS.filter(slot=>obstacles.has(slot.id)).map(slot=>
  '<span class="obstacle-rect" style="left:'+slot.x+'%;top:'+slot.y+'%;width:'+slot.w+'%;height:'+slot.h+'%" title="Vật cản '+slot.id+'" aria-label="Vật cản '+slot.id+'"><span class="obstacle-label">'+slot.id+'</span></span>'
 ).join("")+
 '</div><div class="arena-legend"><span><i></i>Mô hình: chọn để xem</span><span><i class="orange"></i>Vật cản (3 ô chữ nhật nhỏ)</span><span><i class="gray"></i>Khung nhiệm vụ trống</span></div>';
}
export function modelPopup(p){
 const meta=MODEL_META[p.id]||MODEL_META.bonus;
 return '<div class="modal-box" role="dialog" aria-modal="true"><h3>'+E(meta.name)+' — ô '+E(p.slot)+'</h3><div class="popup-model">'+modelPicture(p.id,false,Boolean(p.reversed))+'</div>'+
 '<p><strong>Hướng tiếp cận:</strong> '+E(angleName(p.angle))+' · '+p.angle+'°.</p>'+(p.id==="wall"?'<p><strong>Hướng lắp Tường Thành:</strong> '+(p.reversed?"Đảo mô hình 180°":"Giữ nguyên")+'.</p>':"")+
 '<p>'+E(meta.guide||"")+'</p><p class="muted">Mũi tên là hướng tiếp cận trên sa bàn. Mô hình thật cần kiểm tra hướng tay gạt, đầu nhận vật, khung cố định và độ rộng robot để xác nhận có thể thực hiện.</p>'+
 '<button class="btn" id="close-model-popup">Đóng</button></div>';
}
