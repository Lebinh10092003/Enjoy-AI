import test from "node:test";
import assert from "node:assert/strict";
import {CloudSync,CloudConflictError} from "../cloud-sync.mjs";
import {newInventionAttempt,newBattleSide,invScore,battleSideScore} from "../core.mjs";

const state={version:1,rounds:2,teams:[],invention:[],battles:[],layouts:[],placementApprovals:{},bonusEnabled:false,bonusDescription:""};
function makeFakeBackend(){
  let revision=0,remote=structuredClone(state);
  const requests=[];
  const fetchImpl=async(url,options={})=>{
    requests.push({url,method:options.method||"GET",body:options.body});
    if(url.includes("/auth/v1/token?grant_type=password"))
      return {ok:true,json:async()=>({access_token:"JWT",refresh_token:"REFRESH",expires_in:3600,user:{id:"00000000-0000-4000-8000-000000000001",email:"judge@example.org"}})};
    if(url.includes("/rest/v1/competition_members"))
      return {ok:true,json:async()=>[{role:"referee"}]};
    if(url.includes("/rest/v1/competition_state")&&(options.method||"GET")==="GET")
      return {ok:true,json:async()=>[{revision,data:remote}]};
    if(url.includes("/rest/v1/competition_state")&&options.method==="PATCH"){
      const expected=Number(url.match(/revision=eq\.(\d+)/)?.[1]);
      if(expected!==revision)return {ok:true,json:async()=>[]};
      const body=JSON.parse(options.body);
      if(body.revision!==revision+1)throw Error("Unexpected revision in test.");
      remote=body.data;revision++;return {ok:true,json:async()=>[{revision}]};
    }
    throw Error("Unexpected URL: "+url);
  };
  return {fetchImpl,requests,get revision(){return revision;},remote:()=>remote,bump:()=>revision++};
}
const config={url:"https://example.supabase.co",publishableKey:"sb_publishable_test",workspaceId:"main"};
test("New Invention and Battle attempts preselect smooth +40, retries deduct 10",()=>{
  const entry=newInventionAttempt("inv-1","team-1",1);
  const side=newBattleSide();
  assert.equal(entry.smooth,true);
  assert.equal(side.smooth,true);
  assert.equal(invScore(entry),40);
  assert.equal(battleSideScore(side),40);
  for(const [retries,points] of [[1,30],[2,20],[3,10],[4,0],[5,0]]){
    assert.equal(invScore({...entry,retries}),points);
    assert.equal(battleSideScore({...side,retries}),points);
  }
  assert.equal(invScore({...entry,smooth:false}),0,"Explicit denial must still yield zero.");
  assert.equal(battleSideScore({...side,smooth:false}),0,"Explicit denial must still yield zero.");
});
test("Cloud sign-in, load and optimistic revision save",async()=>{
  const fake=makeFakeBackend();
  const store=new Map();
  const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  const sync=new CloudSync(config,{fetchImpl:fake.fetchImpl,storage});
  assert.equal(sync.configured,true);
  assert.deepEqual(await sync.login("judge@example.org","secret"),state);
  assert.equal(sync.revision,0);
  const newState={...state,teams:[{id:"a"}]};
  sync.queue(newState);
  assert.equal(await sync.flush(),true);
  assert.equal(sync.revision,1);
  assert.deepEqual(fake.remote(),newState);
  assert.ok(fake.requests.find(x=>x.method==="PATCH").url.includes("revision=eq.0"));
  sync.signOut();
});
test("Cloud rejects concurrent write rather than overwriting another referee",async()=>{
  const fake=makeFakeBackend();
  const sync=new CloudSync(config,{fetchImpl:fake.fetchImpl,storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
  await sync.login("judge@example.org","secret");
  fake.bump(); // referee on another machine advanced revision
  sync.queue({...state,teams:[{id:"old"}]});
  assert.equal(await sync.flush(),false);
  assert.equal(sync.blocked,true);
  assert.equal(sync.status,"conflict");
  assert.ok(sync.pending);
  assert.rejects(()=>sync.retry(),CloudConflictError);
  sync.signOut();
});

test("Cloud connection diagnostic uses Auth health endpoint without login or secret",async()=>{
 const calls=[];
 const sync=new CloudSync(config,{storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  fetchImpl:async(url,options={})=>{
   calls.push({url,options});
   return {ok:true,json:async()=>({version:"2.0",name:"GoTrue"})};
  }});
 assert.deepEqual(await sync.checkConnection(),{reachable:true,service:"Supabase Auth"});
 assert.equal(calls.length,1);
 assert.match(calls[0].url,/\\/auth\\/v1\\/health$/);
 assert.ok(calls[0].options.headers.apikey);
 assert.equal(calls[0].options.headers.Authorization,undefined);
 assert.equal(sync.ready,false);
});
test("Cloud detects valid Auth user missing competition membership",async()=>{
 const fake=makeFakeBackend();
 const sync=new CloudSync(config,{fetchImpl:async(url,options)=>{
   if(url.includes("/rest/v1/competition_members"))return {ok:true,json:async()=>[]};
   return fake.fetchImpl(url,options);
  },storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
 await assert.rejects(sync.login("judge@example.org","test-password"),/chưa được cấp quyền/);
 assert.equal(sync.ready,false);
 assert.equal(sync.revision,null);
 sync.signOut();
});
test("Cloud provides useful error for invalid credentials and unconfirmed email",async()=>{
 const cases=[
  [{code:"invalid_credentials",message:"Invalid login credentials"},"email hoặc mật khẩu không đúng"],
  [{code:"email_not_confirmed",message:"Email not confirmed"},"Email chưa được xác nhận"]
 ];
 for(const [body,expected] of cases){
  const sync=new CloudSync(config,{fetchImpl:async()=>({ok:false,status:400,json:async()=>body}),
   storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
  await assert.rejects(sync.login("judge@example.org","invalid"),new RegExp(expected));
  assert.equal(sync.session,null);
 }
});
