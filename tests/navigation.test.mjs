import test from "node:test";
import assert from "node:assert/strict";
import {checkNavigation,FIELD_CM,MAX_ROBOT_CM} from "../route-safety.mjs";
import {generateLayout} from "../core.mjs";
import {assessLayoutSafety,WHITE_SLOTS,OBSTACLE_SLOTS,BASE_TASK_SLOTS,SAFE_BASE_OBSTACLE_SLOTS} from "../placement.mjs";

test("Physical field uses 216 x 120cm, robot clearance covers 30cm",()=>{
 assert.deepEqual(FIELD_CM,{width:216,height:120});
 assert.equal(MAX_ROBOT_CM,30);
 assert.ok(WHITE_SLOTS.length>=12);
 assert.ok(OBSTACLE_SLOTS.some(p=>p.id.startsWith("W")));
});
test("A continuous barrier fails closed; an isolated obstacle keeps a right-hand escape",()=>{
 const wall=checkNavigation([{id:"wall-barrier",x:100,y:60,w:20,h:120}]);
 assert.equal(wall.ok,false);
 assert.equal(wall.reason,"right-side-line-isolated");
 const clear=checkNavigation([{id:"small",x:75,y:55,w:8,h:8}]);
 assert.equal(clear.ok,true);
 assert.ok(clear.path.length>2);
 assert.ok(clear.reachedGates.length>0);
});
test("Overlapping models are rejected before routing",()=>{
 const out=checkNavigation([
  {id:"task",x:80,y:70,w:10,h:10},{id:"obstacle",x:85,y:70,w:8,h:8}
 ]);
 assert.equal(out.ok,false);
 assert.equal(out.reason,"overlap");
});
test("Expanded V3 random preserves task counts, grade move matrix and robot corridor",()=>{
 const matrix={easy:[2,0],medium:[2,1],hard:[3,1],expert:[3,2]};
 for(const [level,[taskMoves,obstacleMoves]] of Object.entries(matrix)){
  const signatures=new Set();
  for(let i=0;i<12;i++){
   const seed="NAV-30CM-"+level+"-"+i;
   const layout=generateLayout({level,seed,allowWhiteSlots:true,wallMode:"normal",robotCm:30});
   assert.equal(layout.generatorVersion,3);
   assert.deepEqual(layout.tasks,generateLayout({level,seed,allowWhiteSlots:true,wallMode:"normal",robotCm:30}).tasks);
   assert.equal(layout.tasks.length,7);
   assert.equal(layout.obstacles.length,3);
   assert.equal(new Set(layout.tasks.map(t=>t.slot)).size,7);
   assert.equal(new Set(layout.obstacles).size,3);
   assert.equal(layout.changedTaskIds.length,taskMoves);
   assert.equal(layout.movedObstacleFrom.length,obstacleMoves);
   assert.equal(layout.tasks.filter(t=>t.slot!==BASE_TASK_SLOTS[t.id]).length,taskMoves);
   assert.equal(SAFE_BASE_OBSTACLE_SLOTS.filter((v,j)=>layout.obstacles[j]!==v).length,obstacleMoves);
   const safety=assessLayoutSafety(layout,{robotCm:30});
   assert.equal(safety.ok,true,level+" / "+seed+" / "+safety.reason);
   assert.ok(layout.navigation.path.length>1);
   signatures.add(JSON.stringify([layout.tasks,layout.obstacles]));
  }
  assert.ok(signatures.size>=4,"Random must produce multiple paths and layouts: "+level);
 }
});
test("Expanded pool truly uses white-marked mission and obstacle slots",()=>{
 let taskWhite=false,obstacleWhite=false;
 for(let i=0;i<75;i++){
  const x=generateLayout({level:"expert",seed:"WHITE-FLEX-"+i,allowWhiteSlots:true,robotCm:30});
  taskWhite||=x.tasks.some(t=>t.slot.startsWith("W"));
  obstacleWhite||=x.obstacles.some(o=>o.startsWith("W"));
 }
 assert.ok(taskWhite,"At least one tested model must reach a white marked task candidate");
 assert.ok(obstacleWhite,"At least one tested obstacle must reach a white marked obstacle candidate");
});
test("Legacy generation remains unchanged when allowWhiteSlots is absent",()=>{
 const old=generateLayout({level:"medium",seed:"HIST-2026",algorithmVersion:2});
 const currentLegacy=generateLayout({level:"medium",seed:"HIST-2026"});
 assert.deepEqual(old.tasks,currentLegacy.tasks);
 assert.deepEqual(old.obstacles,currentLegacy.obstacles);
 assert.ok(old.obstacles.every(id=>/^O[1-9]$/.test(id)));
});
test("Verified-only V3 rejects unconfirmed placement rather than silently relaxing safety",()=>{
 assert.throws(()=>generateLayout({level:"easy",seed:"NONE",allowWhiteSlots:true,
  verifiedOnly:true,approvals:{}}),/Chưa có đủ cấu hình/);
});

test("A barrier isolating the actual starting base is never accepted",()=>{
 const result=checkNavigation([{id:"start-barrier",x:26,y:100,w:30,h:25}]);
 assert.equal(result.ok,false);
 assert.equal(result.reason,"start-blocked");
});
