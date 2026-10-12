import test from "node:test";
import assert from "node:assert/strict";
import {parseSeconds,displaySeconds} from "../time-utils.mjs";
import {parseCsv,validateTeamImport,teamImportTemplate} from "../team-import.mjs";
import {renderInventionLeaderboard,renderBattleLeaderboard} from "../leaderboard-ui.mjs";
import {initialData,generateLayout} from "../core.mjs";
import {placementKey} from "../placement.mjs";

test("Robot times accept decimal period, comma and Vietnamese suffix without truncating",()=>{
 for(const source of ["13.5","13,5","13,5s","13.5 s","13,5 giây","13.5sec"]){
  assert.equal(parseSeconds(source,150),13.5,source);
 }
 assert.equal(parseSeconds("150",150),150);
 assert.equal(parseSeconds("179,875s",180),179.875);
 assert.equal(parseSeconds("",150),null);
 assert.equal(displaySeconds(13.5),"13,5");
 for(const invalid of ["13,5,6","x13","13s junk","151","-1","0","1.1234","1 2"]){
  assert.throws(()=>parseSeconds(invalid,150),undefined,invalid);
 }
});

test("CSV parser handles BOM, semicolon, quoted comma and quoted newline",()=>{
 const text='\uFEFFcode;name;division;member1;member2;coach\n"A-01";"Đội, X";p13;"Bạn, A";"Bạn B";"Thầy\nBình"\n';
 const out=parseCsv(text);
 assert.equal(out.length,1);
 assert.equal(out[0].name,"Đội, X");
 assert.equal(out[0].coach,"Thầy\nBình");
});

test("CSV and JSON imports validate each team and avoid overwriting existing",()=>{
 const json=teamImportTemplate("invention","json");
 const csv=teamImportTemplate("battle","csv");
 const a=validateTeamImport(json,"json","invention",[]);
 const b=validateTeamImport(csv,"csv","battle",[]);
 assert.equal(a.teams.length,1);
 assert.equal(b.teams.length,1);
 assert.equal(a.teams[0].division,"p13");
 assert.equal(b.teams[0].division,"primary");
 assert.equal(a.teams[0].member2,"Học sinh B");
 const existing=[{...a.teams[0],id:"PRESERVE",name:"Đội mẫu 01"}];
 const duplicate=validateTeamImport(json,"json","invention",existing);
 assert.equal(duplicate.teams.length,0);
 assert.equal(duplicate.skipped.length,1);
 assert.equal(existing[0].id,"PRESERVE");
 const errors=validateTeamImport(JSON.stringify([{name:"Sai bảng",division:"foo",member1:"A",member2:"B",coach:"C"}]),"json","invention");
 assert.equal(errors.teams.length,0);
 assert.equal(errors.errors.length,1);
 assert.equal(validateTeamImport(JSON.stringify({teams:JSON.parse(json)}),"json","invention").teams.length,1);
 assert.equal(validateTeamImport(json,"json","battle").errors.length,1);
});

test("Leaderboards include general and category tabs, with no global cross-division rank",()=>{
 const d=initialData();
 d.teams=[
  {id:"t1",type:"invention",name:"Đội 1",division:"p13",school:"Trường A"},
  {id:"t2",type:"invention",name:"Đội 2",division:"m79",school:"Trường B"},
  {id:"b1",type:"battle",name:"Đội Battle",division:"primary",group:"A"}
 ];
 d.invention=[
  {teamId:"t1",round:1,time:13.5,retries:0,smooth:false,status:"done",tasks:{compass:true}},
  {teamId:"t2",round:1,time:13.75,retries:0,smooth:false,status:"done",tasks:{compass:true}}
 ];
 const all=renderInventionLeaderboard(d,"all");
 assert.match(all,/role="tablist"/);
 assert.match(all,/Tổng quan/);
 assert.match(all,/Tiểu học khối nhỏ/);
 assert.match(all,/THCS/);
 assert.match(all,/13,5/);
 assert.match(all,/13,75/);
 const one=renderInventionLeaderboard(d,"p13");
 assert.match(one,/aria-selected="true" class="lb-tab is-selected"/);
 assert.match(one,/Đội 1/);
 assert.doesNotMatch(one,/Đội 2/);
 const battle=renderBattleLeaderboard(d,"all");
 assert.match(battle,/Bảng xếp hạng Battle/);
 assert.match(battle,/role="tablist"/);
 assert.match(battle,/Vòng loại trực tiếp/);
});

test("Strict placement mode rejects untested configurations, then accepts verified arrangements",()=>{
 const options={seed:"VPLUS-PHYSICAL-VERIFICATION",level:"medium",wallMode:"reversed"};
 assert.throws(()=>generateLayout({...options,verifiedOnly:true,approvals:{}}),/Chưa có đủ cấu hình/);
 const trial=generateLayout(options);
 const approvals=Object.fromEntries(trial.tasks.map(t=>[placementKey(t.id,t.slot,t.angle,t.reversed),true]));
 const reviewed=generateLayout({...options,verifiedOnly:true,approvals});
 assert.equal(reviewed.verifiedOnly,true);
 assert.equal(reviewed.placementStatus,"physically-reviewed");
 assert.deepEqual(reviewed.tasks,trial.tasks);
 assert.equal(reviewed.obstacles.length,3);
 const withoutOne={...approvals};delete withoutOne[placementKey(trial.tasks[0].id,trial.tasks[0].slot,trial.tasks[0].angle,trial.tasks[0].reversed)];
 assert.throws(()=>generateLayout({...options,verifiedOnly:true,approvals:withoutOne}),/Chưa có đủ cấu hình/);
});
