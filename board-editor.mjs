import {FIELD_CM} from "./route-safety.mjs";
import {CUSTOM_SLOT_MODELS,normalizeUserSlots,nextUserSlotId,SLOT_TYPES} from "./board-slots.mjs";
const MAP_FALLBACK="https://d2ol7oe51mr4n9.cloudfront.net/user_3JNDYQ5PZuMnwdk0qFlQVt5Q5Hf/ed5dc29c-27c0-4906-8c95-36ab419c033d.jpg";
const MODEL_LABELS={compass:"La bàn",paper:"Làm giấy",gun:"Thuốc súng",printing:"In chữ rời",seismo:"Địa chấn",pyramid:"Kim tự tháp",bonus:"Bonus"};
const escape=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=(n,d=1)=>Number(Number(n).toFixed(d));
const kindLabel={task:"Nhiệm vụ",obstacle:"Vật cản",both:"Cả hai"};
const input=(id,title,value,min,max,step)=>'<label class="board-editor-field">'+escape(title)+
 '<input id="'+id+'" type="number" required min="'+min+'" max="'+max+'" step="'+step+'" value="'+escape(value)+'"></label>';
export function renderBoardEditor(slots=[],image=MAP_FALLBACK){
 return '<section id="slot-editor" class="panel board-editor-panel" aria-label="Trình chỉnh sửa vị trí sa bàn">'+
 '<h3>Vẽ và cấu hình ô đặt trên sa bàn</h3>'+
 '<p class="muted">Kéo trên ảnh để vẽ hình chữ nhật; kéo ô đã tạo để di chuyển trực tiếp. Chọn ô để thay đổi kích thước (cm), góc xoay và hướng robot tiếp cận, xem trước rồi bấm Lưu ô. Ô màu xanh dành cho nhiệm vụ; màu cam dành cho vật cản; màu tím dùng chung. Không vẽ trực tiếp lên ảnh gốc.</p>'+
 '<p class="panel-note">Sa bàn '+FIELD_CM.width+' × '+FIELD_CM.height+' cm. Khi có ô tự vẽ, Random thay các ô trắng W01–W17 ước lượng bằng ô của bạn; vẫn giữ các vị trí nền A–J và O1–O9. Chỉ những đề tạo mới dùng cấu hình mới. Mỗi đề đã lưu giữ bản chụp vị trí của nó.</p>'+
 '<div class="board-editor-layout"><div class="board-editor-map-wrap">'+
 '<div class="board-editor-canvas" id="slot-editor-canvas" data-slot-canvas>'+
 '<img class="board-editor-image" src="'+escape(image)+'" alt="Sa bàn dùng để vẽ ô nhiệm vụ và vật cản" draggable="false">'+
 '<div id="slot-editor-overlays"></div><div id="slot-editor-draft" class="board-editor-draft" hidden></div></div>'+
 '<div class="board-editor-hint">Giữ chuột hoặc chạm rồi kéo vùng trống để vẽ; kéo ô hiện có để di chuyển. Bảng bên phải cho phép nhập và xem trước kích thước, hướng xoay.</div>'+
 '</div><div class="board-editor-aside">'+
 '<label class="board-editor-field" for="slot-draw-type">Loại ô khi vẽ<select id="slot-draw-type"><option value="task">Nhiệm vụ</option><option value="obstacle">Vật cản</option><option value="both">Cả hai</option></select></label>'+
 '<div id="slot-editor-form"></div>'+
 '<h4>Danh sách ô tự vẽ ('+normalizeUserSlots(slots).length+')</h4>'+
 '<div id="slot-editor-list"></div>'+
 '</div></div><div id="slot-editor-feedback" role="status" aria-live="polite" class="board-editor-feedback"></div></section>';
}
export function mountBoardEditor(root,{getSlots,onChange,readOnly=false,selectedId=""}){
 const wrapper=root.querySelector("#slot-editor");
 if(!wrapper)return;
 let selected=selectedId||"",draft=null,drag=null;
 const q=s=>wrapper.querySelector(s);
 const announce=(message,isError=false)=>{const p=q("#slot-editor-feedback");if(p){p.textContent=message;p.classList.toggle("error",isError);}};
 const slots=()=>normalizeUserSlots(getSlots());
 const current=()=>draft||slots().find(x=>x.id===selected)||null;
 const form=()=>{
  const slot=current();
  if(!slot)return '<div class="panel-note">Chưa chọn ô. Kéo trên sa bàn để tạo ô mới hoặc chọn một ô trong danh sách.</div>'+
   '<button type="button" class="btn btn-outline" data-slot-add>Tạo ô tại giữa sa bàn</button>';
  return '<div class="board-editor-form">'+
   '<div class="board-editor-form-top"><strong>'+escape(slot.id)+'</strong>'+
   (draft?'<span>Ô mới · chưa lưu</span>':'<span>Đang chỉnh sửa</span>')+'</div>'+
   '<label class="board-editor-field">Tên ô<input id="slot-name" type="text" maxlength="70" value="'+escape(slot.label)+'"></label>'+
   '<label class="board-editor-field">Loại ô<select id="slot-kind">'+SLOT_TYPES.map(t=>
     '<option value="'+t+'"'+(slot.type===t?" selected":"")+'>'+kindLabel[t]+'</option>').join("")+'</select></label>'+
   '<div class="board-editor-numeric">'+
   input("slot-x","Tâm X (%)",slot.x,0,100,.1)+input("slot-y","Tâm Y (%)",slot.y,0,100,.1)+
   input("slot-w","Rộng (cm)",slot.widthCm,2,216,.1)+input("slot-h","Cao (cm)",slot.heightCm,2,120,.1)+
   input("slot-rotation","Góc xoay ô (°)",slot.rotation,0,359.99,1)+
   input("slot-approach","Hướng tiếp cận (°)",slot.approach,0,359.99,1)+'</div>'+
    '<div class="board-editor-quick-actions" role="group" aria-label="Điều chỉnh nhanh ô đang chọn">'+
    '<button type="button" class="btn btn-outline btn-small" data-slot-adjust="rotate-left">↶ Xoay −15°</button>'+
    '<button type="button" class="btn btn-outline btn-small" data-slot-adjust="rotate-right">↷ Xoay +15°</button>'+
    '<button type="button" class="btn btn-outline btn-small" data-slot-adjust="shrink">− Thu nhỏ</button>'+
    '<button type="button" class="btn btn-outline btn-small" data-slot-adjust="grow">+ Phóng to</button></div>'+
    '<p class="board-editor-unsaved-hint">Thay đổi được xem trước trên sa bàn, chỉ lưu khi bấm Lưu ô.</p>'+
   '<fieldset class="board-editor-models"><legend>Cho phép đặt mô hình nhiệm vụ</legend>'+
    CUSTOM_SLOT_MODELS.map(id=>'<label><input type="checkbox" data-slot-model="'+id+'"'+(slot.allowedModels.includes(id)?" checked":"")+
    '> '+MODEL_LABELS[id]+'</label>').join("")+'</fieldset>'+
   '<div class="action-row"><button class="btn" data-slot-save>Lưu ô</button>'+
   '<button class="btn btn-outline" data-slot-cancel>Hủy chọn</button>'+
   (draft?'':'<button class="btn btn-danger" data-slot-delete>Xóa ô</button>')+'</div></div>';
 };
 const cell=(slot)=>'<button type="button" class="board-editor-cell '+slot.type+'" data-slot-select="'+escape(slot.id)+'" title="'+escape(slot.label)+'" aria-label="Chỉnh sửa ô '+escape(slot.id)+'"'+
  ' style="left:'+slot.x+'%;top:'+slot.y+'%;width:'+(slot.widthCm/FIELD_CM.width*100)+'%;height:'+(slot.heightCm/FIELD_CM.height*100)+
  '%;transform:translate(-50%,-50%) rotate('+slot.rotation+'deg)"'+(selected===slot.id?' data-selected="true"':"")+'>'+
  '<span style="transform:rotate('+-slot.rotation+'deg)">'+escape(slot.id)+'</span></button>';
 const paint=()=>{
  const data=slots();
  q("#slot-editor-overlays").innerHTML=data.map(cell).join("");
  q("#slot-editor-list").innerHTML=data.length?data.map(s=>'<button type="button" class="board-editor-list-item" data-slot-select="'+escape(s.id)+'"'+
    (selected===s.id?' aria-current="true"':'')+'><strong>'+escape(s.id)+' · '+escape(s.label)+'</strong><small>'+kindLabel[s.type]+' · '+
    s.widthCm+' × '+s.heightCm+' cm · xoay '+s.rotation+'°</small></button>').join(""):'<p class="muted">Chưa có ô tự vẽ.</p>';
  q("#slot-editor-form").innerHTML=form();
  const type=q("#slot-draw-type");if(type&&current())type.value=current().type;
  if(readOnly)wrapper.querySelectorAll("button,input,select").forEach(n=>n.disabled=true);
 };
 const fieldValue=(id)=>q("#"+id)?.value;
 const gather=()=>{
  const source=current();if(!source)throw Error("Chưa chọn ô.");
  const type=fieldValue("slot-kind");
  const result={...source,label:fieldValue("slot-name"),type,
   x:Number(fieldValue("slot-x")),y:Number(fieldValue("slot-y")),
   widthCm:Number(fieldValue("slot-w")),heightCm:Number(fieldValue("slot-h")),
   rotation:Number(fieldValue("slot-rotation")),approach:Number(fieldValue("slot-approach")),
   allowedModels:[...wrapper.querySelectorAll("[data-slot-model]:checked")].map(x=>x.dataset.slotModel)};
  return normalizeUserSlots([result])[0];
 };
 const at=(event)=>{
  const area=q("#slot-editor-canvas").getBoundingClientRect();
  if(!area.width||!area.height)throw Error("Không đo được kích thước vùng vẽ.");
  return {x:Math.min(100,Math.max(0,(event.clientX-area.left)/area.width*100)),
   y:Math.min(100,Math.max(0,(event.clientY-area.top)/area.height*100))};
 };
 const drawPreview=(a,b)=>{
  const left=Math.min(a.x,b.x),top=Math.min(a.y,b.y);
  const div=q("#slot-editor-draft");
  div.hidden=false;div.classList.remove("is-form-preview");div.style.transform="none";
  div.style.left=left+"%";div.style.top=top+"%";
  div.style.width=Math.abs(b.x-a.x)+"%";div.style.height=Math.abs(b.y-a.y)+"%";
 };
 const closeDraw=()=>{
  drag=null;const div=q("#slot-editor-draft");
  if(div){div.hidden=true;div.classList.remove("is-form-preview");div.style.transform="none";}
 };
 // Only previews are changed until Save. Invalid geometry remains unsaved.
 const previewForm=()=>{
  try{
   const next=gather();
   const cell=[...wrapper.querySelectorAll(".board-editor-cell")].find(n=>n.dataset.slotSelect===next.id);
   const width=next.widthCm/FIELD_CM.width*100+"%",height=next.heightCm/FIELD_CM.height*100+"%";
   const transform="translate(-50%,-50%) rotate("+next.rotation+"deg)";
   if(cell)Object.assign(cell.style,{left:next.x+"%",top:next.y+"%",width,height,transform});
   else if(draft){
    const preview=q("#slot-editor-draft");
    preview.hidden=false;preview.classList.add("is-form-preview");
    Object.assign(preview.style,{left:next.x+"%",top:next.y+"%",width,height,transform});
   }
   announce("Đang xem trước — bấm Lưu ô để áp dụng.");
  }catch(e){announce("Vùng xem trước chưa hợp lệ: "+e.message,true);}
 };
 wrapper.addEventListener("input",event=>{
  if(readOnly||!event.target.closest("#slot-editor-form"))return;
  previewForm();
 });
 wrapper.addEventListener("pointerdown",event=>{
  if(readOnly||event.button!==0||!event.target.closest("[data-slot-canvas]"))return;
  const canvas=q("#slot-editor-canvas");
  const clicked=event.target.closest(".board-editor-cell[data-slot-select]");
  try{
   if(clicked){
    const slot=slots().find(x=>x.id===clicked.dataset.slotSelect);
    if(!slot)return;
    selected=slot.id;draft=null;
    drag={kind:"move",id:event.pointerId,start:at(event),slot,preview:slot,moved:false,cell:clicked};
   }else{
    drag={kind:"draw",start:at(event),id:event.pointerId};
    drawPreview(drag.start,drag.start);
   }
   event.preventDefault();
   canvas.setPointerCapture?.(event.pointerId);
  }catch(e){announce(e.message,true);closeDraw();}
 });
 wrapper.addEventListener("pointermove",event=>{
  if(!drag||event.pointerId!==drag.id)return;
  try{
   const point=at(event);
   if(drag.kind==="draw"){drawPreview(drag.start,point);return;}
   const dx=point.x-drag.start.x,dy=point.y-drag.start.y;
   if(Math.hypot(dx,dy)<.2&&!drag.moved)return;
   const candidate=normalizeUserSlots([{...drag.slot,x:drag.slot.x+dx,y:drag.slot.y+dy}])[0];
   drag.preview=candidate;drag.moved=true;
   drag.cell.style.left=candidate.x+"%";
   drag.cell.style.top=candidate.y+"%";
  }catch(e){announce("Không thể di chuyển ô ra ngoài biên sa bàn.",true);}
 });
 wrapper.addEventListener("pointerup",event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const moving=drag.kind==="move";
  try{
   if(moving){
    if(drag.moved){
     const changed=drag.preview;
     onChange(normalizeUserSlots([...slots().filter(x=>x.id!==changed.id),changed]),changed.id);
     announce("Đã di chuyển và lưu ô "+changed.id+". Vị trí mới dùng cho các đề Random tiếp theo.");
    }else announce("Đã chọn ô "+drag.slot.id+". Chỉnh kích thước và hướng ở bảng bên phải.");
    draft=null;selected=drag.slot.id;paint();return;
   }
   const a=drag.start,b=at(event),width=Math.abs(a.x-b.x)/100*FIELD_CM.width,height=Math.abs(a.y-b.y)/100*FIELD_CM.height;
   if(width<2||height<2){announce("Ô phải có chiều rộng và chiều cao tối thiểu 2 cm.",true);return;}
   const type=q("#slot-draw-type")?.value||"task";
   draft=normalizeUserSlots([{id:nextUserSlotId(slots()),
    label:"Ô tự vẽ",x:(a.x+b.x)/2,y:(a.y+b.y)/2,widthCm:width,heightCm:height,
    type,rotation:0,approach:0,allowedModels:[...CUSTOM_SLOT_MODELS]}])[0];
   selected="";paint();announce("Ô mới đang ở chế độ xem trước. Chỉnh thông số rồi bấm Lưu ô.");
  }catch(e){if(moving)paint();announce(e.message,true);}finally{closeDraw();if(!moving&&draft)previewForm();}
 });
 wrapper.addEventListener("pointercancel",()=>{if(drag?.kind==="move")paint();closeDraw();});
 wrapper.addEventListener("click",event=>{
  const target=event.target.closest("button");if(!target||readOnly)return;
  if(target.dataset.slotSelect){
   selected=target.dataset.slotSelect;draft=null;paint();announce("Đang chỉnh sửa ô "+selected+".");return;
  }
  if(target.hasAttribute("data-slot-add")){
   try{draft=normalizeUserSlots([{id:nextUserSlotId(slots()),label:"Ô tự vẽ",type:q("#slot-draw-type")?.value||"task",
     x:50,y:50,widthCm:12,heightCm:10,rotation:0,approach:0,allowedModels:[...CUSTOM_SLOT_MODELS]}])[0];
    selected="";paint();announce("Điều chỉnh ô mới rồi chọn Lưu ô.");}catch(e){announce(e.message,true);}return;
  }
  if(target.dataset.slotAdjust){
   const action=target.dataset.slotAdjust;
   const rotate=q("#slot-rotation"),width=q("#slot-w"),height=q("#slot-h");
   if(!rotate||!width||!height)return;
   if(action==="rotate-left"||action==="rotate-right"){
    const delta=action==="rotate-left"?-15:15;
    rotate.value=((Number(rotate.value)+delta)%360+360)%360;
   }else if(action==="grow"||action==="shrink"){
    const step=action==="grow"?2:-2;
    width.value=Math.max(2,Math.min(FIELD_CM.width,Number(width.value)+step));
    height.value=Math.max(2,Math.min(FIELD_CM.height,Number(height.value)+step));
   }
   previewForm();return;
  }
  if(target.hasAttribute("data-slot-cancel")){draft=null;selected="";paint();closeDraw();announce("Đã hủy chọn ô.");return;}
  if(target.hasAttribute("data-slot-save")){
   try{const next=gather(),all=slots().filter(s=>s.id!==next.id);
    const updated=normalizeUserSlots([...all,next]);
    onChange(updated,next.id);draft=null;selected=next.id;paint();announce("Đã lưu ô "+next.id+". Những đề đã tạo trước đây không bị thay đổi.");
   }catch(e){announce(e.message,true);}return;
  }
  if(target.hasAttribute("data-slot-delete")){
   const existing=slots().find(s=>s.id===selected);if(!existing)return;
   if(typeof window!=="undefined"&&typeof window.confirm==="function"&&!window.confirm("Xóa ô "+existing.id+"? Đề đã tạo trước vẫn được giữ nguyên."))return;
   onChange(slots().filter(s=>s.id!==existing.id),"");draft=null;selected="";paint();announce("Đã xóa ô "+existing.id+".");return;
  }
 });
 paint();
}
