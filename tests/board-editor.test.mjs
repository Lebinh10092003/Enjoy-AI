import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import {normalizeUserSlots,nextUserSlotId,userTaskSlots,userObstacleSlots,rotatedBounds,slotConfigKey,userSlotsIntersect,overlappingUserSlotPairs,slotTranslationBounds,transformUserSlot} from "../board-slots.mjs";
import {renderBoardEditor,mountBoardEditor} from "../board-editor.mjs";
import {generateLayout,initialData,normalizeData} from "../core.mjs";
import {renderArena} from "../arena-ui.mjs";
import {assessLayoutSafety} from "../placement.mjs";

const one={id:"U001",label:"Ô trắng do người dùng vẽ",x:45,y:48,
 widthCm:14,heightCm:12,rotation:20,approach:135,type:"both",
 allowedModels:["compass","printing","seismo","bonus"]};
test("Manual slots preserve centimetre dimensions and ignore obsolete approach metadata",()=>{
 const [slot]=normalizeUserSlots([one]);
 assert.equal(slot.rotation,20);
 assert.equal(slot.approach,undefined);
 assert.equal(slot.widthCm,14);
 assert.equal(userTaskSlots([one])[0].edge,"custom");
 assert.equal(userObstacleSlots([one])[0].w,14/216*100);
 assert.notEqual(rotatedBounds(14,12,20).w,14);
 assert.equal(nextUserSlotId([one]),"U002");
 assert.deepEqual(normalizeData({...initialData(),boardSlots:[one]}).boardSlots,[slot]);
 assert.notEqual(slotConfigKey([one]),slotConfigKey([{...one,rotation:60}]));
});
test("Reject out-of-bounds, duplicate, negative and malformed slots",()=>{
 assert.throws(()=>normalizeUserSlots([one,{...one}]),/trùng/);
 assert.throws(()=>normalizeUserSlots([{...one,widthCm:-1}]),/widthCm/);
 assert.throws(()=>normalizeUserSlots([{...one,x:99,y:50}]),/biên sa bàn/);
 assert.throws(()=>normalizeUserSlots([{...one,rotation:400}]),/rotation/);
 assert.throws(()=>normalizeUserSlots([{...one,type:"unknown"}]),/không hợp lệ/);
 assert.throws(()=>normalizeUserSlots([{...one,allowedModels:[]}]),/ít nhất một mô hình/);
 assert.throws(()=>normalizeUserSlots(Array.from({length:101},(_,i)=>({...one,id:"U"+String(i+1).padStart(3,"0")}))),/tối đa/);
});
test("Rendered Random board has no simulated green BFS route, including legacy proposals",()=>{
 const old=generateLayout({level:"easy",seed:"HISTORIC-APPROACH",allowWhiteSlots:true});
 const html=renderArena({...old,navigation:{...old.navigation,path:[{x:5,y:5},{x:95,y:95}]}});
 assert.ok(html.includes("arena-board"));
 assert.ok(!html.includes("clearance-route-overlay"));
 assert.ok(!html.includes("polyline"));
 assert.ok(!html.includes("Đường nét xanh"));
});
test("Saved custom geometry remains visible after changing current configuration",()=>{
 const layout={tasks:[{id:"compass",slot:"U001",angle:135}],obstacles:["U002"],
   generatorVersion:4,slotDefinitions:[one,
     {id:"U002",label:"Cản",x:60,y:30,widthCm:8,heightCm:10,rotation:90,
      approach:0,type:"obstacle",allowedModels:[]}]};
 const html=renderArena(layout);
 assert.ok(html.includes('data-map-slot="U001"'));
 assert.ok(html.includes("zone-task"));
 assert.ok(html.includes("rotate(20deg)"));
 assert.ok(html.includes('aria-label="Vật cản U002"'));
 assert.ok(html.includes("rotate(90deg)"));
 assert.ok(!html.includes("clearance-route-overlay"));
});
test("User-drawn slot editor supports mouse/touch drag, adjust, save and delete",()=>{
 const dom=new JSDOM('<main id="root"></main>',{url:"https://example.test"});
 const {document}=dom.window;
 let items=[];
 const root=document.querySelector("#root");
 root.innerHTML=renderBoardEditor(items);
 mountBoardEditor(root,{getSlots:()=>items,onChange:(data)=>{items=data;}});
 const canvas=root.querySelector("#slot-editor-canvas");
 canvas.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:600});
 const fire=(name,x,y)=>{
  const e=new dom.window.Event(name,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:5},button:{value:0},
   clientX:{value:x},clientY:{value:y}});
  canvas.dispatchEvent(e);
 };
 root.querySelector("#slot-draw-type").value="obstacle";
 fire("pointerdown",200,150);
 fire("pointermove",270,210);
 fire("pointerup",270,210);
 assert.match(root.querySelector("#slot-editor-form").textContent,/Ô mới/);
 assert.ok(root.querySelector("#slot-rotation"));
 root.querySelector("#slot-name").value="Vật cản tự định nghĩa";
 root.querySelector("#slot-rotation").value="30";
 root.querySelector("[data-slot-save]").click();
 assert.equal(items.length,1);
 assert.equal(items[0].type,"obstacle");
 assert.equal(items[0].rotation,30);
 assert.ok(root.querySelector('[data-slot-select="U001"]'));
 root.querySelector('[data-slot-select="U001"]').click();
 assert.equal(root.querySelector("#slot-approach"),null);
 assert.equal(items[0].approach,undefined);
 // Editing the controls previews geometry, but only Save commits changes.
 const oldWidth=items[0].widthCm;
 root.querySelector("#slot-w").value="20";
 root.querySelector("#slot-w").dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(items[0].widthCm,oldWidth);
 assert.match(root.querySelector("#slot-editor-feedback").textContent,/Đang xem trước/);
 const previewCell=root.querySelector(".board-editor-cell");
 assert.ok(previewCell.style.width.includes(String(20/216*100).slice(0,7)));
 root.querySelector('[data-slot-adjust="rotate-right"]').click();
 assert.equal(root.querySelector("#slot-rotation").value,"45");
 assert.equal(items[0].rotation,30);
 root.querySelector("[data-slot-save]").click();
 assert.equal(items[0].widthCm,20);
 assert.equal(items[0].rotation,45);
 // Dragging an existing cell moves its center and persists to data.
 const beforeX=items[0].x;
 const movingCell=root.querySelector(".board-editor-cell");
 const pointer=(target,name,x,y)=>{
  const e=new dom.window.Event(name,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:8},button:{value:0},
   clientX:{value:x},clientY:{value:y}});
  target.dispatchEvent(e);
 };
 pointer(movingCell,"pointerdown",235,180);
 pointer(canvas,"pointermove",265,180);
 pointer(canvas,"pointerup",265,180);
 assert.ok(items[0].x>beforeX,"Dragging the box should move it on the field.");
 assert.equal(items[0].x,Number((beforeX+3).toFixed(3)));
 assert.match(root.querySelector("#slot-editor-feedback").textContent,/Đã di chuyển/);
 dom.window.confirm=()=>true;
 root.querySelector("[data-slot-delete]").click();
 assert.equal(items.length,0);
 dom.window.close();
});
test("Custom slots integrate into Random V4 and preserve safety when generated",()=>{
 const customSlots=[
  {...one,id:"U001",label:"Nhiệm vụ gần giữa",x:42,y:40,widthCm:14,heightCm:12,rotation:0,type:"task"},
  {id:"U002",label:"Vật cản phụ",x:75,y:30,widthCm:9,heightCm:9,
   rotation:0,approach:0,type:"obstacle",allowedModels:[]}
 ];
 let valid=0,usesCustom=false;
 for(let i=0;i<20;i++){
  try{
   const layout=generateLayout({level:"medium",seed:"USER-SLOTS-"+i,allowWhiteSlots:true,robotCm:30,customSlots});
   assert.equal(layout.generatorVersion,4);
   assert.equal(layout.slotConfigKey,slotConfigKey(customSlots));
   assert.equal(assessLayoutSafety(layout).ok,true);
   assert.equal(layout.tasks.length,7);
   assert.equal(layout.obstacles.length,3);
   assert.ok(layout.slotDefinitions.every(s=>s.id.startsWith("U")));
   const replay=generateLayout({level:"medium",seed:"USER-SLOTS-"+i,allowWhiteSlots:true,robotCm:30,customSlots});
   assert.deepEqual(layout.tasks,replay.tasks);
   usesCustom ||= layout.tasks.some(t=>t.slot==="U001")||layout.obstacles.includes("U002");
   valid++;
  }catch(error){
   if(!/Không tìm được đề hợp lệ/.test(error.message))throw error;
  }
 }
 assert.ok(valid>0,"At least one custom board should have a safe arrangement.");
 assert.ok(usesCustom,"Custom locations must be eligible in the generator.");
});

test("Angle sliders sync both ways with exact numeric value and sticky top Save",()=>{
 const dom=new JSDOM('<main id="root"></main>',{url:"https://example.test"});
 const document=dom.window.document,root=document.querySelector("#root");
 let items=[{...one}];
 root.innerHTML=renderBoardEditor(items);
 mountBoardEditor(root,{getSlots:()=>items,onChange:updated=>{items=updated;},selectedId:"U001"});
 const q=id=>root.querySelector("#"+id);
 assert.ok(root.querySelector(".board-editor-form-top [data-slot-save]"),"Save is near the top of the form");
 assert.equal(root.querySelectorAll("[data-slot-save]").length,1);
 assert.equal(q("slot-rotation-slider").type,"range");
 assert.equal(q("slot-approach-slider"),null);
 assert.equal(q("slot-approach"),null);
 assert.equal(q("slot-rotation-slider").min,"0");
 assert.equal(q("slot-rotation-slider").max,"359");
 q("slot-rotation-slider").value="225";
 q("slot-rotation-slider").dispatchEvent(new dom.window.Event("input",{bubbles:true}));
 assert.equal(q("slot-rotation").value,"225");
 assert.equal(q("slot-rotation-readout").textContent,"225°");
 assert.equal(items[0].rotation,20,"Drag/slider preview never saves automatically");
 root.querySelector('[data-slot-adjust="rotate-right"]').click();
 assert.equal(q("slot-rotation").value,"240");
 assert.equal(q("slot-rotation-slider").value,"240");
 root.querySelector("[data-slot-save]").click();
 assert.equal(items[0].rotation,240);
 assert.equal(items[0].approach,undefined);
 dom.window.close();
});

test("Crossing + slots are legal to draw but mutually exclusive in a Random layout",()=>{
 const h={...one,id:"U010",label:"Thanh ngang",x:46,y:40,
  widthCm:52,heightCm:6,rotation:0,approach:0,type:"both"};
 const v={...one,id:"U011",label:"Thanh dọc",x:52,y:40,
  widthCm:6,heightCm:46,rotation:0,approach:90,type:"both"};
 assert.equal(userSlotsIntersect(h,v),true);
 assert.deepEqual(overlappingUserSlotPairs([h,v]),[["U010","U011"]]);
 assert.equal(userSlotsIntersect(h,{...v,x:90}),false);
 assert.equal(userSlotsIntersect(h,{...v,x:h.x+((h.widthCm+v.widthCm)/2)/216*100}),false,
  "Just touching rectangle boundaries does not create a collision");
 const safe=assessLayoutSafety({
  tasks:[{id:"compass",slot:"U010",angle:0}],obstacles:["U011"],
  slotDefinitions:[h,v]
 });
 assert.equal(safe.ok,false);
 assert.equal(safe.reason,"overlapping-custom-slots");
 assert.deepEqual(safe.items,["U010","U011"]);
 const dom=new JSDOM('<main id="root"></main>',{url:"https://example.test"});
 const document=dom.window.document,root=document.querySelector("#root");
 root.innerHTML=renderBoardEditor([h,v]);
 mountBoardEditor(root,{getSlots:()=>[h,v],onChange:()=>{},selectedId:"U010"});
 assert.equal(root.querySelectorAll('[data-crossing="true"]').length,2);
 assert.match(root.querySelector("#slot-editor-form").textContent,/Giao với U011/);
 assert.match(root.querySelector("#slot-editor-list").textContent,/chọn 1 khi Random/);
 dom.window.close();
});

test("Random V4 never places two intersecting user-defined slots simultaneously",()=>{
 const h={...one,id:"U010",label:"Thanh ngang",x:46,y:40,
  widthCm:52,heightCm:6,rotation:0,approach:0,type:"both"};
 const v={...one,id:"U011",label:"Thanh dọc",x:52,y:40,
  widthCm:6,heightCm:46,rotation:0,approach:90,type:"both"};
 let accepted=0;
 for(let i=0;i<25;i++){
  try{
   const layout=generateLayout({level:"medium",seed:"CROSS-PLUS-"+i,
    allowWhiteSlots:true,customSlots:[h,v],robotCm:30});
   const used=new Set([...layout.tasks.map(t=>t.slot),...layout.obstacles]);
   assert.ok(!(used.has("U010")&&used.has("U011")));
   assert.equal(assessLayoutSafety(layout).ok,true);
   accepted++;
  }catch(error){
   if(!/Không tìm được đề hợp lệ/.test(error.message))throw error;
  }
 }
 assert.ok(accepted>0,"Crossed slots must not prevent all otherwise safe arrangements");
});

test("Local-axis gizmo geometry is rotation-aware, free and bounded",()=>{
 const slot=normalizeUserSlots([{...one,rotation:45}])[0];
 const start={x:slot.x,y:slot.y};
 const x=transformUserSlot(slot,"x",start,{x:start.x+5,y:start.y});
 const movedX=(x.x-slot.x)*216/100,movedY=(x.y-slot.y)*120/100;
 assert.ok(movedX>0&&movedY>0);
 assert.ok(Math.abs(movedX-movedY)<.01,"X axis follows the 45 degree local heading");
 const y=transformUserSlot(slot,"y",start,{x:start.x+5,y:start.y});
 const dx=(y.x-slot.x)*216/100,dy=(y.y-slot.y)*120/100;
 assert.ok(Math.abs(dx+dy)<.01,"Y axis is perpendicular to the heading");
 const free=transformUserSlot(slot,"free",start,{x:start.x+4,y:start.y+6});
 assert.equal(free.x,slot.x+4);
 assert.equal(free.y,slot.y+6);
 const spin=transformUserSlot({...slot,rotation:0},"rotate",
   {x:slot.x+5,y:slot.y},{x:slot.x,y:slot.y+5});
 assert.ok(Math.abs(spin.rotation-90)<.01,"Rotate handle changes local heading");
 const edge=transformUserSlot(slot,"free",start,{x:150,y:150});
 const bounds=slotTranslationBounds(slot);
 assert.ok(edge.x<=bounds.x.max&&edge.y<=bounds.y.max);
 assert.equal(normalizeUserSlots([edge])[0].id,slot.id);
 assert.throws(()=>transformUserSlot(slot,"unknown",start,start),/không hợp lệ/);
});

test("Move/rotate gizmo handles are visible, interactive and preserve 30cm placement semantics",()=>{
 const dom=new JSDOM('<main id="root"></main>',{url:"https://example.test"});
 const root=dom.window.document.querySelector("#root");
 let items=[normalizeUserSlots([one])[0]];
 root.innerHTML=renderBoardEditor(items);
 mountBoardEditor(root,{getSlots:()=>items,onChange:next=>{items=next;},selectedId:"U001"});
 const canvas=root.querySelector("#slot-editor-canvas");
 canvas.getBoundingClientRect=()=>({left:0,top:0,width:1000,height:600});
 const pointer=(node,name,x,y,id=10)=>{
  const e=new dom.window.Event(name,{bubbles:true,cancelable:true});
  Object.defineProperties(e,{pointerId:{value:id},button:{value:0},clientX:{value:x},clientY:{value:y}});
  node.dispatchEvent(e);
 };
 for(const handle of ["free","x","y","rotate"])
  assert.ok(root.querySelector('[data-gizmo="'+handle+'"]'),"Missing "+handle+" handle");
 assert.equal(root.querySelector("#slot-approach"),null);
 const baseline=items[0];
 pointer(root.querySelector('[data-gizmo="x"]'),"pointerdown",450,288);
 pointer(canvas,"pointermove",500,288);
 pointer(canvas,"pointerup",500,288);
 assert.ok(items[0].x>baseline.x&&items[0].y>baseline.y,"X drag translates along the rotated box heading");
 const rotated=items[0];
 pointer(root.querySelector('[data-gizmo="rotate"]'),"pointerdown",(rotated.x+5)*10,rotated.y*6);
 pointer(canvas,"pointermove",rotated.x*10,(rotated.y+5)*6);
 pointer(canvas,"pointerup",rotated.x*10,(rotated.y+5)*6);
 assert.ok(Math.abs(items[0].rotation-(rotated.rotation+90))<.02);
 assert.equal(items[0].approach,undefined);
 assert.ok(root.querySelector(".board-editor-gizmo").style.transform.includes("rotate("));
 dom.window.close();
});

test("Custom slot generation uses no inferred approach heading",()=>{
 const custom={...one,id:"U001",type:"task",rotation:25};
 let used=false;
 for(let i=0;i<50;i++){
  const layout=generateLayout({level:"expert",seed:"NO-ROBOT-HEADING-"+i,customSlots:[custom],allowWhiteSlots:true});
  const assigned=layout.tasks.find(t=>t.slot==="U001");
  if(assigned){
   assert.equal(assigned.angle,null);
   assert.ok(!renderArena(layout).includes("Hướng tiếp cận"));
   used=true;break;
  }
 }
 assert.ok(used,"At least one valid random layout should exercise a custom slot");
});
