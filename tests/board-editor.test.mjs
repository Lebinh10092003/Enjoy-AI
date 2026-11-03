import test from "node:test";
import assert from "node:assert/strict";
import {JSDOM} from "jsdom";
import {normalizeUserSlots,nextUserSlotId,userTaskSlots,userObstacleSlots,rotatedBounds,slotConfigKey} from "../board-slots.mjs";
import {renderBoardEditor,mountBoardEditor} from "../board-editor.mjs";
import {generateLayout,initialData,normalizeData} from "../core.mjs";
import {renderArena} from "../arena-ui.mjs";
import {assessLayoutSafety} from "../placement.mjs";

const one={id:"U001",label:"Ô trắng do người dùng vẽ",x:45,y:48,
 widthCm:14,heightCm:12,rotation:20,approach:135,type:"both",
 allowedModels:["compass","printing","seismo","bonus"]};
test("Manual slots preserve centimetre dimensions, independent rotation and approach",()=>{
 const [slot]=normalizeUserSlots([one]);
 assert.equal(slot.rotation,20);
 assert.equal(slot.approach,135);
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
 root.querySelector("#slot-approach").value="225";
 root.querySelector("[data-slot-save]").click();
 assert.equal(items[0].approach,225);
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
