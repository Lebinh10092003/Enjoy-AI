import {FIELD_CM,MAX_ROBOT_CM,SAFETY_MARGIN_CM,FOOTPRINT_CM,rectangleFromSlot,checkNavigation} from "./route-safety.mjs";
// Coordinates are measured on the user's marked 2048×1137 field image.
// Rotation convention: 0°=right, 90°=down, 180°=left, 270°=up.
// These are APPROACH headings from the field path; not unverified model-actuator orientations.
export const ARENA_SIZE={width:2048,height:1137};
export const SLOTS=[
 {id:"A",label:"Trên trái",x:7.1,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"B",label:"Trên giữa",x:31.8,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"C",label:"Trên phải",x:56.4,y:10.8,approach:90,edge:"straight",path:"vertical"},
 {id:"D",label:"Dưới trái",x:31.8,y:87.2,approach:270,edge:"straight",path:"vertical"},
 {id:"E",label:"Dưới giữa",x:56.4,y:87.2,approach:270,edge:"straight",path:"vertical"},
 {id:"F",label:"Trung tâm oval",x:81.2,y:49.8,approach:180,edge:"oval",path:"horizontal"},
 {id:"G",label:"Góc trên trái oval",x:67.6,y:7.9,approach:45,edge:"diagonal",path:"diagonal"},
 {id:"H",label:"Góc trên phải oval",x:94.7,y:7.9,approach:135,edge:"diagonal",path:"diagonal"},
 {id:"I",label:"Góc dưới trái oval",x:67.6,y:91.4,approach:315,edge:"diagonal",path:"diagonal"},
 {id:"J",label:"Góc dưới phải oval",x:94.7,y:91.4,approach:225,edge:"diagonal",path:"diagonal"}
];
// White/outlined locations inferred from the supplied field photograph and
// annotated positions. Preliminary coordinates, not confirmed referee marks.
// Obstacle sites and task sites may share physical coordinates: collision
// validation rejects attempts occupying both.
export const WHITE_SLOTS=[
 {id:"W01",label:"Trắng · nhánh dưới phải",x:56.4,y:66.6,approach:180,edge:"white",path:"horizontal"},
 {id:"W02",label:"Trắng · giao dưới giữa",x:44.1,y:87.2,approach:270,edge:"white",path:"vertical"},
 {id:"W03",label:"Trắng · giao giữa trái",x:31.8,y:50.0,approach:180,edge:"white",path:"horizontal"},
 {id:"W04",label:"Trắng · giao giữa",x:44.1,y:50.0,approach:180,edge:"white",path:"horizontal"},
 {id:"W05",label:"Trắng · giao giữa phải",x:56.4,y:50.0,approach:180,edge:"white",path:"horizontal"},
 {id:"W06",label:"Trắng · ngang trái",x:19.8,y:50.0,approach:0,edge:"white",path:"horizontal"},
 {id:"W07",label:"Trắng · nhánh trên phải",x:56.4,y:33.3,approach:180,edge:"white",path:"horizontal"},
 {id:"W08",label:"Trắng · dọc phải trên",x:56.4,y:24.5,approach:270,edge:"white",path:"vertical"},
 {id:"W09",label:"Trắng · dọc giữa trên",x:44.1,y:24.5,approach:270,edge:"white",path:"vertical"},
 {id:"W10",label:"Trắng · dọc trái trên",x:31.8,y:24.5,approach:270,edge:"white",path:"vertical"},
 {id:"W11",label:"Trắng · dọc ngoài trên",x:19.8,y:24.5,approach:270,edge:"white",path:"vertical"},
 {id:"W12",label:"Trắng · dưới trái",x:19.8,y:67.7,approach:90,edge:"white",path:"vertical"},
 {id:"W13",label:"Trắng · giao trái",x:7.1,y:50.0,approach:0,edge:"white",path:"horizontal"},
 {id:"W14",label:"Trắng · giao dưới trái",x:31.8,y:87.2,approach:270,edge:"white",path:"vertical"},
 {id:"W15",label:"Trắng · gần Tường Thành",x:56.4,y:87.2,approach:270,edge:"white",path:"vertical"},
 {id:"W16",label:"Trắng · ngang trên trái",x:19.8,y:12.5,approach:90,edge:"white",path:"vertical"},
 {id:"W17",label:"Trắng · ngang trên giữa",x:44.1,y:12.5,approach:90,edge:"white",path:"vertical"}
];
SLOTS.push(...WHITE_SLOTS);
// Original figures from published 2026 rules (the same model illustrations supplied by user).
// CSS crops hide the instructional annotations while preserving the actual model photographs.
const prefix="https://www.enjoyaigreece.gr/wp-content/uploads/2026/02/";
export const MODEL_META={
 compass:{name:"La bàn",image:prefix+"image_2026-02-03_203127205-scaled.png",crop:{width:1000,left:260,top:0,height:300},footprint:"normal",guide:"Kim đỏ và miếng vàng. Kiểm tra phía tác động kim."},
 paper:{name:"Làm giấy",image:prefix+"image_2026-02-03_203318489-scaled.png",crop:{width:1000,left:285,top:0,height:300},footprint:"wide",guide:"Tay gạt phải ở phía có đường robot tiếp cận."},
 gun:{name:"Thuốc súng",image:prefix+"image_2026-02-03_203456015.png",crop:{width:1000,left:156,top:12,height:215},footprint:"wide",guide:"Tay gạt và khung hứng đạn không bị chặn."},
 printing:{name:"In chữ rời",image:prefix+"image_2026-02-03_203627051.png",crop:{width:1000,left:410,top:83,height:222},footprint:"normal",guide:"Hai khối ENJ/YAI và vị trí nam châm phải thao tác được."},
 seismo:{name:"Máy đo địa chấn",image:prefix+"image_2026-02-03_203753210.png",crop:{width:1000,left:168,top:20,height:235},footprint:"normal",guide:"Thanh đẩy cần hướng ra mặt robot có thể tiếp cận."},
 pyramid:{name:"Kim tự tháp",image:prefix+"image_2026-02-03_204028332.png",crop:{width:1000,left:272,top:0,height:300},footprint:"wide",guide:"Có khoảng trống cho robot đẩy lên bục thứ hai."},
 wall:{name:"Vạn Lý Trường Thành",image:prefix+"image_2026-02-03_204308528.png",crop:{width:1000,left:411,top:80,height:255},footprint:"wide",guide:"Bề mặt nhận vật liệu quay về hướng tiếp cận."},
 bonus:{name:"Nhiệm vụ thưởng",image:null,footprint:"normal",guide:"Chỉ áp dụng khi BTC công bố mô hình."}
};
// The large and wide models are conservative: avoid diagonal frames until physically confirmed.
// Approval sets are explicitly editable in later competition configurations.
const DIAGONAL_ONLY=new Set(["printing","compass","seismo"]);
// White reference marks are only considered for compact models until their
// physical dimensions and assembly directions are confirmed on the real mat.
const WHITE_TASK_MODELS=new Set(["compass","printing","seismo","bonus"]);
export const APPROACH_RULES=Object.fromEntries(Object.entries(MODEL_META).map(([key,meta])=>[
 key,Object.fromEntries(SLOTS.filter(slot=>
  (slot.edge==="white"?WHITE_TASK_MODELS.has(key):
    slot.edge!=="diagonal" || DIAGONAL_ONLY.has(key))
 ).map(slot=>[slot.id,[slot.approach]]))
]));
// Nine small red rectangular locations measured from the user's annotated field image.
// x/y are centers (% of field); w/h are actual marked rectangle dimensions (%).
// Obstacle positions are NOT model task slots. Do not share placement pools.
export const OBSTACLE_SLOTS=[
 {id:"O1",x:7.84,y:31.08,w:3.79,h:3.18,type:"horizontal"},
 {id:"O2",x:19.75,y:31.40,w:3.72,h:3.57,type:"horizontal"},
 {id:"O3",x:32.12,y:31.34,w:3.72,h:2.93,type:"horizontal"},
 {id:"O4",x:44.06,y:31.46,w:3.44,h:3.18,type:"horizontal"},
 {id:"O5",x:13.95,y:49.81,w:2.25,h:5.99,type:"vertical"},
 {id:"O6",x:26.04,y:50.13,w:1.69,h:6.88,type:"vertical"},
 {id:"O7",x:38.40,y:50.00,w:1.69,h:6.11,type:"vertical"},
 {id:"O8",x:32.19,y:68.54,w:3.30,h:3.95,type:"horizontal"},
 {id:"O9",x:44.31,y:68.73,w:4.50,h:4.33,type:"horizontal"}
];
OBSTACLE_SLOTS.push(...WHITE_SLOTS.map(slot=>({
 id:slot.id,x:slot.x,y:slot.y,w:3.9,h:4.8,type:"white"
})));
export const MAIN_TASK_COUNT=7;
export const OBSTACLE_COUNT=3;
// Required V+ event movement rules. The number placed on the board stays unchanged.
// "swapTasks" = exactly that many mission models leave their fixed baseline positions.
// "moveObstacles" = exactly that many of the three obstacles move to other small rectangles.
export const LEVELS=[
 {id:"easy",name:"Cơ bản",division:"Lớp 1–3",tasks:7,obstacles:3,swapTasks:2,moveObstacles:0},
 {id:"medium",name:"Trung bình",division:"Lớp 4–6",tasks:7,obstacles:3,swapTasks:2,moveObstacles:1},
 {id:"hard",name:"Khó",division:"Lớp 7–9",tasks:7,obstacles:3,swapTasks:3,moveObstacles:1},
 {id:"expert",name:"Nâng cao",division:"Lớp 10–12",tasks:7,obstacles:3,swapTasks:3,moveObstacles:2}
];
export const NORMAL_MODELS=["compass","paper","gun","printing","seismo","pyramid","wall"];
// V+ initial reference configuration for the numbered area of the board.
// It must be confirmed against the actual competition setup, not treated as a
// referee-approved official map. The three obstacles are always present.
// Great Wall remains at the same original frame E unless a separately designed,
// physically verified wall relocation feature is introduced.
export const BASE_TASK_SLOTS=Object.freeze({
 compass:"G",paper:"A",gun:"B",printing:"H",seismo:"C",pyramid:"D",wall:"E"
});
export const BASE_OBSTACLE_SLOTS=Object.freeze(["O1","O5","O8"]);
// An independent, navigation-safe starting configuration. The historical
// O1/O5/O8 baseline is preserved for deterministic replay of old layouts.
export const SAFE_BASE_OBSTACLE_SLOTS=Object.freeze(["O1","O2","O3"]);
export const WALL_MODES=[
 {id:"normal",label:"Không đảo (mặc định)"},
 {id:"reversed",label:"Luôn đảo Tường Thành 180°"},
 {id:"random",label:"Random đảo / không đảo"}
];
export function resolveWallReversed(mode="normal",seed="DEMO"){
 if(!WALL_MODES.some(x=>x.id===mode))throw Error("Chế độ đảo Tường Thành không hợp lệ.");
 if(mode==="normal")return false;
 if(mode==="reversed")return true;
 // Independent seeded RNG: switching wall mode must never change the other models/obstacles.
 return seeded(String(seed)+"|great-wall-orientation-v1")()>=0.5;
}

export function hashSeed(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function seeded(seed){let state=hashSeed(seed);return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffled(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function placementKey(taskId,slotId,approachAngle,reversed=false){
 return [taskId,slotId,approachAngle,taskId==="wall"&&reversed?"reversed":"normal"].join("|");
}
export function validPlacement(taskId,slotId,angle,approved={}){
 const angles=APPROACH_RULES[taskId]?.[slotId]||[];
 if(!angles.includes(angle))return false;
 const key=taskId+":"+slotId+":"+angle;
 return approved[key]!==false;
}
// All variants are derived from ONE stable base; random never shuffles all seven.
function combinations(source,n,start=0,chosen=[],out=[]){
 if(chosen.length===n){out.push([...chosen]);return out;}
 for(let i=start;i<=source.length-(n-chosen.length);i++){
  chosen.push(source[i]);combinations(source,n,i+1,chosen,out);chosen.pop();
 }
 return out;
}
function buildLegacyRandomLayout({level="medium",seed="DEMO",includeBonus=false,
 wallMode="normal",approved={},verifiedOnly=false,approvals={}}={}){
 const preset=LEVELS.find(x=>x.id===level);
 if(!preset)throw Error("Bảng thi không hợp lệ.");
 const rng=seeded(seed);
 const wallReversed=resolveWallReversed(wallMode,seed);
 const pool=NORMAL_MODELS.filter(id=>id!=="wall");
 // Exactly 2 or 3 models change position. Reversed model orientation never
 // alters task location, and unselected models remain on the baseline positions.
 const taskOptions=shuffled(combinations(pool,preset.swapTasks),rng);
 let selectedTasks=null,assignment=null;
 const allowed=(id,slot)=>{
  const angle=SLOTS.find(x=>x.id===slot)?.approach;
  return validPlacement(id,slot,angle,approved)&&
   (!verifiedOnly||approvals[placementKey(id,slot,angle,id==="wall"&&wallReversed)]===true);
 };
 for(const subset of taskOptions){
  const directions=subset.length===2?[[1,0]]:[[1,2,0],[2,0,1]];
  for(const permutation of shuffled(directions,rng)){
   const next={...BASE_TASK_SLOTS};
   for(let i=0;i<subset.length;i++)next[subset[i]]=BASE_TASK_SLOTS[subset[permutation[i]]];
   if(NORMAL_MODELS.every(id=>allowed(id,next[id]))){
    selectedTasks=subset;assignment=next;break;
   }
  }
  if(assignment)break;
 }
 if(!assignment)throw Error(verifiedOnly?
  "Chưa có đủ cấu hình vị trí và hướng đã kiểm nghiệm cho đúng số nhiệm vụ cần đổi. Hãy xác nhận thêm cấu hình trên sa bàn thật.":
  "Không tìm được hoán đổi nhiệm vụ hợp lệ. Hãy kiểm tra các hướng/vị trí.");
 const tasks=NORMAL_MODELS.map(id=>{
  const slot=assignment[id],angle=SLOTS.find(x=>x.id===slot).approach;
  return id==="wall"?{id,slot,angle,reversed:wallReversed,modelRotation:wallReversed?180:0}:{id,slot,angle};
 });
 if(includeBonus){
  // Bonus is not one of the seven mandatory models. Never remove/alter a core model.
  // Choose an empty task frame where it is permitted, or reject explicitly.
  const bonusCandidates=shuffled(SLOTS.filter(x=>!Object.values(assignment).includes(x.id)&&allowed("bonus",x.id)),rng);
  if(!bonusCandidates.length)throw Error("Không còn khung hợp lệ cho Bonus.");
  tasks.push({id:"bonus",slot:bonusCandidates[0].id,angle:bonusCandidates[0].approach});
 }
 // Move exactly N of the 3 baseline obstacles to previously vacant rectangle(s).
 // The position IDs of every unselected obstacle are left unchanged.
 const movable=shuffled([...BASE_OBSTACLE_SLOTS],rng).slice(0,preset.moveObstacles);
 const free=shuffled(OBSTACLE_SLOTS.map(x=>x.id).filter(id=>!BASE_OBSTACLE_SLOTS.includes(id)),rng);
 const movedTo=free.slice(0,preset.moveObstacles);
 const obstacleMap=Object.fromEntries(BASE_OBSTACLE_SLOTS.map((id,i)=>[i,id]));
 for(let i=0;i<movable.length;i++){
  const originalIndex=BASE_OBSTACLE_SLOTS.indexOf(movable[i]);
  obstacleMap[originalIndex]=movedTo[i];
 }
 const obstacles=BASE_OBSTACLE_SLOTS.map((_,i)=>obstacleMap[i]);
 return {
  id:"layout-"+Date.now().toString(36),version:4,level:preset.id,seed:String(seed),
  wallMode,wallReversed,tasks,obstacles,
  changeRules:{swapTasks:preset.swapTasks,moveObstacles:preset.moveObstacles},
  changedTaskIds:[...selectedTasks],movedObstacleFrom:[...movable],
  created:new Date().toISOString(),official:false,
  placementStatus:verifiedOnly?"physically-reviewed":"simulation",verifiedOnly,
  note:"Quy tắc V+: đổi "+preset.swapTasks+" nhiệm vụ, đổi "+preset.moveObstacles+
   " vị trí vật cản; tổng 7 nhiệm vụ và 3 vật cản. Tường Thành giữ ô gốc khi không đảo. Bản đồ gốc cần được xác nhận trên sa bàn thật."
 };
}

/**
 * Random Engine V2: sample uniformly from ALL valid task permutations, not the
 * first valid subset found in a shuffled list. Keep the legacy implementation
 * available for exact replay of previously saved V4 seeds.
 */
function taskCandidates({preset,wallReversed=false,approved={},verifiedOnly=false,approvals={},includeBonus=false}){
 const allowed=(id,slot)=>{
  const angle=SLOTS.find(x=>x.id===slot)?.approach;
  return validPlacement(id,slot,angle,approved)&&
   (!verifiedOnly||approvals[placementKey(id,slot,angle,id==="wall"&&wallReversed)]===true);
 };
 const pool=NORMAL_MODELS.filter(id=>id!=="wall");
 const candidates=[];
 for(const subset of combinations(pool,preset.swapTasks)){
  const directions=subset.length===2?[[1,0]]:[[1,2,0],[2,0,1]];
  for(const permutation of directions){
   const assignment={...BASE_TASK_SLOTS};
   for(let i=0;i<subset.length;i++)assignment[subset[i]]=BASE_TASK_SLOTS[subset[permutation[i]]];
   if(!NORMAL_MODELS.every(id=>allowed(id,assignment[id])))continue;
   const bonusSlots=includeBonus?
    SLOTS.filter(slot=>!Object.values(assignment).includes(slot.id)&&allowed("bonus",slot.id)).map(slot=>slot.id):
    [null];
   // Each valid bonus location is a separate equiprobable outcome.
   for(const bonusSlot of bonusSlots)candidates.push({subset:[...subset],assignment,bonusSlot});
  }
 }
 return candidates;
}
function obstacleVariantCount(moves){
 // Choose moved baseline obstacle(s), then assign distinct free O slots.
 let choices=1,places=1;
 for(let i=0;i<moves;i++){choices=choices*(BASE_OBSTACLE_SLOTS.length-i)/(i+1);places*=OBSTACLE_SLOTS.length-BASE_OBSTACLE_SLOTS.length-i;}
 return Math.round(choices*places);
}
/** Count the finite number of possible arrangements under current constraints. */
export function countLayoutVariants({level="medium",wallMode="normal",includeBonus=false,approved={},verifiedOnly=false,approvals={}}={}){
 const preset=LEVELS.find(x=>x.id===level);
 if(!preset)throw Error("Bảng thi không hợp lệ.");
 if(!WALL_MODES.some(x=>x.id===wallMode))throw Error("Chế độ đảo Tường Thành không hợp lệ.");
 const wallStates=wallMode==="random"?[false,true]:[wallMode==="reversed"];
 const taskCount=wallStates.reduce((sum,wallReversed)=>sum+taskCandidates({
  preset,wallReversed,includeBonus,approved,verifiedOnly,approvals
 }).length,0);
 return taskCount*obstacleVariantCount(preset.moveObstacles);
}
/** Same seed + same options always recreates the same board. */
export function buildRandomLayout(options={}){
 if(options.algorithmVersion===1)return buildLegacyRandomLayout(options);
 if(options.allowWhiteSlots&&options.algorithmVersion!==2)return buildExpandedLayout(options);
 const {level="medium",seed="DEMO",includeBonus=false,wallMode="normal",
  approved={},verifiedOnly=false,approvals={}}=options;
 const preset=LEVELS.find(x=>x.id===level);
 if(!preset)throw Error("Bảng thi không hợp lệ.");
 let wallReversed=resolveWallReversed(wallMode,seed);
 let candidates=taskCandidates({preset,wallReversed,includeBonus,approved,verifiedOnly,approvals});
 // In strict mode, random wall orientation must choose from actually verified
 // orientations, rather than failing on half of otherwise valid seeds.
 if(!candidates.length&&wallMode==="random"&&verifiedOnly){
  const alternate=taskCandidates({preset,wallReversed:!wallReversed,includeBonus,approved,verifiedOnly,approvals});
  if(alternate.length){wallReversed=!wallReversed;candidates=alternate;}
 }
 if(!candidates.length)throw Error(verifiedOnly?
  "Chưa có đủ cấu hình vị trí và hướng đã kiểm nghiệm cho đúng số nhiệm vụ cần đổi. Hãy xác nhận thêm cấu hình trên sa bàn thật.":
  "Không tìm được hoán đổi nhiệm vụ hợp lệ. Hãy kiểm tra các hướng/vị trí.");
 // Independently seeded streams: mission filtering never skews obstacle choices.
 const taskRng=seeded(String(seed)+"|missions-v2");
 const obstacleRng=seeded(String(seed)+"|obstacles-v2");
 const selected=candidates[Math.floor(taskRng()*candidates.length)];
 const {subset,assignment,bonusSlot}=selected;
 const tasks=NORMAL_MODELS.map(id=>{
  const slot=assignment[id],angle=SLOTS.find(x=>x.id===slot).approach;
  return id==="wall"?{id,slot,angle,reversed:wallReversed,modelRotation:wallReversed?180:0}:{id,slot,angle};
 });
 if(includeBonus){
  const slot=SLOTS.find(x=>x.id===bonusSlot);
  tasks.push({id:"bonus",slot:slot.id,angle:slot.approach});
 }
 const movable=shuffled([...BASE_OBSTACLE_SLOTS],obstacleRng).slice(0,preset.moveObstacles);
 const free=shuffled(OBSTACLE_SLOTS.map(x=>x.id).filter(id=>!BASE_OBSTACLE_SLOTS.includes(id)),obstacleRng);
 const obstacles=[...BASE_OBSTACLE_SLOTS];
 for(let i=0;i<movable.length;i++)obstacles[BASE_OBSTACLE_SLOTS.indexOf(movable[i])]=free[i];
 return {
  id:"layout-"+Date.now().toString(36),version:4,generatorVersion:2,
  level:preset.id,seed:String(seed),wallMode,wallReversed,tasks,obstacles,
  changeRules:{swapTasks:preset.swapTasks,moveObstacles:preset.moveObstacles},
  changedTaskIds:[...subset],movedObstacleFrom:[...movable],
  created:new Date().toISOString(),official:false,
  placementStatus:verifiedOnly?"physically-reviewed":"simulation",verifiedOnly,
  note:"Quy tắc V+: đổi "+preset.swapTasks+" nhiệm vụ, đổi "+preset.moveObstacles+
   " vị trí vật cản; tổng 7 nhiệm vụ và 3 vật cản. Tường Thành giữ ô gốc khi không đảo. Bản đồ gốc cần được xác nhận trên sa bàn thật."
 };
}

/**
 * V3: change precisely N task positions while allowing verified-size compact
 * tasks at WHITE slots as well as purple slots. Obstacle positions also use
 * white cells. Refuse geometrically overlapping or route-blocking proposals.
 */
export function assessLayoutSafety(layout,{robotCm=MAX_ROBOT_CM,marginCm=SAFETY_MARGIN_CM}={}){
 const rectangles=[];
 for(const t of layout.tasks||[]){
  const slot=SLOTS.find(s=>s.id===t.slot);
  if(!slot)return {ok:false,reason:"unknown-task-slot",items:[t.slot],reachedGates:[]};
  const kind=MODEL_META[t.id]?.footprint||"normal";
  rectangles.push({...rectangleFromSlot(slot,FOOTPRINT_CM[kind]||FOOTPRINT_CM.normal),id:"task:"+t.id});
 }
 for(const obstacleId of layout.obstacles||[]){
  const slot=OBSTACLE_SLOTS.find(s=>s.id===obstacleId);
  if(!slot)return {ok:false,reason:"unknown-obstacle-slot",items:[obstacleId],reachedGates:[]};
  rectangles.push({...rectangleFromSlot(slot,FOOTPRINT_CM.obstacle),id:"obstacle:"+obstacleId});
 }
 return checkNavigation(rectangles,{robotCm,marginCm});
}
function buildExpandedLayout({level="medium",seed="DEMO",includeBonus=false,wallMode="normal",
 approved={},verifiedOnly=false,approvals={},robotCm=MAX_ROBOT_CM}={}){
 const preset=LEVELS.find(x=>x.id===level);
 if(!preset)throw Error("Bảng thi không hợp lệ.");
 const reversed=resolveWallReversed(wallMode,seed);
 const base=SLOTS.filter(x=>x.edge!=="white");
 const allowed=(id,slot)=>{
  if(!validPlacement(id,slot.id,slot.approach,approved))return false;
  return !verifiedOnly||approvals[placementKey(id,slot.id,slot.approach,id==="wall"&&reversed)]===true;
 };
 const rng=seeded(String(seed)+"|expanded-physical-v3");
 const pool=NORMAL_MODELS.filter(x=>x!=="wall");
 const MAX_PLANS=250;
 for(let attempt=0;attempt<MAX_PLANS;attempt++){
  const selected=shuffled(pool,rng).slice(0,preset.swapTasks);
  const assignment={...BASE_TASK_SLOTS};
  const locked=new Set(NORMAL_MODELS.filter(id=>!selected.includes(id)).map(id=>assignment[id]));
  let solved=false;
  // Randomized backtracking for the selected task subset, without replacement.
  const recurse=(index,used)=>{
   if(index===selected.length)return true;
   const id=selected[index];
   // Compact models can move to white reference marks; wide models remain in
   // their documented purple-area placement family until physically approved.
   const positions=shuffled(SLOTS.filter(slot=>slot.id!==BASE_TASK_SLOTS[id]&&
    !used.has(slot.id)&&allowed(id,slot)),rng);
   for(const slot of positions){
    assignment[id]=slot.id;used.add(slot.id);
    if(recurse(index+1,used))return true;
    used.delete(slot.id);
   }
   assignment[id]=BASE_TASK_SLOTS[id];return false;
  };
  solved=recurse(0,new Set(locked));
  if(!solved)continue;
  const tasks=NORMAL_MODELS.map(id=>{
   const slot=SLOTS.find(x=>x.id===assignment[id]);
   const original={id,slot:slot.id,angle:slot.approach};
   return id==="wall"?{...original,reversed,modelRotation:reversed?180:0}:original;
  });
  if(includeBonus){
   const occupied=new Set(tasks.map(t=>t.slot));
   const options=shuffled(SLOTS.filter(slot=>!occupied.has(slot.id)&&allowed("bonus",slot)),rng);
   if(!options.length)continue;
   const slot=options[0];tasks.push({id:"bonus",slot:slot.id,angle:slot.approach});
  }
  const movable=shuffled([...SAFE_BASE_OBSTACLE_SLOTS],rng).slice(0,preset.moveObstacles);
  const free=shuffled(OBSTACLE_SLOTS.map(x=>x.id).filter(id=>!SAFE_BASE_OBSTACLE_SLOTS.includes(id)),rng);
  const obstacles=[...SAFE_BASE_OBSTACLE_SLOTS];
  for(let i=0;i<movable.length;i++)obstacles[SAFE_BASE_OBSTACLE_SLOTS.indexOf(movable[i])]=free[i];
  const proposal={tasks,obstacles};
  const safety=assessLayoutSafety(proposal,{robotCm});
  if(!safety.ok)continue;
  return {
   id:"layout-"+Date.now().toString(36),version:4,generatorVersion:3,
   level:preset.id,seed:String(seed),wallMode,wallReversed:reversed,tasks,obstacles,
   changeRules:{swapTasks:preset.swapTasks,moveObstacles:preset.moveObstacles},
   changedTaskIds:[...selected],movedObstacleFrom:[...movable],
   created:new Date().toISOString(),official:false,placementStatus:verifiedOnly?"physically-reviewed":"simulation",
   verifiedOnly,allowWhiteSlots:true,
   navigation:{robotCm,marginCm:SAFETY_MARGIN_CM,clearanceCheck:"grid-3cm-v1",
    passed:true,reachedGates:[...safety.reachedGates]},
   note:"Bản luyện tập trên sa bàn 216 x 120 cm. Bộ lọc lưới 3 cm bảo toàn ít nhất một hành lang cho robot có bề ngang tối đa "+
     robotCm+" cm (với kích thước mô hình ước lượng). Phải đo kích thước mô hình và thử đường chạy thực tế."
  };
 }
 throw Error("Không tìm được đề bảo toàn lối đi cho robot "+robotCm+
  " cm trong "+MAX_PLANS+" phương án. Không lưu đề thiếu an toàn; cần đo lại mô hình hoặc bổ sung vị trí đặt đã xác minh.");
}
