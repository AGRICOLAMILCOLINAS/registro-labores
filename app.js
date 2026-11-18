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
  sel.innerHTML=`<option value="">${ph}</option>`+labs.map(l=>`<option value="${l.c}">${esc(l.n)}</option>`).join("");
}
function horas(ini,fin,pausa){ if(!ini||!fin) return 0; const[a,b]=ini.split(":").map(Number),[c,d]=fin.split(":").map(Number); const m=(c*60+d)-(a*60+b)-(Number(pausa)||0); return m>0?m/60:0; }
const semaforo=p=>!isFinite(p)?"":p>=90?"ok":p>=70?"mid":"bad";

/* ---------- Datos del día (uno por finca y fecha) ---------- */
const diaKey=()=>$("fecha").value+"|"+$("finca").value;
function guardarDia(){
  const d=getLS(DIAS,{});
  d[diaKey()]={lider:$("lider").value,lluvia:$("lluvia").value,llovio:$("llovio").value,desde:$("lluDesde").value,hasta:$("lluHasta").value,nov:$("novDia").value};
  setLS(DIAS,d);
}
function cargarDia(){
  const x=getLS(DIAS,{})[diaKey()]||{};
  if(x.lider) $("lider").value=x.lider;
  $("lluvia").value=x.lluvia??""; $("novDia").value=x.nov??"";
  $("llovio").value=x.llovio||""; $("lluDesde").value=x.desde||""; $("lluHasta").value=x.hasta||""; onLlovio();
}
["lider","lluvia","novDia"].forEach(id=>$(id).addEventListener("input",guardarDia));
$("lider").addEventListener("change",()=>{ if($("finca").value) pref("lider_"+$("finca").value,$("lider").value); });
function horasLista(){ const a=[]; for(let m=5*60;m<=20*60;m+=30){ a.push(String(Math.floor(m/60)).padStart(2,"0")+":"+(m%60?"30":"00")); } return a; }
function fmtHora(t){ const[h,m]=t.split(":").map(Number); return ((h+11)%12+1)+":"+String(m).padStart(2,"0")+(h<12?" a. m.":" p. m."); }
["lluDesde","lluHasta"].forEach(id=>{ $(id).innerHTML='<option value="">—</option>'+horasLista().map(t=>`<option value="${t}">${fmtHora(t)}</option>`).join(""); $(id).addEventListener("change",guardarDia); });
function onLlovio(){ $("lluviaHoras").classList.toggle("hide",$("llovio").value!=="Sí"); }
$("llovio").addEventListener("change",()=>{ onLlovio(); guardarDia(); });
$("fecha").addEventListener("change",cargarDia);

/* ---------- Formulario ---------- */
function initForm(){
  $("fecha").value=hoy();
  optList($("finca"),CONFIG.FINCAS.map(f=>f.nombre),"Seleccione la finca");
  const f=pref("finca"); if(f&&fincaObj(f)) $("finca").value=f;
  onFinca();
}
function onFinca(){
  const f=fincaObj($("finca").value);
  const todosOps=[...new Set(CONFIG.FINCAS.flatMap(x=>x.operarios))];
  optList($("operario"),[...(f?f.operarios:todosOps),"Contratista"],"Seleccione el operario");
  onOperario();
  const cultivo=f?f.cultivo:"Aguacate Hass";
  optLabores($("labor"),CONFIG.LABORES[cultivo]||[],"Seleccione la labor");
  const ls=f?(f.lotes||[]):[];
  $("lotes").innerHTML=ls.length?`<label><input type="checkbox" id="loteTodos"> <b>Todos</b></label>`+ls.map(l=>`<label><input type="checkbox" class="lote" value="${esc(l)}"> ${esc(l)}</label>`).join(""):`<span class="note">${f?"Esta finca no tiene lotes cargados":"Primero elija la finca"}</span>`;
  const t=$("loteTodos");
  if(t){ t.addEventListener("change",()=>document.querySelectorAll(".lote").forEach(c=>c.checked=t.checked));
    document.querySelectorAll(".lote").forEach(c=>c.addEventListener("change",()=>{ const all=[...document.querySelectorAll(".lote")]; t.checked=all.every(x=>x.checked); })); }
  if(f){ pref("finca",f.nombre); $("lider").value=pref("lider_"+f.nombre)||""; }
  cargarDia(); onNovedad(); onLabor();
}
function lotesSel(){ return [...document.querySelectorAll(".lote:checked")].map(c=>c.value).join(", "); }
function onOperario(){ const c=$("operario").value==="Contratista"; $("contBox").classList.toggle("hide",!c); if(!c) $("contNombre").value=""; }
$("operario").addEventListener("change",onOperario);
function trabaja(){ return !$("novedad").value || $("durNov").value==="parte"; }
function onNovedad(){
  $("durBox").classList.toggle("hide",!$("novedad").value);
  $("laborBox").classList.toggle("hide",!trabaja());
  $("obsLabel").textContent = $("novedad").value&&!trabaja() ? "Detalle de la novedad (opcional)" : "Observaciones (opcional)";
}
const SOLO_T="Solo tiempo (sin cantidad)";
$("unidadSel").innerHTML='<option value="">Seleccione</option>'+CONFIG.UNIDADES.map(u=>`<option>${u}</option>`).join("")+`<option>${SOLO_T}</option>`;
const unidad=()=>$("unidadSel").value;
function onUnidad(){ const solo=unidad()===SOLO_T; $("cantBox").classList.toggle("hide",solo); if(solo) $("cantidad").value=""; calc(); }
$("unidadSel").addEventListener("change",onUnidad);
function onLabor(){
  const l=laborObj($("labor").value);
  $("unidadSel").value=l?l.u:""; onUnidad();
  $("laborInfo").textContent=!l?"":l.u?`Normalmente se mide en ${l.u}.`+(l.meta?` Meta: ${fmt(l.meta,0)} ${l.u} por hora.`:" Meta aún sin definir."):"Escoja la unidad en que se mide lo que hizo.";
  if(l&&/99$/.test(l.c)) $("obsLabel").textContent="Describa la labor realizada (obligatorio)";
  else onNovedad();
  calc();
}
function calc(){
  const h=horas($("hIni").value,$("hFin").value,$("pausa").value), q=parseFloat($("cantidad").value), l0=laborObj($("labor").value), u=unidad();
  const l=l0?{...l0,u:u&&u!==SOLO_T?u:"",meta:u===l0.u?l0.meta:null}:null;
  $("kHoras").textContent=fmt(h);
  const r=h>0&&q>=0&&l&&l.u?q/h:NaN;
  $("kRend").textContent=fmt(r); $("kRendU").textContent=l&&l.u?`${l.u}/hora`:"por hora";
  const pct=l&&l.meta&&isFinite(r)?r/l.meta*100:NaN;
  $("kMeta").textContent=isFinite(pct)?fmt(pct,0)+" %":"—";
  $("kMetaU").textContent=l&&!l.meta?"meta sin definir":"de la meta";
  $("kMetaBox").className="kpi "+semaforo(pct);
}
function msg(el,txt,cls){ el.textContent=txt; el.className="msg show "+cls; clearTimeout(el._t); el._t=setTimeout(()=>el.className="msg",6000); }

$("finca").addEventListener("change",onFinca);
$("novedad").addEventListener("change",onNovedad);
$("durNov").addEventListener("change",onNovedad);
$("labor").addEventListener("change",onLabor);
["hIni","hFin","pausa","cantidad"].forEach(id=>$(id).addEventListener("input",calc));

$("f").addEventListener("submit",e=>{
  e.preventDefault();
  const f=fincaObj($("finca").value), nov=$("novedad").value, trab=trabaja();
  let op=$("operario").value;
  if(op==="Contratista"){ const n=$("contNombre").value.trim(); if(!n) return msg($("msg"),"Escriba el nombre del contratista.","bad"); op="Contratista — "+n; }
  if(!f){ $("finca").focus(); return msg($("msg"),"Falta elegir la finca (arriba, en Datos del día).","bad"); }
  if(!op) return msg($("msg"),"Elija el operario agrícola.","bad");
  if($("llovio").value==="Sí"&&(!$("lluDesde").value||!$("lluHasta").value||$("lluHasta").value<=$("lluDesde").value)) return msg($("msg"),"Indique de qué hora a qué hora llovió.","bad");
  guardarDia();
  const dia=getLS(DIAS,{})[diaKey()]||{};
  const base={
    id:Date.now().toString(36)+Math.random().toString(36).slice(2,6), creado:new Date().toISOString(),
    fecha:$("fecha").value, finca:f.nombre, cultivo:f.cultivo, lider:dia.lider||"", lluviaMm:dia.lluvia===""||dia.lluvia==null?"":Number(dia.lluvia),
    llovioHoy:dia.llovio||"No", lluviaDesde:dia.llovio==="Sí"?(dia.desde||""):"", lluviaHasta:dia.llovio==="Sí"?(dia.hasta||""):"", novedadDia:dia.nov||"",
    trabajador:op, novedad:nov||"", novedadDuracion:nov?(trab?"Parte del día":"Todo el día"):"",
    lote:"", laborCod:"", labor:"", grupo:"", unidad:"", horaInicio:"", horaFin:"", pausaMin:"", horas:"", cantidad:"", rendimiento:"", meta:"", cumplimiento:"",
    obs:$("obs").value.trim(), estado:"pendiente"
  };
  const recs=load();
  let aviso="";
  if(trab){
    const l0=laborObj($("labor").value), h=horas($("hIni").value,$("hFin").value,$("pausa").value), u=unidad(), solo=u===SOLO_T;
    if(!l0) return msg($("msg"),"Elija la labor.","bad");
    if(!u) return msg($("msg"),"Escoja la unidad de la cantidad.","bad");
    const l={...l0,u:solo?"":u,meta:u===l0.u?l0.meta:null}, q=solo?NaN:parseFloat($("cantidad").value);
    if(h<=0) return msg($("msg"),"Revise las horas: la hora fin debe ser mayor que la de inicio (descontando pausas).","bad");
    if(!solo&&!(q>=0)) return msg($("msg"),"Escriba la cantidad realizada.","bad");
    const dec=($("cantidad").value.split(/[.,]/)[1]||"");
    if(!solo&&dec.length>2) return msg($("msg"),"Escriba la cantidad sin puntos de miles. Ej: 4991, no 4.991","bad");
    if(recs.some(r=>r.fecha===base.fecha&&r.trabajador===op&&r.laborCod===l0.c&&r.horaInicio===$("hIni").value))
      return msg($("msg"),`Ese registro ya existe: ${op}, ${l0.n}, desde las ${$("hIni").value}.`,"bad");
    if(/99$/.test(l.c)&&!base.obs) return msg($("msg"),"Para 'Otra' describa la labor en observaciones.","bad");
    const toMin=t=>{const[a,b]=t.split(":").map(Number);return a*60+b;};
    const cruce=recs.find(r=>r.horaInicio&&r.fecha===base.fecha&&r.trabajador===op&&toMin($("hIni").value)<toMin(r.horaFin)&&toMin($("hFin").value)>toMin(r.horaInicio));
    if(cruce) aviso=` Ojo: se cruza con otro registro de ${op} (${cruce.horaInicio}–${cruce.horaFin}).`;
    Object.assign(base,{lote:lotesSel(),laborCod:l.c,labor:l.n,unidad:l.u,horaInicio:$("hIni").value,horaFin:$("hFin").value,
      pausaMin:Number($("pausa").value)||0,horas:+h.toFixed(2),cantidad:solo?"":q,rendimiento:solo?"":+(q/h).toFixed(2),
      meta:l.meta??"",cumplimiento:l.meta&&!solo?+((q/h)/l.meta*100).toFixed(1):""});
  } else {
    if(recs.some(r=>r.fecha===base.fecha&&r.trabajador===op&&r.novedadDuracion==="Todo el día"))
      return msg($("msg"),`${op} ya tiene una novedad de todo el día registrada en esta fecha.`,"bad");
  }
  recs.push(base); save(recs);
  if(trab){ $("hIni").value=$("hFin").value; $("hFin").value=""; $("cantidad").value=""; $("pausa").value=0; }
  $("obs").value=""; $("novedad").value=""; onNovedad(); calc(); refresh();
  msg($("msg"),(trab?`Guardado ✓ ${op} — ${base.labor}.`:`Guardado ✓ ${op} — ${nov} (todo el día).`)+(aviso||(navigator.onLine?"":" Se enviará cuando haya señal.")),aviso?"mid":"ok");
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
  const d=new Date(); d.setDate(d.getDate()-180);
  const res=await fetch(CONFIG.SYNC_URL+"?clave="+encodeURIComponent(clave)+"&desde="+d.toISOString().slice(0,10)+"&t="+Date.now());
  const j=await res.json();
  if(!j.ok) throw new Error(j.error||"error");
  if(!Array.isArray(j.registros)) throw new Error("version");
  remotos=j.registros; remotosHora=new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
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
