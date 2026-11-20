const $ = id => document.getElementById(id);
const KEY="registroLabores.v2", PREF="registroLabores.pref", DIAS="registroLabores.dias";
let mem={};
function getLS(k,def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):(mem[k]??def); }catch(e){ return mem[k]??def; } }
function setLS(k,v){ mem[k]=v; try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
const load=()=>getLS(KEY,[]), save=a=>setLS(KEY,a);
function pref(k,v){ const p=getLS(PREF,{}); if(v===undefined) return p[k]; p[k]=v; setLS(PREF,p); }

const hoy=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);};
const fmt=(n,d=1)=>isFinite(n)?n.toLocaleString("es-CO",{maximumFractionDigits:d,minimumFractionDigits:d}):"—";
const esc=t=>String(t??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fincaObj=n=>CONFIG.FINCAS.find(f=>f.nombre===n);
const todas=()=>Object.values(CONFIG.LABORES).flat();
const laborObj=c=>todas().find(l=>l.c===c);
const optList=(sel,items,ph)=>{ sel.innerHTML=(ph!==undefined?`<option value="">${ph}</option>`:"")+items.map(i=>`<option>${esc(i)}</option>`).join(""); };
function optLabores(sel,labs,ph){
  labs=[...labs].sort((a,b)=>(/99$/.test(a.c)-/99$/.test(b.c))||a.n.localeCompare(b.n,"es",{sensitivity:"base"}));
  sel.innerHTML=`<option value="">${ph}</option>`+labs.map(l=>`<option value="${l.c}">${esc(l.n)}</option>`).join("");
}
function horas(ini,fin,pausa){ if(!ini||!fin) return 0; const[a,b]=ini.split(":").map(Number),[c,d]=fin.split(":").map(Number); const m=(c*60+d)-(a*60+b)-(Number(pausa)||0); return m>0?m/60:0; }
const semaforo=p=>!isFinite(p)?"":p>=90?"ok":p>=70?"mid":"bad";

/* ---------- Datos del día (uno por finca y fecha) ---------- */
const diaKey=()=>$("fecha").value+"|"+$("finca").value;
function guardarDia(){
  const d=getLS(DIAS,{});
  d[diaKey()]={lider:$("lider").value,lluvia:$("lluvia").value,llovio:$("llovio").value,rangos:rangosLluvia(),nov:$("novDia").value};
  setLS(DIAS,d);
}
function cargarDia(){
  const x=getLS(DIAS,{})[diaKey()]||{};
  const ff=fincaObj($("finca").value);
  if(ff&&ff.lider) $("lider").value=ff.lider; else if(x.lider) $("lider").value=x.lider;
  $("lluvia").value=x.lluvia??""; $("novDia").value=x.nov??"";
  $("llovio").value=x.llovio||"";
  const rg=x.rangos&&x.rangos.length?x.rangos:[{desde:x.desde||"",hasta:x.hasta||""}];
  $("lluRangos").innerHTML=""; rg.forEach(r=>agregarRango(r.desde,r.hasta)); onLlovio();
}
["lider","lluvia","novDia"].forEach(id=>$(id).addEventListener("input",guardarDia));
$("lider").addEventListener("change",()=>{ if($("finca").value) pref("lider_"+$("finca").value,$("lider").value); });
function horasLista(){ const a=[]; for(let m=5*60;m<=20*60;m+=30){ a.push(String(Math.floor(m/60)).padStart(2,"0")+":"+(m%60?"30":"00")); } return a; }
function fmtHora(t){ const[h,m]=t.split(":").map(Number); return ((h+11)%12+1)+":"+String(m).padStart(2,"0")+(h<12?" a. m.":" p. m."); }
function agregarRango(d,hh){
  const ops='<option value="">—</option>'+horasLista().map(t=>`<option value="${t}">${fmtHora(t)}</option>`).join("");
  const n=$("lluRangos").children.length;
  const div=document.createElement("div"); div.className="row lluRango"; div.style.alignItems="end";
  div.innerHTML=`<div><label>Llovió desde</label><select class="lluD">${ops}</select></div>
    <div><label>Hasta ${n?`<a href="#" class="lluX" style="float:right;color:var(--red);text-decoration:none">✕ Quitar</a>`:""}</label><select class="lluH">${ops}</select></div>`;
  div.querySelector(".lluD").value=d||""; div.querySelector(".lluH").value=hh||"";
  div.querySelectorAll("select").forEach(s=>s.addEventListener("change",guardarDia));
  const x=div.querySelector(".lluX"); if(x) x.addEventListener("click",e=>{ e.preventDefault(); div.remove(); guardarDia(); });
  $("lluRangos").appendChild(div);
}
function rangosLluvia(){ return [...document.querySelectorAll(".lluRango")].map(r=>({desde:r.querySelector(".lluD").value,hasta:r.querySelector(".lluH").value})); }
$("btnLluMas").addEventListener("click",()=>{ agregarRango(); guardarDia(); });
agregarRango();
function onLlovio(){ $("lluviaHoras").classList.toggle("hide",$("llovio").value!=="Sí"); }
$("llovio").addEventListener("change",()=>{ onLlovio(); guardarDia(); });
$("fecha").addEventListener("change",cargarDia);

/* ---------- Formulario (varias labores por registro) ---------- */
let fechaAuto="";
function revisarFecha(){ const h=hoy(); if($("fecha").value===fechaAuto && fechaAuto!==h){ $("fecha").value=h; fechaAuto=h; cargarDia(); } }
document.addEventListener("visibilitychange",()=>{ if(!document.hidden) revisarFecha(); });
window.addEventListener("focus",revisarFecha); setInterval(revisarFecha,60000);
function initForm(){
  $("fecha").value=hoy(); fechaAuto=$("fecha").value;
  optList($("finca"),CONFIG.FINCAS.map(f=>f.nombre),"Seleccione la finca");
  const f=pref("finca"); if(f&&fincaObj(f)) $("finca").value=f;
  onFinca();
}
const cultivoActual=()=>{ const f=fincaObj($("finca").value); return f?f.cultivo:(CONFIG.FINCAS[0]||{}).cultivo; };
function onFinca(){
  const f=fincaObj($("finca").value);
  const todosOps=[...new Set(CONFIG.FINCAS.flatMap(x=>x.operarios))];
  optList($("operario"),[...(f?f.operarios:todosOps),"Contratista"],"Seleccione el operario");
  onOperario();
  if(f){ pref("finca",f.nombre); $("lider").value=f.lider||pref("lider_"+f.nombre)||""; }
  $("lider").readOnly=!!(f&&f.lider);
  reiniciarTareas("");
  cargarDia(); onNovedad();
}
function onOperario(){ const c=$("operario").value==="Contratista"; $("contBox").classList.toggle("hide",!c); if(!c) $("contNombre").value=""; }
$("operario").addEventListener("change",onOperario);
function trabaja(){ return !$("novedad").value || $("durNov").value==="parte"; }
function onNovedad(){
  $("durBox").classList.toggle("hide",!$("novedad").value);
  $("laborBox").classList.toggle("hide",!trabaja());
  $("obsBox").classList.toggle("hide",!$("novedad").value);
}
const SOLO_T="Solo tiempo (sin cantidad)";
const tarjetas=()=>[...document.querySelectorAll("#tareas .tarea")];
const q=(t,k)=>t.querySelector(`[data-k="${k}"]`);

function nuevaTarea(hIni){
  const f=fincaObj($("finca").value), ls=f?(f.lotes||[]):[];
  const t=document.createElement("div"); t.className="tarea";
  t.innerHTML=`
    <div class="tareaHead"><b class="tNum"></b><button type="button" class="quitar" data-k="quitar">✕ Quitar</button></div>
    <label>Labor realizada</label>
    <select data-k="labor"></select>
    <div class="hint" data-k="info"></div>
    <label>Lotes (puede marcar varios)</label>
    <div class="chk" data-k="lotes">${ls.length?`<label><input type="checkbox" data-k="todos"> <b>Todos</b></label>`+ls.map(l=>`<label><input type="checkbox" class="lote" value="${esc(l)}"> ${esc(l)}</label>`).join(""):`<span class="note">${f?"Esta finca no tiene lotes cargados":"Primero elija la finca"}</span>`}</div>
    <div class="row3">
      <div><label>Hora inicio</label><input type="time" data-k="hIni"></div>
      <div><label>Hora fin</label><input type="time" data-k="hFin"></div>
      <div><label>Pausas (min)</label><input type="number" data-k="pausa" min="0" step="5" value="0" inputmode="numeric"></div>
    </div>
    <div class="row">
      <div><label>Unidad</label><select data-k="unidad"></select></div>
      <div data-k="cantBox"><label>Cantidad realizada</label><input type="number" data-k="cantidad" min="0" step="any" inputmode="decimal" placeholder="Ej: 120 (sin puntos de miles)"></div>
    </div>
    <div class="calc">
      <div class="kpi"><b data-k="kHoras">0,0</b><span>horas efectivas</span></div>
      <div class="kpi"><b data-k="kRend">—</b><span data-k="kRendU">por hora</span></div>
      <div class="kpi" data-k="kMetaBox"><b data-k="kMeta">—</b><span data-k="kMetaU">de la meta</span></div>
    </div>
    <label data-k="obsLabel">Observaciones de esta labor (opcional)</label>
    <textarea data-k="obs" placeholder="Ej: plantas muy cargadas, detalle de la labor 'Otra'…"></textarea>`;
  optLabores(q(t,"labor"),CONFIG.LABORES[cultivoActual()]||[],"Seleccione la labor");
  q(t,"unidad").innerHTML='<option value="">Seleccione</option>'+CONFIG.UNIDADES.map(u=>`<option>${u}</option>`).join("")+`<option>${SOLO_T}</option>`;
  q(t,"hIni").value=hIni||"";
  const todos=q(t,"todos");
  if(todos){ todos.addEventListener("change",()=>t.querySelectorAll(".lote").forEach(c=>c.checked=todos.checked));
    t.querySelectorAll(".lote").forEach(c=>c.addEventListener("change",()=>{ todos.checked=[...t.querySelectorAll(".lote")].every(x=>x.checked); })); }
  q(t,"labor").addEventListener("change",()=>onLabor(t));
  q(t,"unidad").addEventListener("change",()=>onUnidad(t));
  ["hIni","hFin","pausa","cantidad"].forEach(k=>q(t,k).addEventListener("input",()=>calc(t)));
  q(t,"quitar").addEventListener("click",()=>{ t.remove(); numerar(); });
  $("tareas").appendChild(t); numerar(); onLabor(t);
  return t;
}
function numerar(){ const ts=tarjetas(); ts.forEach((t,i)=>{ q(t,"quitar").classList.toggle("hide",ts.length<2); t.querySelector(".tNum").textContent=ts.length>1?`Labor ${i+1}`:"Labor"; }); }
function reiniciarTareas(hIni){ $("tareas").innerHTML=""; nuevaTarea(hIni); }
$("btnOtra").addEventListener("click",()=>{
  const ts=tarjetas(), ult=ts[ts.length-1];
  const t=nuevaTarea(ult?q(ult,"hFin").value:"");
  t.scrollIntoView({behavior:"smooth",block:"start"}); q(t,"labor").focus();
});
const unidadDe=t=>q(t,"unidad").value;
function onUnidad(t){ const solo=unidadDe(t)===SOLO_T; q(t,"cantBox").classList.toggle("hide",solo); if(solo) q(t,"cantidad").value=""; calc(t); }
function onLabor(t){
  const l=laborObj(q(t,"labor").value);
  const otra=l&&/99$/.test(l.c);
  q(t,"unidad").value=!l?"":l.u?l.u:otra?"":SOLO_T; onUnidad(t);
  q(t,"info").textContent=!l?"":l.u?`Normalmente se mide en ${l.u}.`+(l.meta?` Meta: ${fmt(l.meta,0)} ${l.u} por hora.`:" Meta aún sin definir."):otra?"Escoja la unidad en que se mide lo que hizo.":"Se registra solo el tiempo. Si quiere, cambie la unidad.";
  q(t,"obsLabel").textContent=l&&/99$/.test(l.c)?"Describa la labor realizada (obligatorio)":"Observaciones de esta labor (opcional)";
  calc(t);
}
function calc(t){
  const h=horas(q(t,"hIni").value,q(t,"hFin").value,q(t,"pausa").value), cant=parseFloat(q(t,"cantidad").value), l0=laborObj(q(t,"labor").value), u=unidadDe(t);
  const l=l0?{...l0,u:u&&u!==SOLO_T?u:"",meta:u===l0.u?l0.meta:null}:null;
  q(t,"kHoras").textContent=fmt(h);
  const r=h>0&&cant>=0&&l&&l.u?cant/h:NaN;
  q(t,"kRend").textContent=fmt(r); q(t,"kRendU").textContent=l&&l.u?`${l.u}/hora`:"por hora";
  const pct=l&&l.meta&&isFinite(r)?r/l.meta*100:NaN;
  q(t,"kMeta").textContent=isFinite(pct)?fmt(pct,0)+" %":"—";
  q(t,"kMetaU").textContent=l&&!l.meta?"meta sin definir":"de la meta";
  q(t,"kMetaBox").className="kpi "+semaforo(pct);
}
function msg(el,txt,cls){ el.textContent=txt; el.className="msg show "+cls; clearTimeout(el._t); el._t=setTimeout(()=>el.className="msg",8000); }

$("finca").addEventListener("change",onFinca);
$("novedad").addEventListener("change",onNovedad);
$("durNov").addEventListener("change",onNovedad);

$("f").addEventListener("submit",e=>{
  e.preventDefault();
  const f=fincaObj($("finca").value), nov=$("novedad").value, trab=trabaja();
  let op=$("operario").value;
  if(op==="Contratista"){ const n=$("contNombre").value.trim(); if(!n) return msg($("msg"),"Escriba el nombre del contratista.","bad"); op="Contratista — "+n; }
  if(!f){ $("finca").focus(); return msg($("msg"),"Falta elegir la finca (arriba, en Datos del día).","bad"); }
  if(!op) return msg($("msg"),"Elija el operario agrícola.","bad");
  if($("lluvia").value.trim()===""){ $("lluvia").focus(); return msg($("msg"),"Escriba la lluvia de ayer en mm (pluviómetro). Si no llovió, ponga 0.","bad"); }
  if($("llovio").value==="Sí"){
    const rg=rangosLluvia().sort((p,q)=>p.desde.localeCompare(q.desde));
    for(let i=0;i<rg.length;i++){
      if(!rg[i].desde||!rg[i].hasta||rg[i].hasta<=rg[i].desde) return msg($("msg"),`Revise el rango de lluvia ${i+1}: indique de qué hora a qué hora llovió.`,"bad");
      if(i&&rg[i].desde<rg[i-1].hasta) return msg($("msg"),"Dos rangos de lluvia se cruzan. Revíselos.","bad");
    }
  }
  guardarDia();
  const dia=getLS(DIAS,{})[diaKey()]||{};
  const novDet=$("obs").value.trim();
  const base=()=>({
    id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), creado:new Date().toISOString(),
    fecha:$("fecha").value, finca:f.nombre, cultivo:f.cultivo, lider:dia.lider||"", lluviaMm:dia.lluvia===""||dia.lluvia==null?"":Number(dia.lluvia),
    llovioHoy:dia.llovio||"No", lluviaDesde:dia.llovio==="Sí"?[...(dia.rangos||[])].sort((p,q)=>p.desde.localeCompare(q.desde)).map(r=>r.desde).join(", "):"", lluviaHasta:dia.llovio==="Sí"?[...(dia.rangos||[])].sort((p,q)=>p.desde.localeCompare(q.desde)).map(r=>r.hasta).join(", "):"", novedadDia:dia.nov||"",
    trabajador:op, novedad:nov||"", novedadDuracion:nov?(trab?"Parte del día":"Todo el día"):"",
    lote:"", laborCod:"", labor:"", grupo:"", unidad:"", horaInicio:"", horaFin:"", pausaMin:"", horas:"", cantidad:"", rendimiento:"", meta:"", cumplimiento:"",
    obs:novDet, estado:"pendiente"
  });
  const recs=load(), nuevos=[];
  const toMin=t=>{const[a,b]=t.split(":").map(Number);return a*60+b;};
  let aviso="";
  if(trab){
    const ts=tarjetas();
    for(let i=0;i<ts.length;i++){
      const t=ts[i], n=ts.length>1?`Labor ${i+1}: `:"";
      const err=m=>{ t.classList.add("tErr"); setTimeout(()=>t.classList.remove("tErr"),6000); return msg($("msg"),n+m,"bad"); };
      const l0=laborObj(q(t,"labor").value), hI=q(t,"hIni").value, hF=q(t,"hFin").value, h=horas(hI,hF,q(t,"pausa").value), u=unidadDe(t), solo=u===SOLO_T;
      if(!l0) return err("elija la labor.");
      if(!u) return err("escoja la unidad de la cantidad.");
      const l={...l0,u:solo?"":u,meta:u===l0.u?l0.meta:null}, cant=solo?NaN:parseFloat(q(t,"cantidad").value);
      if(h<=0) return err("revise las horas: la hora fin debe ser mayor que la de inicio (descontando pausas).");
      if(!solo&&!(cant>=0)) return err("escriba la cantidad realizada.");
      const dec=(q(t,"cantidad").value.split(/[.,]/)[1]||"");
      if(!solo&&dec.length>2) return err("escriba la cantidad sin puntos de miles. Ej: 4991, no 4.991");
      const obsT=q(t,"obs").value.trim();
      if(/99$/.test(l.c)&&!obsT) return err("para 'Otra' describa la labor en observaciones.");
      if(recs.some(r=>r.estado==="pendiente"&&r.fecha===$("fecha").value&&r.trabajador===op&&r.laborCod===l0.c&&r.horaInicio===hI))
        return err(`ese registro ya existe: ${op}, ${l0.n}, desde las ${hI}, con fecha ${$("fecha").value.split("-").reverse().join("/")}. Todavía está pendiente por enviar en este celular.`);
      const choque=nuevos.find(r=>toMin(hI)<toMin(r.horaFin)&&toMin(hF)>toMin(r.horaInicio));
      if(choque) return err(`el horario ${hI}–${hF} se cruza con ${choque.labor} (${choque.horaInicio}–${choque.horaFin}).`);
      const lotes=[...t.querySelectorAll(".lote:checked")].map(c=>c.value).join(", ");
      const r=base();
      Object.assign(r,{lote:lotes,laborCod:l.c,labor:l.n,unidad:l.u,horaInicio:hI,horaFin:hF,
        pausaMin:Number(q(t,"pausa").value)||0,horas:+h.toFixed(2),cantidad:solo?"":cant,rendimiento:solo?"":+(cant/h).toFixed(2),
        meta:l.meta??"",cumplimiento:l.meta&&!solo?+((cant/h)/l.meta*100).toFixed(1):"",
        obs:[obsT,novDet].filter(Boolean).join(" · ")});
      nuevos.push(r);
    }
    const cruce=nuevos.map(n=>recs.find(r=>r.horaInicio&&r.fecha===n.fecha&&r.trabajador===op&&toMin(n.horaInicio)<toMin(r.horaFin)&&toMin(n.horaFin)>toMin(r.horaInicio))).find(Boolean);
    if(cruce) aviso=` Ojo: se cruza con otro registro de ${op} ya guardado (${cruce.horaInicio}–${cruce.horaFin}).`;
  } else {
    if(recs.some(r=>r.fecha===$("fecha").value&&r.trabajador===op&&r.novedadDuracion==="Todo el día"))
      return msg($("msg"),`${op} ya tiene una novedad de todo el día registrada en esta fecha.`,"bad");
    nuevos.push(base());
  }
  save(recs.concat(nuevos));
  const ultFin=trab?nuevos[nuevos.length-1].horaFin:"";
  reiniciarTareas(ultFin);
  $("obs").value=""; $("novedad").value=""; onNovedad(); refresh();
  const txt=trab?(nuevos.length>1?`Guardado ✓ ${op} — ${nuevos.length} labores.`:`Guardado ✓ ${op} — ${nuevos[0].labor}.`):`Guardado ✓ ${op} — ${nov} (todo el día).`;
  msg($("msg"),txt+(aviso||(navigator.onLine?"":" Se enviará cuando haya señal.")),aviso?"mid":"ok");
  sync();
});

/* ---------- Envío (online/offline) ---------- */
let syncing=false;
async function sync(){
  const pend=load().filter(r=>r.estado==="pendiente");
  if(!pend.length||syncing||!navigator.onLine||!CONFIG.SYNC_URL) return {ok:false,pend:pend.length};
  syncing=true;
  try{
    const res=await fetch(CONFIG.SYNC_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({registros:pend})});
    if(!res.ok) throw new Error(res.status);
    const j=await res.json().catch(()=>({})); if(!j.ok) throw new Error(j.error||"respuesta inválida");
    const ids=new Set(pend.map(p=>p.id)); save(load().map(r=>ids.has(r.id)?{...r,estado:"enviado"}:r));
    return {ok:true,pend:0,n:pend.length};
  }catch(e){ return {ok:false,pend:pend.length,err:true}; }
  finally{ syncing=false; refresh(); }
}
$("btnSync").addEventListener("click",async()=>{
  const r=await sync();
  if(r.ok) msg($("msgL"),`${r.n} registros enviados ✓`,"ok");
  else if(!r.pend) msg($("msgL"),"No hay registros pendientes.","ok");
  else if(!navigator.onLine) msg($("msgL"),"Sin señal. Los registros siguen guardados en este celular.","mid");
  else if(!CONFIG.SYNC_URL) msg($("msgL"),"Aún no está conectada la Google Sheet. Los registros quedan guardados aquí.","mid");
  else msg($("msgL"),"No se pudo enviar. Se reintentará automáticamente.","bad");
});
window.addEventListener("online",()=>{net();sync();}); window.addEventListener("offline",net); setInterval(sync,60000);
function net(){ const on=navigator.onLine; $("netDot").className="dot"+(on?"":" off"); $("netTxt").textContent=on?"En línea":"Sin conexión — guardando en el celular"; }

/* ---------- Lista ---------- */
let remotos=null, remotosHora="", claveSup="";
function datos(){ const loc=load(); if(!remotos) return loc; const ids=new Set(remotos.map(r=>String(r.id))); return remotos.concat(loc.filter(r=>r.estado==="pendiente"&&!ids.has(String(r.id)))); }
async function cargarRemotos(clave){
  if(!CONFIG.SYNC_URL) throw new Error("sin hoja");
  if(!navigator.onLine) throw new Error("offline");
  const res=await fetch(CONFIG.SYNC_URL+"?clave="+encodeURIComponent(clave)+"&t="+Date.now());
  const j=await res.json();
  if(!j.ok) throw new Error(j.error||"error");
  if(!Array.isArray(j.registros)) throw new Error("version");
  const f2=v=>{ v=String(v??""); const m=v.match(/^(\d{4}-\d{2}-\d{2})/); if(m) return m[1]; const m2=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m2?`${m2[3]}-${m2[2].padStart(2,"0")}-${m2[1].padStart(2,"0")}`:v; };
  remotos=j.registros.map(r=>({...r,fecha:f2(r.fecha)})); remotosHora=new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
  document.querySelectorAll(".actHora").forEach(e=>e.textContent=`Datos de todas las fincas · actualizado ${remotosHora} · ${remotos.length} registros`);
}
async function actualizar(btn){
  btn.disabled=true; const t=btn.textContent; btn.textContent="Actualizando…";
  try{ await cargarRemotos(claveSup); refresh(); }
  catch(e){ document.querySelectorAll(".actHora").forEach(x=>x.textContent=e.message==="offline"?"Sin internet: mostrando los últimos datos descargados.":"No se pudo actualizar. Intente de nuevo."); }
  finally{ btn.disabled=false; btn.textContent=t; }
}
function renderLista(){
  const fe=$("lFecha").value, fi=$("lFinca").value;
  const recs=datos().filter(r=>(!fe||r.fecha===fe)&&(!fi||r.finca===fi)).sort((a,b)=>(a.trabajador+a.horaInicio).localeCompare(b.trabajador+b.horaInicio));
  $("listaRecs").innerHTML=recs.length?recs.map(r=>{
    const tit=r.labor?`${esc(r.labor)}`:`${esc(r.novedad)} — todo el día`;
    const det=r.labor?`${r.horaInicio}–${r.horaFin} (${fmt(r.horas)} h) · ${r.unidad?fmt(r.cantidad,1)+" "+r.unidad:"solo tiempo"}${r.lote?" · "+esc(r.lote):""}`:"";
    const tag=r.labor?(r.cumplimiento!==""?`<span class="tag ${semaforo(r.cumplimiento)}">${fmt(r.cumplimiento,0)} %</span>`:(r.unidad?`<span class="tag">${fmt(r.rendimiento)} ${r.unidad}/h</span>`:"")):`<span class="tag mid">${esc(r.novedad)}</span>`;
    return `<div class="rec"><div><b>${esc(r.trabajador)}</b> — ${tit}<br><small>${r.fecha} · ${esc(r.finca)}${det?"<br>"+det:""}${r.labor&&r.novedad?"<br>Novedad: "+esc(r.novedad)+" (parte del día)":""}${r.obs?"<br>“"+esc(r.obs)+"”":""}</small></div>
      <div style="text-align:right">${tag}<br><small>${r.estado==="enviado"?"✓ enviado":"⏳ pendiente"}</small></div></div>`;
  }).join(""):`<p class="note">No hay registros para este filtro.</p>`;
}
$("btnCopy").addEventListener("click",async()=>{
  const cols=["fecha","finca","cultivo","lider","lluviaMm","llovioHoy","lluviaDesde","lluviaHasta","novedadDia","trabajador","novedad","novedadDuracion","lote","labor","unidad","horaInicio","horaFin","pausaMin","horas","cantidad","rendimiento","meta","cumplimiento","obs","estado"];
  const txt=[cols.join("\t"),...datos().map(r=>cols.map(c=>String(r[c]??"").replace(/\t|\n/g," ")).join("\t"))].join("\n");
  try{ await navigator.clipboard.writeText(txt); msg($("msgL"),"Copiado. Péguelo en Excel o Google Sheets.","ok"); }catch(e){ msg($("msgL"),"El navegador no permitió copiar.","bad"); }
});

/* ---------- Rendimientos y novedades ---------- */
function renderRend(){
  const d=$("rDesde").value,h=$("rHasta").value,fi=$("rFinca").value,la=$("rLabor").value;
  const all=datos().filter(r=>(!d||r.fecha>=d)&&(!h||r.fecha<=h)&&(!fi||r.finca===fi));
  const laN=la?(laborObj(la)||{}).n:""; const recs=all.filter(r=>r.labor&&(!la||r.labor===laN));
  const g={};
  recs.forEach(r=>{const k=r.trabajador+"|"+r.labor+"|"+r.unidad;(g[k]=g[k]||{op:r.trabajador,finca:r.finca,cod:r.laborCod,labor:r.labor,u:r.unidad,meta:r.meta,q:0,h:0});g[k].q+=Number(r.cantidad)||0;g[k].h+=Number(r.horas)||0;});
  const rows=Object.values(g).map(x=>({...x,rend:x.u?x.q/x.h:NaN,pct:x.meta&&x.u?(x.q/x.h)/x.meta*100:NaN})).sort((a,b)=>a.labor.localeCompare(b.labor)||(a.pct-b.pct)||(a.rend-b.rend));
  const nov={}; all.filter(r=>r.novedad).forEach(r=>{(nov[r.trabajador]=nov[r.trabajador]||{})[r.novedad]=(nov[r.trabajador][r.novedad]||0)+(r.novedadDuracion==="Todo el día"?1:0.5);});
  const tipos=[...new Set(all.filter(r=>r.novedad).map(r=>r.novedad))];
  $("rendTabla").innerHTML=(rows.length?`<p class="sub">Rendimiento por operario y labor</p><table>
    <tr><th>Operario</th><th>Labor</th><th class="n">Cant.</th><th class="n">Horas</th><th class="n">Rend./h</th><th class="n">Meta</th><th class="n">%</th></tr>
    ${rows.map(x=>`<tr><td>${esc(x.op)}<br><small style="color:var(--muted)">${esc(x.finca)}</small></td><td>${esc(x.labor)}<br><small style="color:var(--muted)">${x.u||"solo tiempo"}</small></td>
      <td class="n">${x.u?fmt(x.q,0):"—"}</td><td class="n">${fmt(x.h)}</td><td class="n">${fmt(x.rend)}</td><td class="n">${x.meta?fmt(x.meta,0):"—"}</td>
      <td class="n">${isFinite(x.pct)?`<span class="tag ${semaforo(x.pct)}">${fmt(x.pct,0)} %</span>`:"—"}</td></tr>`).join("")}</table>`
    :`<p class="note">No hay labores registradas en este rango.</p>`)
   +(tipos.length?`<p class="sub" style="margin-top:18px">Novedades (días; parte del día = ½)</p><table><tr><th>Operario</th>${tipos.map(t=>`<th class="n">${esc(t)}</th>`).join("")}</tr>
     ${Object.entries(nov).map(([op,v])=>`<tr><td>${esc(op)}</td>${tipos.map(t=>`<td class="n">${v[t]?fmt(v[t],1):""}</td>`).join("")}</tr>`).join("")}</table>`:"");
}

/* ---------- General ---------- */
let admin=false;
function refresh(){ const p=load().filter(r=>r.estado==="pendiente").length; const t=`${p} registro${p===1?"":"s"} pendiente${p===1?"":"s"} por enviar`; $("pendTxt").textContent=t; $("pendOp").textContent=t; if(admin){ renderLista(); renderRend(); } }
$("btnSyncOp").addEventListener("click",async()=>{ const r=await sync();
  if(r.ok) msg($("msg"),`${r.n} registros enviados ✓`,"ok");
  else if(!r.pend) msg($("msg"),"No hay registros pendientes.","ok");
  else if(!navigator.onLine) msg($("msg"),"Sin señal. Los registros siguen guardados en este celular.","mid");
  else if(!CONFIG.SYNC_URL) msg($("msg"),"Aún no está conectada la Google Sheet. Los registros quedan guardados aquí.","mid");
  else msg($("msg"),"No se pudo enviar. Se reintentará automáticamente.","bad"); });
function setAdmin(on){ admin=on; if(!on){ remotos=null; claveSup=""; } document.querySelectorAll(".adm").forEach(b=>b.classList.toggle("hide",!on)); $("btnAdm").textContent=on?"🔓":"🔒"; $("pinBox").classList.add("hide");
  if(!on){ document.querySelector('nav button[data-tab=registro]').click(); } refresh(); }
$("btnAdm").addEventListener("click",()=>{ if(admin) return setAdmin(false); document.querySelector('nav button[data-tab=registro]').click(); $("pinBox").classList.toggle("hide"); $("pin").focus(); });
$("btnPin").addEventListener("click",async()=>{
  const c=$("pin").value.trim(); if(!c) return;
  const b=$("btnPin"); b.disabled=true; b.textContent="Verificando…";
  try{ await cargarRemotos(c); claveSup=c; $("pin").value=""; setAdmin(true); }
  catch(e){ msg($("msgPin"), e.message==="clave"?"Clave incorrecta.":e.message==="version"?"Falta actualizar el código de la Google Sheet (Apps Script) a la versión nueva.":e.message==="offline"?"Necesita internet para ver la información de todas las fincas.":"No se pudo conectar con la hoja. Intente de nuevo.","bad"); }
  finally{ b.disabled=false; b.textContent="Entrar"; }
});
document.querySelectorAll(".btnAct").forEach(b=>b.addEventListener("click",()=>actualizar(b)));
document.querySelectorAll("nav button[data-tab]").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("nav button[data-tab]").forEach(x=>x.classList.toggle("on",x===b));
  ["registro","lista","rend"].forEach(t=>$("tab-"+t).classList.toggle("hide",t!==b.dataset.tab)); refresh();
}));
optList($("lFinca"),CONFIG.FINCAS.map(f=>f.nombre),"Todas");
optList($("rFinca"),CONFIG.FINCAS.map(f=>f.nombre),"Todas");
optLabores($("rLabor"),todas().filter((l,i,a)=>a.findIndex(x=>x.c===l.c)===i),"Todas");
$("lFecha").value=hoy();
const d7=new Date(); d7.setDate(d7.getDate()-7); $("rDesde").value=d7.toISOString().slice(0,10); $("rHasta").value=hoy();
["lFecha","lFinca"].forEach(id=>$(id).addEventListener("input",renderLista));
["rDesde","rHasta","rFinca","rLabor"].forEach(id=>$(id).addEventListener("input",renderRend));
if(CONFIG.EMPRESA) document.querySelector("header h1").textContent="🌱 Registro de Labores — "+CONFIG.EMPRESA;
initForm(); net(); refresh(); sync();

// Modo sin internet (instalación en el celular)
if("serviceWorker" in navigator){ try{ navigator.serviceWorker.register("sw.js").catch(()=>{}); }catch(e){} }
