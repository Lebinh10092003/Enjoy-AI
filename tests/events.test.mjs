import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {JSDOM} from "jsdom";

test("Local event manager migrates the old workspace and isolates new event data", async()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const dom=new JSDOM(html,{url:"https://example.org/Enjoy-AI/"});
  const legacy={
    version:1,rounds:2,
    teams:[{id:"legacy-team",type:"invention",code:"L-001",name:"Legacy Team",school:"School",
      division:"p13",member1:"Student A",member2:"Student B",coach:"Coach",note:""}],
    invention:[],battles:[],layouts:[],boardSlots:[],placementApprovals:{},
    bonusEnabled:false,bonusDescription:""
  };
  dom.window.localStorage.setItem("enjoy-ai-2026-competition-desk-v1",JSON.stringify(legacy));
  dom.window.scrollTo=()=>{};
  globalThis.window=dom.window;
  globalThis.document=dom.window.document;
  globalThis.localStorage=dom.window.localStorage;
  globalThis.sessionStorage=dom.window.sessionStorage;
  globalThis.FileReader=dom.window.FileReader;

  await import("../app.mjs?events-test=20261108");
  const q=selector=>dom.window.document.querySelector(selector);
  const click=selector=>{const element=q(selector);assert.ok(element,"Missing "+selector);element.click();};
  const submit=async selector=>{
    const form=q(selector);assert.ok(form,"Missing "+selector);
    form.dispatchEvent(new dom.window.Event("submit",{bubbles:true,cancelable:true}));
    await new Promise(resolve=>setImmediate(resolve));
  };

  assert.ok(q("#event-toolbar"),"The event toolbar should be visible");
  const originalId=q("#event-select").value;
  assert.equal(originalId,"local-main");
  click('[data-page="teams-invention"]');
  assert.match(q("#content").textContent,/Legacy Team/,"The old single-workspace data must be migrated intact");

  click("#create-event");
  assert.ok(q("#create-event-form"));
  q("#event-name").value="ENJOY AI V+ 2027";
  q("#event-season").value="2027";
  q("#event-date").value="2027-03-20";
  q("#event-venue").value="V+ STEAM LAB";
  await submit("#create-event-form");

  const newId=q("#event-select").value;
  assert.notEqual(newId,originalId);
  assert.equal(q("#event-select").options.length,2);
  assert.match(q("#content").textContent,/Chưa có đội thi/,"A new event must start with an empty roster");

  click("[data-open-team-form]");
  q("#team-name").value="New Event Team";
  q("#team-member1").value="Student 1";
  q("#team-member2").value="Student 2";
  q("#team-coach").value="Coach New";
  await submit("#add-team");

  const storedNew=JSON.parse(localStorage.getItem("enjoy-ai-2026-competition-desk-v1-event-"+newId));
  assert.equal(storedNew.teams.length,1);
  assert.equal(storedNew.teams[0].name,"New Event Team");

  q("#event-select").value=originalId;
  q("#event-select").dispatchEvent(new dom.window.Event("change",{bubbles:true}));
  assert.equal(q("#event-select").value,originalId);
  assert.match(q("#content tbody").textContent,/Legacy Team/);
  assert.doesNotMatch(q("#content tbody").textContent,/New Event Team/);

  q("#event-select").value=newId;
  q("#event-select").dispatchEvent(new dom.window.Event("change",{bubbles:true}));
  assert.equal(q("#event-select").value,newId);
  assert.match(q("#content tbody").textContent,/New Event Team/);
  assert.doesNotMatch(q("#content tbody").textContent,/Legacy Team/);

  dom.window.close();
});
