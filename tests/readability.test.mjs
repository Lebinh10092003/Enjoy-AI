import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../readable-2026.css",import.meta.url),"utf8");

function block(text,selector){
 const escaped=selector.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const found=text.match(new RegExp(escaped+"\\s*\\{([^}]*)\\}"));
 assert.ok(found,"Expected selector "+selector);
 return found[1];
}
function prop(rule,name){
 const m=rule.match(new RegExp("(?:^|;)\\s*"+name+"\\s*:\\s*([^;]+)"));
 assert.ok(m,"Missing "+name+" in "+rule);
 return m[1].trim();
}
test("Readable typography stylesheet loads last and declares responsive overrides",()=>{
 assert.match(html,/readable-2026\\.css\\?v=20261102-typography-v1/);
 assert.ok(html.indexOf("vplus-scoreboard.css")<html.indexOf("readable-2026.css"));
 assert.match(css,/@media screen and \\(max-width:760px\\)/);
 assert.match(css,/@media screen and \\(max-width:390px\\)/);
 assert.match(css,/@media screen and \\(max-width:1150px\\)/);
});
test("Readable UI has body text 16px, controls 16px, table cells >= 14px",()=>{
 assert.equal(prop(block(css,"body"),"font-size"),"16px");
 assert.equal(prop(block(css,".field input,.field select,.field textarea,.single-team-form-body .field input"),"font-size"),"16px");
 assert.equal(prop(block(css,".field input,.field select,.field textarea"),"font-size"),"16px");
 assert.equal(prop(block(css,".table td"),"font-size"),"15px");
 assert.equal(prop(block(css,".scoreboard-table"),"font-size"),"15px");
 assert.equal(prop(block(css,".dashboard-hero p"),"font-size"),"16px");
});
test("Large font does not resize absolute overlay labels on the arena",()=>{
 assert.ok(!/\\.mission-marker\\s+\\.marker-info.*font-size:/s.test(css));
 assert.ok(!/\\.obstacle-label\\s*\\{[^}]*font-size:/s.test(css));
 assert.match(css,/Do not enlarge absolute-positioned marker labels/);
});
test("Cloud form, random toolbar, mobile tables and accessibility are addressed",()=>{
 for(const selector of [".cloud-panel .form-grid",".studio-config-panel .action-row>.btn",
   ".table-wrap,.scoreboard-table-wrap",".scoreboard-mobile-main strong",
   ".studio-config-panel .check-pill small"]){
   assert.ok(css.includes(selector+"{"),"Missing "+selector);
 }
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/min-height:46px/);
 assert.match(css,/font-size:16px;min-height:48px/);
});
test("CSS structure is balanced for braces and quoted strings",()=>{
 let depth=0,quote=null,comment=false;
 for(let i=0;i<css.length;i++){
  if(comment){if(css[i]==="*"&&css[i+1]==="/"){comment=false;i++;}continue;}
  if(!quote&&css[i]==="/"&&css[i+1]==="*"){comment=true;i++;continue;}
  if(css[i]==="\\"&&quote){i++;continue;}
  if(css[i]==='"'||css[i]==="'"){if(!quote)quote=css[i];else if(quote===css[i])quote=null;continue;}
  if(quote)continue;
  if(css[i]==="{")depth++;
  if(css[i]==="}"){depth--;assert.ok(depth>=0);}
 }
 assert.equal(depth,0);
 assert.equal(quote,null);
 assert.equal(comment,false);
});
