import test from "node:test";
import assert from "node:assert/strict";
import {TASKS,initialData,invScore,invRank,scoreRetry,battleSideScore,battleEligible,validateBattleSide,battleOutcome,battleRanking,generateLayout} from "../core.mjs";
test("Invention task score: 390 points plus 40 continuous bonus",()=>{
 const tasks=Object.fromEntries(TASKS.filter(t=>!t.optional).map(t=>[t.id,true]));
 assert.equal(invScore({tasks,retries:0,smooth:true,status:"done"}),430);
 assert.equal(invScore({tasks,retries:0,smooth:true,status:"done"},true),430);
 assert.equal(invScore({tasks:{...tasks,bonus:true},retries:0,smooth:true,status:"done"},true),530);
 assert.equal(invScore({tasks:{},retries:0,smooth:false,status:"done"}),0);
 assert.equal(invScore({tasks,retries:0,smooth:true,status:"invalid"}),0);
});
test("Retry bonuses respect rule 6.3",()=>{
 assert.deepEqual([0,1,2,3,4,5].map(x=>scoreRetry(x,true)),[40,30,20,10,0,0]);
 assert.equal(scoreRetry(0,false),0);
});
test("Invention overall ranking: points, time, retries, best",()=>{
 const teams=[{id:"a",name:"A",type:"invention",division:"p13"},{id:"b",name:"B",type:"invention",division:"p13"}];
 const attempts=[{teamId:"a",round:1,time:120,retries:0,smooth:false,status:"done",tasks:{compass:true}},{teamId:"b",round:1,time:100,retries:0,smooth:false,status:"done",tasks:{compass:true}}];
 const ranks=invRank(teams,attempts,2,false);
 assert.equal(ranks[0].id,"b");
 assert.equal(ranks[1].points,50);
 assert.equal(ranks[0].byRound[1],null);
});
test("Battle: scores, violations and immediate win require all conditions",()=>{
 const r={tower:true,blocks:5,bins:[2,2,0,0],retries:1,fouls:1,smooth:false};
 assert.equal(battleSideScore(r),100+50+60+30-10);
 assert.equal(battleEligible(r),true);
 assert.equal(battleEligible({...r,blocks:4}),false);
 assert.ok(validateBattleSide({...r,fouls:2}).includes("chạy lại"));
 assert.ok(validateBattleSide({...r,bins:[3,3,3,0]}).includes("8 bóng"));
 const m={status:"done",stage:"group",redId:"a",blueId:"b",red:{...r,instant:true},blue:{tower:false,blocks:8,bins:[4,4,0,0],retries:0,smooth:true}};
 assert.deepEqual(battleOutcome(m),{winner:"a",kind:"instant"});
});
test("Battle preliminaries: tied points are resolved by tower",()=>{
 const m={status:"done",stage:"group",redId:"a",blueId:"b",red:{tower:true,blocks:0,bins:[0,0,0,0],retries:0,smooth:false},blue:{tower:false,blocks:8,bins:[0,0,0,0],retries:0,smooth:false}};
 assert.equal(battleOutcome(m).winner,"a");
});
test("Battle knockouts retain unresolved tiebreaker instead of fabricating winner",()=>{
 const m={status:"done",stage:"final",redId:"a",blueId:"b",red:{tower:false,blocks:0,bins:[0,0,0,0],retries:0,smooth:false},blue:{tower:false,blocks:0,bins:[0,0,0,0],retries:0,smooth:false}};
 assert.equal(battleOutcome(m).kind,"tiebreak");
});
test("Battle standings score 3-1-0 in group",()=>{
 const teams=[{id:"a",name:"A",type:"battle",division:"primary",group:"A"},{id:"b",name:"B",type:"battle",division:"primary",group:"A"}];
 const games=[{status:"done",stage:"group",redId:"a",blueId:"b",red:{tower:true,blocks:0,bins:[0,0,0,0],retries:0,smooth:false},blue:{tower:false,blocks:0,bins:[0,0,0,0],retries:0,smooth:false}}];
 const rank=battleRanking(teams,games);
 assert.equal(rank[0].id,"a");assert.equal(rank[0].points,3);assert.equal(rank[1].points,0);
});
test("Seeded random generation is reproducible and has no overlapping tasks/obstacles",()=>{
 const x=generateLayout({seed:"FLL-2026",level:"expert",includeBonus:true});
 const y=generateLayout({seed:"FLL-2026",level:"expert",includeBonus:true});
 assert.deepEqual(x.tasks,y.tasks);
 assert.deepEqual(x.obstacles,y.obstacles);
 const all=[...x.tasks.map(a=>a.slot),...x.obstacles];
 assert.equal(new Set(all).size,all.length);
 assert.equal(x.tasks.length,8);
});
test("Initial settings are safe",()=>{const x=initialData();assert.equal(x.rounds,2);assert.equal(x.bonusEnabled,false);});