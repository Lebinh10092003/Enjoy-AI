// Đồng bộ Supabase REST cho website thuần JavaScript (không cần build tool).
// Server sử dụng PostgreSQL RLS và revision CAS; localStorage chỉ là bản nháp/dự phòng.
export class CloudConflictError extends Error {
  constructor() { super("Dữ liệu Cloud đã được người khác cập nhật. Hãy xuất JSON của máy này rồi tải lại Cloud để đối chiếu."); this.name="CloudConflictError"; }
}
export class CloudSync {
  constructor(config={}, options={}) {
    this.url=String(config.url||"").replace(/\/+$/,"");
    this.key=String(config.publishableKey||"");
    this.workspace=String(config.workspaceId||"main");
    this.configured=/^https:\/\//.test(this.url)&&this.key.length>8&&/^[a-z0-9_-]{1,64}$/i.test(this.workspace);
    this.fetcher=options.fetchImpl||globalThis.fetch?.bind(globalThis);
    this.storage=options.storage||(typeof sessionStorage!=="undefined"?sessionStorage:null);
    this.onStatus=options.onStatus||(()=>{});
    this.session=null; this.revision=null; this.ready=false; this.pending=null;
    this.inFlight=null; this.timer=null; this.blocked=false; this.status="local";
    if(this.configured&&this.storage) {
      try { this.session=JSON.parse(this.storage.getItem("enjoy-ai-cloud-session-v1")||"null"); } catch { this.session=null; }
    }
  }
  emit(status,message="") { this.status=status; this.onStatus({status,message,revision:this.revision,ready:this.ready,email:this.session?.user?.email||""}); }
  storeSession(value) {
    this.session=value;
    try { if(value)this.storage?.setItem("enjoy-ai-cloud-session-v1",JSON.stringify(value));else this.storage?.removeItem("enjoy-ai-cloud-session-v1"); } catch {}
  }
  async parse(response) {
    let body=null;
    try { body=await response.json(); } catch { body=null; }
    if(!response.ok)throw Error(body?.msg||body?.message||body?.error_description||body?.error||("HTTP "+response.status));
    return body;
  }
  async request(path,options={},authenticated=true){
    const headers={"apikey":this.key,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})};
    if(authenticated)headers.Authorization="Bearer "+(await this.accessToken());
    return this.parse(await this.fetcher(this.url+path,{...options,headers}));
  }
  async accessToken(){
    if(!this.session?.access_token)throw Error("Chưa đăng nhập Cloud.");
    if(Date.now()<(this.session.expires_at||0)-60000)return this.session.access_token;
    const body=await this.request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:this.session.refresh_token})},false);
    this.storeSession({...body,expires_at:Date.now()+Number(body.expires_in||3600)*1000});
    return this.session.access_token;
  }
  async login(email,password){
    if(!this.configured)throw Error("Chưa cấu hình Cloud trong cloud-config.mjs.");
    const body=await this.request("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})},false);
    this.storeSession({...body,expires_at:Date.now()+Number(body.expires_in||3600)*1000});
    return this.load();
  }
  async load(){
    if(!this.session)throw Error("Chưa đăng nhập Cloud.");
    const path="/rest/v1/competition_state?select=data,revision,updated_at&id=eq."+encodeURIComponent(this.workspace)+"&limit=1";
    const result=await this.request(path);
    if(!Array.isArray(result)||result.length!==1)throw Error("Tài khoản chưa được cấp quyền hoặc chưa tạo competition_state trên Supabase.");
    this.revision=Number(result[0].revision);
    this.ready=true;this.blocked=false;this.pending=null;
    if(this.timer)clearTimeout(this.timer);this.timer=null;
    this.emit("saved","Đã tải dữ liệu Cloud.");
    return result[0].data;
  }
  queue(snapshot){
    if(!this.configured||!this.ready||!this.session)return;
    this.pending=JSON.parse(JSON.stringify(snapshot));
    this.emit("pending","Có thay đổi chưa đồng bộ.");
    if(!this.blocked)this.schedule();
  }
  schedule(){
    if(this.timer)clearTimeout(this.timer);
    this.timer=setTimeout(()=>{this.timer=null;void this.flush();},350);
  }
  async flush(){
    if(this.inFlight)return this.inFlight;
    if(!this.ready||!this.pending||this.blocked)return false;
    const snapshot=this.pending;this.pending=null;
    this.emit("syncing","Đang ghi lên Cloud...");
    this.inFlight=(async()=>{
      try{
        const path="/rest/v1/competition_state?id=eq."+encodeURIComponent(this.workspace)+"&revision=eq."+this.revision+"&select=revision";
        const next=this.revision+1;
        const response=await this.request(path,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({data:snapshot,revision:next})});
        if(!Array.isArray(response)||response.length!==1)throw new CloudConflictError();
        this.revision=Number(response[0].revision);
        this.emit(this.pending?"pending":"saved",this.pending?"Đang chờ ghi tiếp...":"Đã đồng bộ Cloud.");
        return true;
      }catch(error){
        if(!this.pending)this.pending=snapshot;
        this.blocked=error instanceof CloudConflictError;
        this.emit(this.blocked?"conflict":"error",error.message);
        return false;
      }finally{
        this.inFlight=null;
        if(this.pending&&!this.blocked&&this.status!=="error")this.schedule();
      }
    })();
    return this.inFlight;
  }
  async retry(){
    if(this.blocked)throw new CloudConflictError();
    if(!this.pending)return true;
    return this.flush();
  }
  async refresh(){
    if(this.inFlight||this.pending)throw Error("Còn dữ liệu chưa đồng bộ. Hãy sao lưu JSON và giải quyết trước khi tải dữ liệu Cloud.");
    return this.load();
  }
  signOut(){
    if(this.timer)clearTimeout(this.timer);
    this.storeSession(null);this.ready=false;this.pending=null;this.revision=null;this.blocked=false;
    this.emit("local","Đã đăng xuất. Mọi thay đổi tiếp theo chỉ lưu trên máy.");
  }
}
