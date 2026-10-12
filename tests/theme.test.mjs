import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const theme=readFileSync(new URL("../vplus-2026.css",import.meta.url),"utf8");
const enhanced=readFileSync(new URL("../vplus-2026.css",import.meta.url),"utf8");

test("V+ theme is loaded after the base stylesheet",()=>{
 const base=html.indexOf("./styles.css");
 const blue=html.indexOf("./vplus-2026.css");
 assert.ok(base>=0,"Expected the base CSS link");
 assert.ok(blue>base,"V+ design system must follow core styles");
});

test("V+ interface has readable typography and responsive improvements",()=>{
 for(const selector of [":root", ".sidebar", ".nav-button", ".panel", ".btn", ".field label", ".table th",
  ".mission-marker", ".arena-board.real-arena", ".random-inline-status"]){
   assert.ok(theme.includes(selector),"Required styled element: "+selector);
 }
 for(const rule of ["--vp-blue-800", "--vp-bg", "@media(max-width:760px)", "@media(max-width:390px)",
  "@media(prefers-reduced-motion:reduce)", "@media print", "@keyframes vpMissionEnter"]){
  assert.ok(theme.includes(rule),"Required accessibility/responsive rule: "+rule);
 }
 assert.ok(!theme.includes("scrollTo("),"Visual layer must never control page scrolling");
});

test("CSS rules have balanced block delimiters",()=>{
 const stripped=theme.replace(/\/\*[\s\S]*?\*\//g,"");
 let nesting=0;
 let inQuote="";
 for(let i=0;i<stripped.length;i++){
  const char=stripped[i];
  if(inQuote){if(char===inQuote&&stripped[i-1]!=="\\")inQuote="";continue;}
  if(char==='"'||char==="'"){inQuote=char;continue;}
  if(char==="{")nesting++;
  if(char==="}"){nesting--;assert.ok(nesting>=0,"Unexpected closing brace at position "+i);}
 }
 assert.equal(inQuote,"","Unclosed CSS string");
 assert.equal(nesting,0,"Unbalanced CSS blocks");
});

test("Scoreboard styles respect accessible reduced motion and mobile tables",()=>{
 assert.match(html,/vplus-2026\.css/);
 assert.match(enhanced,/prefers-reduced-motion:reduce/);
 assert.match(enhanced,/\.leaderboard-tabs/);
 assert.match(enhanced,/\.team-import-panel/);
 assert.match(enhanced,/@media\(max-width:760px\)/);
});

test("New workspace exposes real app navigation and unique random workbench",()=>{
 assert.match(html,/class="brand-emblem"/);
 assert.match(html,/class="nav-icon"/);
 assert.match(theme,/\.dashboard-hero/);
 assert.match(theme,/\.studio-layout/);
 assert.match(theme,/\.dashboard-metrics/);
 assert.match(theme,/\.brand-emblem \.brand-logo-image/);
});
