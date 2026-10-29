"use strict";
/* =========================================================
   5. ESTADO + PERSISTÊNCIA
   ========================================================= */
let A = blank(), cur = 0, lastResult = null, maxReached = 0, quizState = {};
try{ const s = JSON.parse(localStorage.getItem("regulamed:v1")||"null"); if(s && s.A){ A = Object.assign(blank(), s.A); cur = s.cur||0; maxReached = s.max||0; } }catch(e){}
function save(){ try{ localStorage.setItem("regulamed:v1", JSON.stringify({A,cur,max:maxReached})); }catch(e){} }

const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = (s,r=document)=>r.querySelector(s);
const visible = () => STEPS.filter(s=>s.show(A));
function toast(t){ const d=document.createElement("div"); d.className="toast"; d.setAttribute("role","status"); d.textContent=t; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }

/* =========================================================
   6. INTERFACE
   ========================================================= */
const app = $("#app");
function route(){
  let v = (location.hash||"#inicio").slice(1);
  if(!["inicio","analise","resultado","normas","aprender"].includes(v)) v="inicio";
  document.querySelectorAll("[data-nav]").forEach(a=>{ if(a.dataset.nav===v) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  ({inicio:viewHome,analise:viewWizard,resultado:viewResult,normas:viewNormas,aprender:viewLearn})[v]();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);

function viewHome(){
  app.innerHTML = `<div class="view">
  <section class="hero">
    <div>
      <span class="eyebrow">Classificação regulatória · Anvisa</span>
      <h1>Descubra o caminho regulatório do seu medicamento.</h1>
      <p class="lead">Uma plataforma inteligente para compreender a classificação e os requisitos regulatórios de medicamentos no Brasil.</p>
      <div class="ctas"><a class="btn btn-primary" href="#analise" data-start>Iniciar análise</a><a class="btn btn-ghost" href="#normas">Consultar normas</a></div>
      <div class="notice" role="note"><span aria-hidden="true">⚠</span><span><b>Resultados orientativos.</b> O RegulaMed apoia o estudo e o planejamento. Ele não emite decisão regulatória e não substitui a análise da Anvisa.</span></div>
    </div>
    <figure class="tree" style="margin:0">${treeSVG()}<figcaption>Trecho simplificado da árvore de decisão usada pelo motor de regras.</figcaption></figure>
  </section>

  <section class="section">
    <span class="eyebrow">Como funciona</span>
    <h2>Perguntas sobre o produto, não sobre a norma</h2>
    <ol class="steps">
      <li><h3>Responda</h3><p>Cada resposta define a próxima pergunta. Você pode voltar e mudar o que quiser.</p></li>
      <li><h3>Regras aplicadas</h3><p>Um motor de regras determinístico compara as respostas com os critérios das normas.</p></li>
      <li><h3>Leia o parecer</h3><p>Caminhos possíveis, justificativa, pendências, requisitos e normas, em sete seções.</p></li>
      <li><h3>Aprenda</h3><p>Cada categoria encontrada leva a explicações, comparações e questões de revisão.</p></li>
    </ol>
  </section>

  <section class="section">
    <span class="eyebrow">Categorias que o sistema ajuda a entender</span>
    <h2>Do genérico ao biológico</h2>
    <div class="cats">
      ${[["Genérico","Intercambiável com o referência, identificado pela DCB.","Lei nº 9.787/1999"],["Similar","Mesmas características do referência, com nome comercial.","RDC nº 753/2022"],["Novo","IFA sintético ou semissintético ainda não registrado no país.","RDC nº 753/2022"],["Inovador","Inovação sobre IFA já registrado: associação, forma, concentração, indicação.","IN nº 184/2022"],["Biológico e fitoterápico","Seguem normas próprias, fora da RDC nº 753/2022.","RDC nº 55/2010 · RDC nº 26/2014"],["Notificação","Regularização simplificada de produtos de baixo risco listados.","RDC nº 576/2021"]]
        .map(c=>`<div class="cat"><h3>${c[0]}</h3><p>${c[1]}</p><p class="mono">${c[2]}</p></div>`).join("")}
    </div>
  </section>

  <section class="section">
    <span class="eyebrow">Arquitetura do sistema</span>
    <h2>Cinco camadas separadas</h2>
    <p class="help" style="margin-bottom:16px">A interface só conversa com o motor de regras. O motor lê perguntas, regras e fontes como dados, então uma norma nova muda o cadastro, não o código da tela. A IA, na versão completa, explica o resultado; ela não decide.</p>
    <div class="arch">
      <div class="layer"><b>Dados do produto</b><span>Respostas do usuário e ficha do medicamento.</span></div>
      <div class="layer"><b>Perguntas</b><span>Árvore condicional com regras de exibição e validação.</span></div>
      <div class="layer"><b>Regras</b><span>Motor determinístico que gera caminhos e pendências.</span></div>
      <div class="layer"><b>Fontes normativas</b><span>Normas com status, data de conferência e link.</span></div>
      <div class="layer"><b>Resultados</b><span>Parecer A–G, exportação e histórico.</span></div>
    </div>
  </section></div>`;
}

function treeSVG(){
  const n=(x,y,w,t,hl)=>`<g><rect x="${x}" y="${y}" width="${w}" height="30" rx="7" fill="${hl?"var(--teal-soft)":"var(--sunk)"}" stroke="${hl?"var(--teal)":"var(--line)"}"/><text x="${x+w/2}" y="${y+19.5}" text-anchor="middle" font-size="11.5" font-family="IBM Plex Sans, sans-serif" fill="var(--ink)">${t}</text></g>`;
  const l=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} C ${x1} ${(y1+y2)/2}, ${x2} ${(y1+y2)/2}, ${x2} ${y2}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`;
  const t=(x,y,s)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="var(--muted)">${s}</text>`;
  return `<svg viewBox="0 0 400 250" role="img" aria-label="Árvore de decisão: IFA registrado leva a diferenças; sem diferença e com referência, genérico ou similar; com diferença, inovador; sem registro, novo.">
  ${l(200,40,100,85)}${l(200,40,300,85)}${l(100,115,55,170)}${l(100,115,155,170)}${l(55,200,55,215)}
  ${n(120,10,160,"IFA sintético registrado?",false)}
  ${t(135,66,"sim")}${t(268,66,"não")}
  ${n(30,85,140,"Há diferença do registrado?",false)}
  ${n(240,85,120,"Medicamento novo",true)}
  ${t(66,146,"não")}${t(142,146,"sim")}
  ${n(5,170,100,"Referência na LMR",false)}
  ${n(115,170,90,"Inovador",true)}
  ${n(5,215,100,"Genérico · Similar",true)}
  </svg>`;
}

/* ---------- Wizard ---------- */
function viewWizard(){
  const vs = visible();
  if(cur>=vs.length) cur = vs.length-1;
  const step = vs[cur];
  const pct = Math.round((cur)/(vs.length)*100);
  app.innerHTML = `<div class="view wz">
    <aside class="rail" aria-label="Etapas">
      <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <div class="barlbl">Etapa ${cur+1} de ${vs.length}</div>
      <ol>${vs.map((s,i)=>`<li><button data-goto="${i}" class="${i===cur?"cur":""} ${i<cur||i<=maxReached&&i!==cur?"done":""}" ${i>maxReached?"disabled":""}><span class="dot"></span>${s.label}</button></li>`).join("")}</ol>
      <p style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-reset>Recomeçar</button></p>
    </aside>
    <section class="q" aria-live="polite" id="q">${renderStep(step.id)}
      <div id="err"></div>
      <div class="qnav"><button class="btn btn-ghost" data-back ${cur===0?"disabled":""}>Voltar</button><button class="btn btn-primary" data-next>${cur===vs.length-1?"Ver resultado":"Continuar"}</button></div>
    </section></div>`;
}

const radio = (name,val,title,sub) => `<label class="opt ${A[name]===val?"on":""}"><input type="radio" name="${name}" value="${val}" ${A[name]===val?"checked":""}><span><b>${title}</b>${sub?`<small>${sub}</small>`:""}</span></label>`;
const demoTag = `<span class="tag t-demo">Dados demonstrativos</span>`;

function renderStep(id){
  const a=A;
  if(id==="natureza") return `<span class="eyebrow">Etapa 0 · Escopo</span><h2>Qual é a natureza do princípio ativo?</h2>
    <p class="help">As categorias genérico, similar, novo e inovador da RDC nº 753/2022 valem para IFAs sintéticos e semissintéticos. Outros produtos têm normas próprias.</p>
    <div class="opts">${radio("natureza","sintetico","Sintético ou semissintético","Molécula obtida por síntese química, como a maioria dos comprimidos e soluções.")}
    ${radio("natureza","biologico","Biológico","Proteína recombinante, anticorpo, vacina, hemoderivado.")}
    ${radio("natureza","vegetal","De origem vegetal","Derivado vegetal como ativo (fitoterápico).")}
    ${radio("natureza","dinamizado","Dinamizado","Homeopático, antroposófico ou anti-homotóxico.")}
    ${radio("natureza","baixo_risco","Produto de baixo risco listado pela Anvisa","Pode ser passível de notificação simplificada.")}
    ${radio("natureza","outro","Outro","Radiofármaco, medicamento específico ou caso não listado.")}
    ${radio("natureza","nao_sei","Não sei","")}</div>`;

  if(id==="ifa") return `<span class="eyebrow">Etapa 1 · Princípio ativo</span><h2>O princípio ativo já possui registro ou ocorrência em medicamentos no Brasil?</h2>
    <p class="help">Três situações diferentes: a substância pode ser apenas conhecida (ter DCB), estar em medicamentos que já foram registrados, ou ter registro vigente hoje.</p>
    <div class="opts">${radio("ifaStatus","sim","Sim","")}${radio("ifaStatus","nao","Não","")}${radio("ifaStatus","nao_sei","Não sei","")}</div>
    ${a.ifaStatus==="sim"?`<div class="sub"><h3>Pesquise o princípio ativo ${demoTag}</h3>${acField("ifaNome","Nome ou sinônimo (ex.: acetaminofeno)")}
      <p class="help">Busca local em uma lista demonstrativa. A integração com a base de registros da Anvisa ainda não foi implementada, por isso medicamentos relacionados não são exibidos. Consulte em <a href="${CONSULTA}" target="_blank" rel="noopener">consultas.anvisa.gov.br</a>.</p>
      <h3>Situação do registro</h3><div class="opts" style="margin-top:0">${radio("ifaRegistro","vigente","Há medicamento com registro vigente","")}${radio("ifaRegistro","nao_vigente","Só houve registros, hoje cancelados ou caducos","")}${radio("ifaRegistro","nao_sei","Não sei a situação atual","")}</div></div>`:""}
    ${a.ifaStatus==="nao"?`<div class="sub"><label class="fl" for="ifaNomeN">Nome da substância<input type="text" id="ifaNomeN" data-f="ifaNome" value="${esc(a.ifaNome)}" placeholder="Nome químico, DCB ou código de desenvolvimento"></label>
      <p class="help">O produto seguirá para a análise de medicamento novo. Confirme depois se a substância já tem DCB.</p></div>`:""}
    ${a.ifaStatus==="nao_sei"?`<div class="sub"><h3>Pesquisa assistida ${demoTag}</h3>${acField("ifaNome","Digite o nome que você conhece")}
      <ol class="howto"><li>Procure o nome na lista de DCB para obter a denominação oficial.</li><li>Pesquise o IFA na <a href="${CONSULTA}" target="_blank" rel="noopener">consulta de medicamentos da Anvisa</a> e veja se há registro válido.</li><li>Volte aqui e troque a resposta para "Sim" ou "Não".</li></ol>
      <p class="help">Você pode seguir sem saber, mas o resultado vai marcar essa dúvida como ponto crítico.</p></div>`:""}`;

  if(id==="ref") return `<span class="eyebrow">Etapa 2 · Medicamento de referência</span><h2>Existe um medicamento de referência relacionado ao princípio ativo e à apresentação pretendida?</h2>
    <p class="help">Medicamento de referência é o produto inovador registrado na Anvisa e eleito como parâmetro na Lista de Medicamentos de Referência (LMR). Grupo A reúne produtos com um IFA; Grupo B, com dois ou mais.</p>
    <div class="opts">${radio("refExiste","sim","Sim","")}${radio("refExiste","nao","Não","")}${radio("refExiste","nao_sei","Não sei","")}</div>
    ${a.refExiste==="sim"?`<div class="sub"><label class="fl" for="refNome">Medicamento de referência (nome, concentração e forma)<input type="text" id="refNome" data-f="refNome" value="${esc(a.refNome)}" placeholder="Como aparece na LMR vigente"></label><p class="help">A LMR ainda não está integrada; o nome digitado é tratado como informado por você.</p></div>`:""}
    ${a.refExiste&&a.refExiste!=="sim"?`<div class="sub"><p class="help">Sem referência identificado, o motor vai investigar outros caminhos e indicar como verificar a LMR.</p></div>`:""}`;

  if(id==="comp"){
    if(!a.ativos[0].nome && a.ifaNome) a.ativos[0].nome = a.ifaNome;
    return `<span class="eyebrow">Etapa 3 · Composição</span><h2>Qual é a composição do medicamento?</h2>
    <div class="opts">${radio("composicao","mono","Apenas um princípio ativo","")}${radio("composicao","assoc","Associação de dois ou mais princípios ativos","")}${radio("composicao","outra","Outra composição","Ex.: kit com componentes separados.")}</div>
    ${a.composicao?`<div class="sub"><h3>Princípios ativos e concentrações</h3>
      ${a.ativos.map((x,i)=>`<div class="row"><label class="fl" for="at-n-${i}">IFA ${i+1}<input type="text" id="at-n-${i}" data-at="${i}" data-k="nome" value="${esc(x.nome)}"></label>
        <label class="fl" for="at-c-${i}">Concentração<input type="text" id="at-c-${i}" inputmode="decimal" data-at="${i}" data-k="conc" value="${esc(x.conc)}" placeholder="500"></label>
        <label class="fl" for="at-u-${i}">Unidade<select id="at-u-${i}" data-at="${i}" data-k="un">${["mg","g","mcg","mg/mL","%","UI","UI/mL"].map(u=>`<option ${x.un===u?"selected":""}>${u}</option>`).join("")}</select></label>
        <button class="icon-btn" data-rm="${i}" aria-label="Remover IFA ${i+1}" ${a.ativos.length===1?"disabled":""}>✕</button></div>`).join("")}
      ${a.composicao!=="mono"?`<div><button class="btn btn-ghost btn-sm" data-addat>Adicionar princípio ativo</button></div>`:""}
      ${a.composicao==="outra"?`<label class="fl" for="compO">Descreva a composição<input type="text" id="compO" data-f="composicaoOutra" value="${esc(a.composicaoOutra)}"></label>`:""}</div>`:""}`;
  }
  if(id==="forma") return `<span class="eyebrow">Etapa 4 · Forma farmacêutica</span><h2>Qual é a forma farmacêutica do produto?</h2>
    <p class="help">A forma influencia os estudos exigidos. Soluções e alguns produtos de ação local podem ter hipótese de bioisenção.</p>
    <div class="chips" style="margin-top:16px" role="radiogroup" aria-label="Forma farmacêutica">${FORMAS.map(f=>`<button class="chip ${a.forma===f?"on":""}" role="radio" aria-checked="${a.forma===f}" data-set="forma" data-v="${esc(f)}">${f}</button>`).join("")}</div>
    ${a.forma==="Outra"?`<div class="sub"><label class="fl" for="formaO">Qual forma?<input type="text" id="formaO" data-f="formaOutra" value="${esc(a.formaOutra)}"></label></div>`:""}`;
  if(id==="via") return `<span class="eyebrow">Etapa 5 · Via de administração</span><h2>Qual será a via de administração?</h2>
    <div class="chips" style="margin-top:16px" role="radiogroup" aria-label="Via">${VIAS.map(f=>`<button class="chip ${a.via===f?"on":""}" role="radio" aria-checked="${a.via===f}" data-set="via" data-v="${f}">${f}</button>`).join("")}</div>
    ${a.via==="Outra"?`<div class="sub"><label class="fl" for="viaO">Qual via?<input type="text" id="viaO" data-f="viaOutra" value="${esc(a.viaOutra)}"></label></div>`:""}`;
  if(id==="ind") return `<span class="eyebrow">Etapa 6 · Finalidade terapêutica</span><h2>Qual é a indicação terapêutica pretendida?</h2>
    <label class="fl" for="ind" style="margin-top:14px">Indicação<textarea id="ind" data-f="indicacao" placeholder="Ex.: alívio temporário de dor leve a moderada e febre em adultos.">${esc(a.indicacao)}</textarea></label>
    <p class="help" style="margin-top:12px">Categoria terapêutica (sugestões)</p>
    <div class="chips" style="margin-top:6px">${CLASSES.map(c=>`<button class="chip ${a.classe===c?"on":""}" data-set="classe" data-v="${c}">${c}</button>`).join("")}</div>`;
  if(id==="car"){
    const list = DIFS.filter(d=>d[0]!=="nova_assoc" || a.composicao==="assoc");
    return `<span class="eyebrow">Etapa 7 · Características do produto</span><h2>Em relação aos medicamentos já registrados com esse IFA, o que muda?</h2>
    <p class="help">Marque todas as diferenças que se aplicam. Elas separam a via de genérico ou similar da via de medicamento inovador.</p>
    <div class="opts">${list.map(d=>`<label class="opt ${a.difs.includes(d[0])?"on":""}"><input type="checkbox" data-dif="${d[0]}" ${a.difs.includes(d[0])?"checked":""}><span><b>${d[1]}</b>${d[2]?`<small>${d[2]}</small>`:""}</span></label>`).join("")}</div>
    ${a.composicao==="assoc"?`<div class="sub"><h3>Essa associação, com os mesmos IFAs e proporções, já tem registro?</h3><div class="opts" style="margin-top:0">${radio("assocRegistrada","sim","Sim","")}${radio("assocRegistrada","nao","Não","")}${radio("assocRegistrada","nao_sei","Não sei","")}</div></div>`:""}
    ${a.difs.includes("tecnologia")?`<div class="sub"><label class="fl" for="tec">Qual tecnologia?<input type="text" id="tec" data-f="tecnologiaDesc" value="${esc(a.tecnologiaDesc)}" placeholder="Ex.: liberação prolongada por matriz polimérica"></label></div>`:""}
    ${a.difs.includes("nenhuma") && a.refExiste==="sim"?`<div class="sub"><h3>Como o produto será identificado no mercado?</h3><div class="opts" style="margin-top:0">${radio("intercambio","generico","Só pela DCB, intercambiável com o referência","Caminho de genérico.")}${radio("intercambio","similar","Com nome comercial ou marca","Caminho de similar.")}${radio("intercambio","indefinido","Ainda não definido","")}</div></div>`:""}`;
  }
  return "";
}
function acField(f,ph){ return `<div class="ac"><label class="fl" for="ac-${f}">Princípio ativo<input type="text" id="ac-${f}" data-f="${f}" data-ac="1" autocomplete="off" value="${esc(A[f])}" placeholder="${ph}" role="combobox" aria-expanded="false" aria-controls="acl"></label><ul id="acl" hidden></ul></div>`; }

function validate(id){
  const a=A;
  const m = {
    natureza:()=>!a.natureza&&"Escolha uma opção para continuar.",
    ifa:()=>!a.ifaStatus?"Escolha Sim, Não ou Não sei.":(a.ifaStatus==="sim"&&!a.ifaNome.trim())?"Informe o princípio ativo.":(a.ifaStatus==="sim"&&!a.ifaRegistro)?"Informe a situação do registro.":(a.ifaStatus==="nao"&&!a.ifaNome.trim())?"Informe o nome da substância.":"",
    ref:()=>!a.refExiste?"Escolha Sim, Não ou Não sei.":(a.refExiste==="sim"&&!a.refNome.trim())?"Informe o medicamento de referência.":"",
    comp:()=>!a.composicao?"Escolha o tipo de composição.":!a.ativos[0].nome.trim()?"Informe ao menos um princípio ativo.":(a.composicao==="assoc"&&a.ativos.filter(x=>x.nome.trim()).length<2)?"Uma associação precisa de pelo menos dois princípios ativos.":a.ativos.some(x=>x.conc.trim()&&!/^\d+([.,]\d+)?$/.test(x.conc.trim()))?"Use só números na concentração, como 500 ou 2,5.":"",
    forma:()=>!a.forma?"Escolha a forma farmacêutica.":(a.forma==="Outra"&&!a.formaOutra.trim())?"Descreva a forma farmacêutica.":"",
    via:()=>!a.via?"Escolha a via de administração.":(a.via==="Outra"&&!a.viaOutra.trim())?"Descreva a via.":"",
    ind:()=>a.indicacao.trim().length<8?"Descreva a indicação em pelo menos uma frase curta.":"",
    car:()=>!a.difs.length?"Marque ao menos uma opção. Se não houver diferença, marque \"Nenhuma diferença\".":(a.composicao==="assoc"&&!a.assocRegistrada)?"Responda se a associação já tem registro.":(a.difs.includes("nenhuma")&&a.refExiste==="sim"&&!a.intercambio)?"Diga como o produto será identificado no mercado.":""
  };
  return (m[id]||(()=>""))();
}

/* eventos do wizard */
app.addEventListener("change",e=>{
  const t=e.target;
  if(t.type==="radio"){ A[t.name]=t.value; if(t.name==="ifaStatus"&&t.value!=="sim") A.ifaRegistro=""; save(); rerenderStep(); }
  else if(t.dataset.dif){ const k=t.dataset.dif; let d=A.difs.filter(x=>x!==k);
    if(t.checked){ if(k==="nenhuma") d=["nenhuma"]; else { d=d.filter(x=>x!=="nenhuma"); d.push(k);} }
    A.difs=d; if(!d.includes("nenhuma")) A.intercambio=""; save(); rerenderStep(); }
  else if(t.dataset.at){ A.ativos[+t.dataset.at][t.dataset.k]=t.value; save(); }
});
app.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.f){ A[t.dataset.f]=t.value; save(); if(t.dataset.ac) suggest(t); }
  else if(t.dataset.at){ A.ativos[+t.dataset.at][t.dataset.k]=t.value; save(); }
});
app.addEventListener("click",e=>{
  const b=e.target.closest("button,a"); if(!b) return;
  if(b.hasAttribute("data-start")){ if(maxReached===0 && !A.natureza){ cur=0; } }
  if(b.dataset.set){ A[b.dataset.set]=b.dataset.v; save(); rerenderStep(); }
  else if(b.hasAttribute("data-next")){ const vs=visible(); const msg=validate(vs[cur].id);
    if(msg){ $("#err").innerHTML=`<p class="err" role="alert">${msg}</p>`; return; }
    if(cur===vs.length-1){ lastResult=evaluate(A); save(); location.hash="#resultado"; return; }
    cur++; maxReached=Math.max(maxReached,cur); save(); viewWizard(); }
  else if(b.hasAttribute("data-back")){ if(cur>0){cur--; save(); viewWizard();} }
  else if(b.dataset.goto!==undefined){ cur=+b.dataset.goto; save(); viewWizard(); }
  else if(b.hasAttribute("data-reset")){ if(b.dataset.confirm){ A=blank(); cur=0; maxReached=0; lastResult=null; save(); viewWizard(); } else { b.dataset.confirm="1"; b.textContent="Confirmar: apagar respostas"; setTimeout(()=>{ if(b.isConnected){ delete b.dataset.confirm; b.textContent="Recomeçar"; } },4000); } }
  else if(b.hasAttribute("data-addat")){ A.ativos.push({nome:"",conc:"",un:"mg"}); save(); rerenderStep(); }
  else if(b.dataset.rm!==undefined){ A.ativos.splice(+b.dataset.rm,1); save(); rerenderStep(); }
  else if(b.dataset.pick!==undefined){ const inp=$("[data-ac]"); A[inp.dataset.f]=b.dataset.pick; inp.value=b.dataset.pick; save(); closeAc(); }
  else if(b.hasAttribute("data-copy")) copyReport();
  else if(b.hasAttribute("data-pdf")) exportPDF();
  else if(b.dataset.learn){ location.hash="#aprender"; setTimeout(()=>{ const el=document.getElementById("g-"+b.dataset.learn); if(el){ el.classList.add("hl"); el.scrollIntoView({block:"center",behavior:"smooth"}); } },60); }
  else if(b.dataset.kbf!==undefined){ kbFilter=b.dataset.kbf; viewNormas(); }
  else if(b.hasAttribute("data-qreset")){ quizState={}; viewLearn(true); }
  else if(b.dataset.qz!==undefined){ quizState[b.dataset.qz]=+b.dataset.opt; viewLearn(true); }
});
function rerenderStep(){ const q=$("#q"); if(!q) return; const vs=visible(); if(cur>=vs.length) cur=vs.length-1; viewWizard(); }

function suggest(inp){
  const q=inp.value.trim().toLowerCase(); const ul=$("#acl");
  if(q.length<2){ closeAc(); return; }
  const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  const hits=DEMO_IFAS.filter(x=>norm(x.n).includes(norm(q))||x.s.some(s=>norm(s).includes(norm(q)))).slice(0,6);
  ul.innerHTML = hits.length? hits.map(h=>`<li><button type="button" data-pick="${esc(h.n)}">${esc(h.n)}${h.s.length?` <small>· sinônimos: ${esc(h.s.join(", "))}</small>`:""}</button></li>`).join("") : `<li style="padding:8px 10px;color:var(--muted);font-size:13.5px">Nenhum resultado na lista demonstrativa. O nome digitado será usado como informado.</li>`;
  ul.hidden=false; inp.setAttribute("aria-expanded","true");
}
function closeAc(){ const ul=$("#acl"); if(ul){ ul.hidden=true; } const i=$("[data-ac]"); if(i) i.setAttribute("aria-expanded","false"); }
document.addEventListener("click",e=>{ if(!e.target.closest(".ac")) closeAc(); });

/* ---------- Resultado ---------- */
function productFacts(a){
  const nat={sintetico:"Sintético ou semissintético",biologico:"Biológico",vegetal:"De origem vegetal",dinamizado:"Dinamizado",baixo_risco:"Baixo risco (lista da Anvisa)",outro:"Outro",nao_sei:"Não informado"}[a.natureza]||"—";
  const ifa={sim:"Sim",nao:"Não",nao_sei:"Não sei"}[a.ifaStatus]||"—";
  const reg={vigente:"registro vigente",nao_vigente:"só registros não vigentes",nao_sei:"situação não verificada"}[a.ifaRegistro];
  const f=[["Natureza do ativo",nat],["IFA com registro no Brasil",ifa+(reg?` (${reg})`:"")],["Princípio(s) ativo(s)",a.ativos.filter(x=>x.nome.trim()).map(x=>`${x.nome}${x.conc?` ${x.conc} ${x.un}`:""}`).join(" + ")||"—"],
    ["Composição",{mono:"Um princípio ativo",assoc:"Associação",outra:"Outra: "+(a.composicaoOutra||"—")}[a.composicao]||"—"]];
  if(STEPS[2].show(a)) f.push(["Medicamento de referência",a.refExiste==="sim"?a.refNome:({nao:"Não identificado",nao_sei:"Não sabe"}[a.refExiste]||"—")]);
  f.push(["Forma farmacêutica",a.forma==="Outra"?a.formaOutra:a.forma||"—"],["Via de administração",a.via==="Outra"?a.viaOutra:a.via||"—"],["Indicação",a.indicacao||"—"],["Categoria terapêutica",a.classe||"—"]);
  if(STEPS[7].show(a)) f.push(["Diferenças em relação ao registrado",a.difs.map(d=>DIFS.find(x=>x[0]===d)[1]).join(", ")+(a.tecnologiaDesc?` (${a.tecnologiaDesc})`:"")||"—"]);
  return f;
}
const grauTag = g => g==="Mais provável"?`<span class="tag t-rule">Mais provável</span>`:g==="Possível"?`<span class="tag t-user">Possível</span>`:g==="Via específica"?`<span class="tag t-rule">Via específica</span>`:`<span class="tag t-check">${g}</span>`;
const normTag = n => n.status==="conferida"?`<span class="tag t-ok">Vigência conferida em ${CHECKED}</span>`:`<span class="tag t-check">Conferir vigência</span>`;
const learnIds = {generico:"generico",similar:"similar",novo:"novo",inovador:"inovador",gensim:"referencia",biologico:"biologico",fito:"fitoterapico",notif:"notificacao"};

function viewResult(){
  const done = A.natureza && visible().every(s=>!validate(s.id));
  if(!done){ app.innerHTML=`<div class="view empty"><h2 style="margin-bottom:8px">Nenhuma análise concluída</h2><p>Responda às perguntas do assistente para ver o parecer com os caminhos regulatórios possíveis.</p><p style="margin-top:16px"><a class="btn btn-primary" href="#analise">${A.natureza?"Continuar análise":"Iniciar análise"}</a></p></div>`; return; }
  const r = lastResult = evaluate(A);
  const normas=[...r.normas].map(k=>[k,NORMAS[k]]);
  app.innerHTML = `<div class="view">
    <div class="rhead"><div><span class="eyebrow">Análise preliminar · ${new Date().toLocaleDateString("pt-BR")}</span><h1>Parecer orientativo</h1></div>
      <div class="ractions"><a class="btn btn-ghost btn-sm" href="#analise">Alterar respostas</a><button class="btn btn-ghost btn-sm" data-copy>Copiar relatório</button><button class="btn btn-primary btn-sm" data-pdf id="pdfBtn" hidden>Baixar PDF</button></div></div>
    <div class="notice" role="note" style="max-width:none;margin:0 0 18px"><span aria-hidden="true">⚠</span><span><b>Não é decisão regulatória.</b> Legenda: <span class="tag t-user">Informado por você</span> <span class="tag t-rule">Conclusão do motor de regras</span> <span class="tag t-ok">Fonte conferida</span> <span class="tag t-check">A confirmar</span></span></div>
    <div class="parecer">
      <section class="blk"><span class="lt">A</span><div><h2>Identificação do produto <span class="tag t-user">Informado por você</span></h2><dl class="kv">${productFacts(A).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div></section>
      <section class="blk"><span class="lt">B</span><div><h2>Possível enquadramento regulatório</h2>
        ${r.caminhos.map(c=>`<div class="path ${c.lead?"lead-path":""}"><h3>${c.titulo} ${grauTag(c.grau)}</h3>${learnIds[c.id]?`<p><button class="btn btn-ghost btn-sm" data-learn="${learnIds[c.id]}">Entenda esta categoria</button></p>`:""}</div>`).join("")}</div></section>
      <section class="blk"><span class="lt">C</span><div><h2>Justificativa técnica <span class="tag t-rule">Motor de regras</span></h2>
        ${r.caminhos.map(c=>`<h3 style="font-size:15px;margin:10px 0 6px">${c.titulo}</h3><ul class="clean">${c.porque.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`).join("")}</div></section>
      <section class="blk"><span class="lt">D</span><div><h2>Pontos que precisam de confirmação</h2>
        ${r.pendencias.length?`<ul class="clean">${r.pendencias.map(p=>`<li>${p.crit?`<span class="tag t-crit">Crítico</span> `:""}${esc(p.t)}</li>`).join("")}</ul>`:`<p class="help">Nenhuma pendência apontada pelas regras. Ainda assim, confira os requisitos na norma.</p>`}</div></section>
      <section class="blk"><span class="lt">E</span><div><h2>Requisitos regulatórios potencialmente aplicáveis</h2>
        <p class="help" style="margin-bottom:10px">Lista não exaustiva. A relação completa de documentos está no texto de cada norma.</p>
        ${r.caminhos.filter(c=>c.requisitos.length).map(c=>`<h3 style="font-size:15px;margin:10px 0 6px">${c.titulo}</h3><ul class="clean">${c.requisitos.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`).join("")}
        <h3 style="font-size:15px;margin:14px 0 6px">Para todos os caminhos</h3><ul class="clean">${r.requisitos.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div></section>
      <section class="blk"><span class="lt">F</span><div><h2>Fundamentação normativa</h2><ul class="normref">${normas.map(([k,n])=>`<li><a class="mono" href="${n.url}" target="_blank" rel="noopener">${n.cod}</a><span>${n.titulo}</span>${normTag(n)}</li>`).join("")}</ul></div></section>
      <section class="blk"><span class="lt">G</span><div><h2>Próximos passos</h2><ol class="clean">${r.passos.map(p=>`<li>${esc(p)}</li>`).join("")}</ol></div></section>
    </div></div>`;
  initPDF();
}

function reportText(){
  const r=lastResult||evaluate(A);
  const L=[];
  L.push("REGULAMED - PARECER ORIENTATIVO (não é decisão regulatória)","Gerado em "+new Date().toLocaleDateString("pt-BR"),"");
  L.push("A. IDENTIFICAÇÃO DO PRODUTO"); productFacts(A).forEach(([k,v])=>L.push(`- ${k}: ${v}`)); L.push("");
  L.push("B. POSSÍVEL ENQUADRAMENTO"); r.caminhos.forEach(c=>L.push(`- ${c.titulo} [${c.grau}]`)); L.push("");
  L.push("C. JUSTIFICATIVA TÉCNICA"); r.caminhos.forEach(c=>{L.push(c.titulo+":"); c.porque.forEach(p=>L.push("  - "+p));}); L.push("");
  L.push("D. PONTOS A CONFIRMAR"); (r.pendencias.length?r.pendencias:[{t:"Nenhum apontado pelas regras."}]).forEach(p=>L.push(`- ${p.crit?"[CRÍTICO] ":""}${p.t}`)); L.push("");
  L.push("E. REQUISITOS POTENCIALMENTE APLICÁVEIS (lista não exaustiva)"); r.caminhos.forEach(c=>{ if(c.requisitos.length){L.push(c.titulo+":"); c.requisitos.forEach(p=>L.push("  - "+p));}}); L.push("Para todos:"); r.requisitos.forEach(p=>L.push("  - "+p)); L.push("");
  L.push("F. FUNDAMENTAÇÃO NORMATIVA"); [...r.normas].forEach(k=>{const n=NORMAS[k]; L.push(`- ${n.cod} - ${n.titulo} (${n.status==="conferida"?"vigência conferida em "+CHECKED:"conferir vigência"}) ${n.url}`);}); L.push("");
  L.push("G. PRÓXIMOS PASSOS"); r.passos.forEach((p,i)=>L.push(`${i+1}. ${p}`));
  return L.join("\n");
}
async function copyReport(){
  const txt=reportText();
  try{ await navigator.clipboard.writeText(txt); toast("Relatório copiado."); }
  catch(e){ const ta=document.createElement("textarea"); ta.value=txt; ta.style.cssText="position:fixed;inset:auto 0 0 0;height:40vh;z-index:30"; document.body.appendChild(ta); ta.select(); toast("Texto selecionado. Copie com Ctrl+C ou toque longo."); setTimeout(()=>ta.remove(),15000); }
}
function initPDF(){
  const b=$("#pdfBtn"); if(b && window.jspdf) b.hidden=false;
}
function exportPDF(){
  if(!window.jspdf){ toast("Biblioteca de PDF não carregou. Verifique a internet."); return; }
  const clean=s=>s.replace(/[–—]/g,"-").replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/·/g,"-").replace(/[^\x00-\xFF]/g,"");
  const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"}); const W=180; let y=18;
  const write=(t,size,bold)=>{ doc.setFont("helvetica",bold?"bold":"normal"); doc.setFontSize(size); doc.splitTextToSize(clean(t),W).forEach(line=>{ if(y>282){doc.addPage(); y=18;} doc.text(line,15,y); y+=size*.45; }); };
  reportText().split("\n").forEach(ln=>{ if(!ln.trim()){ y+=3; return; } const head=/^[A-G]\. |^REGULAMED/.test(ln); write(ln, head?12:10, head); });
  doc.save("regulamed-parecer.pdf"); toast("PDF gerado.");
}

/* ---------- Base normativa ---------- */
const KB = [
  {t:"Categorias",h:"Genérico, similar, novo e inovador",r:"São as quatro categorias de registro de medicamentos com IFA sintético ou semissintético. Biológicos, fitoterápicos, dinamizados, específicos e radiofármacos ficam fora e seguem normas próprias.",n:["rdc753","lei9787"]},
  {t:"Categorias",h:"Produtos biológicos",r:"Registro pela via de desenvolvimento individual ou por comparabilidade. A norma principal está em revisão.",n:["rdc55"]},
  {t:"Categorias",h:"Fitoterápicos",r:"Medicamento fitoterápico exige registro; produto tradicional fitoterápico pode ser registrado ou notificado.",n:["rdc26"]},
  {t:"Tipos de registro",h:"Vias completa e abreviada",r:"A RDC nº 753/2022 criou duas vias para comprovar segurança e eficácia de novos e inovadores. A abreviada permite substituir novos estudos por dados já existentes, nas condições da norma.",n:["rdc753"]},
  {t:"Tipos de registro",h:"Procedimento simplificado",r:"Petição simplificada vinculada a uma petição matriz já deferida. Para genéricos e similares, a matriz deve se referir a medicamento da LMR vigente no protocolo.",n:["rdc954"]},
  {t:"Tipos de registro",h:"Notificação",r:"Forma simplificada de regularização para produtos de baixo risco listados. O produto deve seguir exatamente a especificação da lista.",n:["rdc576"]},
  {t:"Requisitos técnicos",h:"Código de assunto do protocolo",r:"Novos e inovadores são protocolados em códigos específicos (ex.: inovador por nova associação). O código pode ser discutido antes em audiência ou protocolo prévio.",n:["in184"]},
  {t:"Requisitos técnicos",h:"Boas Práticas de Fabricação",r:"O Certificado de Boas Práticas de Fabricação (CBPF) é emitido pela Anvisa e atesta que o estabelecimento cumpre as BPF.",n:["rdc753"]},
  {t:"Equivalência farmacêutica",h:"O que o estudo comprova",r:"Conjunto de ensaios físico-químicos e, quando aplicável, microbiológicos e biológicos que mostram que dois medicamentos são equivalentes farmacêuticos.",n:["rdc753"]},
  {t:"Bioequivalência",h:"Estudos de BD/BE",r:"Demonstram biodisponibilidades equivalentes entre produtos sob o mesmo desenho experimental. O estudo usa o mesmo lote do estudo de equivalência farmacêutica.",n:["rdc742"]},
  {t:"Bioequivalência",h:"Bioisenção",r:"Dispensa do estudo de BD/BE em hipóteses previstas: outras concentrações, sistema de classificação biofarmacêutica e razão da forma, via ou local de ação.",n:["rdc749"]},
  {t:"Medicamentos de referência",h:"Lista de Medicamentos de Referência",r:"Reúne inovadores com eficácia, segurança e qualidade comprovadas, usados como comparadores de genéricos e similares. Grupo A: um IFA. Grupo B: dois ou mais.",n:["rdc957","lmr"]},
  {t:"Legislação",h:"Base legal",r:"A Lei nº 6.360/1976 sustenta o registro de medicamentos; a Lei nº 9.787/1999 criou o medicamento genérico e a intercambialidade.",n:["lei6360","lei9787"]},
  {t:"Documentação",h:"Antes de protocolar",r:"Definir categoria e código de assunto, reunir CBPF, dossiê de qualidade, estudos aplicáveis e textos de bula e rotulagem. Casos incertos podem ir a protocolo prévio.",n:["rdc753","in184"]}
];
let kbFilter="Todos", kbQuery="";
function viewNormas(){
  const temas=["Todos",...new Set(KB.map(k=>k.t))];
  const norm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  const q=norm(kbQuery);
  const items=KB.filter(k=>(kbFilter==="Todos"||k.t===kbFilter)&&(!q||norm(k.h+k.r+k.n.map(x=>NORMAS[x].cod).join(" ")).includes(q)));
  app.innerHTML=`<div class="view">
    <span class="eyebrow">Base de conhecimento</span><h1 style="font-size:clamp(26px,3.6vw,38px);margin:6px 0 10px">Consulta regulatória</h1>
    <p class="lead" style="margin-bottom:20px">Resumos em linguagem simples com a norma de origem. Cada norma traz status, data da conferência e link para a fonte.</p>
    <div class="filters"><input type="text" id="kbq" placeholder="Buscar tema ou número da norma" value="${esc(kbQuery)}" aria-label="Buscar na base">
      <div class="chips">${temas.map(t=>`<button class="chip ${kbFilter===t?"on":""}" data-kbf="${t}">${t}</button>`).join("")}</div></div>
    <div class="kb">${items.map(k=>`<article class="kbi"><span class="eyebrow">${k.t}</span><h3>${k.h}</h3><p>${k.r}</p><div class="meta">${k.n.map(x=>`<a class="mono" href="${NORMAS[x].url}" target="_blank" rel="noopener">${NORMAS[x].cod}</a>`).join(" · ")}</div></article>`).join("")||`<p class="help">Nada encontrado para essa busca.</p>`}</div>
    <h2 style="font-size:22px;margin:36px 0 12px">Normas cadastradas</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Norma</th><th>Assunto</th><th>Status</th><th>Fonte</th></tr></thead><tbody>
    ${Object.values(NORMAS).map(n=>`<tr><td class="mono" style="white-space:nowrap">${n.cod}</td><td><b>${n.titulo}</b><br><span style="color:var(--muted)">${n.resumo}</span></td><td>${normTag(n)}</td><td><a href="${n.url}" target="_blank" rel="noopener">${n.fonte}</a></td></tr>`).join("")}
    </tbody></table></div>
    <p class="help" style="margin-top:12px">"Vigência conferida" quer dizer que a norma foi localizada como vigente em publicação oficial ou matéria recente na data indicada. "Conferir vigência" quer dizer que a norma é citada como referência, mas alterações recentes não foram verificadas. Integração automática com a Anvisa: não implementada.</p></div>`;
  const i=$("#kbq"); i.addEventListener("input",()=>{ kbQuery=i.value; const pos=i.selectionStart; viewNormas(); const n=$("#kbq"); n.focus(); n.setSelectionRange(pos,pos); });
}

/* ---------- Aprender ---------- */
const GLOSS=[
  ["generico","Medicamento genérico","Cópia intercambiável do medicamento de referência, identificada pela DCB, sem marca. Exige equivalência farmacêutica e bioequivalência (ou bioisenção)."],
  ["similar","Medicamento similar","Tem o mesmo IFA, concentração, forma, via, posologia e indicação do referência, mas usa nome comercial. Pode diferir em excipientes, embalagem e prazo de validade."],
  ["novo","Medicamento novo","Contém IFA sintético ou semissintético ainda não registrado no Brasil. Exige comprovação completa de segurança e eficácia."],
  ["inovador","Medicamento inovador","Traz inovação sobre IFA já registrado, como nova associação, forma, concentração, via ou indicação."],
  ["referencia","Medicamento de referência","Inovador registrado e comercializado no Brasil, eleito pela Anvisa como comparador e publicado na LMR."],
  ["dcb","DCB","Denominação Comum Brasileira: nome oficial do fármaco aprovado pela Anvisa."],
  ["ifa","IFA","Insumo farmacêutico ativo: a substância responsável pela ação do medicamento."],
  ["eqf","Equivalência farmacêutica","Ensaios que mostram que dois medicamentos têm a mesma forma, via e quantidade de IFA e atendem às mesmas especificações."],
  ["bdbe","Bioequivalência (BD/BE)","Demonstração de que dois produtos têm biodisponibilidade equivalente no organismo."],
  ["bioisencao","Bioisenção","Dispensa do estudo de bioequivalência nas hipóteses previstas na norma."],
  ["biologico","Produto biológico","Medicamento de origem biológica, como anticorpos, vacinas e proteínas recombinantes. Tem norma própria."],
  ["fitoterapico","Fitoterápico","Produto obtido de matéria-prima ativa vegetal. Pode ser medicamento fitoterápico ou produto tradicional fitoterápico."],
  ["notificacao","Notificação","Comunicação prévia à Anvisa para produtos de baixo risco listados, no lugar do registro completo."],
  ["cbpf","CBPF","Certificado de Boas Práticas de Fabricação, emitido pela Anvisa."]
];
const QUIZ=[
  {q:"Um produto tem o mesmo IFA, dose, forma e indicação do referência e será vendido com marca própria. Qual a categoria mais provável?",o:["Genérico","Similar","Inovador","Novo"],c:1,e:"Mesmas características do referência com nome comercial caracterizam o similar. O genérico usa só a DCB."},
  {q:"Uma empresa quer registrar uma substância sintética que nunca teve registro no Brasil. Qual caminho?",o:["Similar","Genérico","Medicamento novo","Notificação"],c:2,e:"IFA sintético sem registro no país leva ao registro de medicamento novo, com comprovação completa de segurança e eficácia."},
  {q:"Qual norma trata da isenção de estudos de bioequivalência?",o:["RDC nº 742/2022","RDC nº 749/2022","RDC nº 26/2014","IN nº 184/2022"],c:1,e:"A RDC nº 749/2022 trata da bioisenção e revogou a antiga RDC nº 37/2011. A RDC nº 742/2022 trata de como conduzir os estudos."},
  {q:"Uma associação inédita de dois IFAs que já têm registro isolado tende a ser:",o:["Genérico","Inovador","Similar","Biológico"],c:1,e:"A IN nº 184/2022 prevê o assunto de medicamento inovador por nova associação."},
  {q:"Um anticorpo monoclonal pode ser registrado como genérico pela RDC nº 753/2022?",o:["Sim","Não, segue a norma de produtos biológicos"],c:1,e:"A RDC nº 753/2022 vale para IFAs sintéticos e semissintéticos. Biológicos têm norma própria e via de comparabilidade."}
];
function viewLearn(keep){
  const y=keep?window.scrollY:0;
  app.innerHTML=`<div class="view">
    <span class="eyebrow">Modo de aprendizagem</span><h1 style="font-size:clamp(26px,3.6vw,38px);margin:6px 0 10px">Entenda as categorias</h1>
    <p class="lead" style="margin-bottom:24px">Comparação direta, situações de exemplo, glossário e questões de revisão.</p>
    <h2 style="font-size:22px;margin-bottom:12px">Comparação entre categorias</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Critério</th><th>Genérico</th><th>Similar</th><th>Novo</th><th>Inovador</th></tr></thead><tbody>
      <tr><td><b>IFA</b></td><td>Já registrado</td><td>Já registrado</td><td>Sem registro no Brasil</td><td>Já registrado</td></tr>
      <tr><td><b>Comparador</b></td><td>Referência da LMR</td><td>Referência da LMR</td><td>Não há</td><td>Medicamento já registrado, conforme o caso</td></tr>
      <tr><td><b>Identificação</b></td><td>DCB, sem marca</td><td>Nome comercial</td><td>Nome comercial</td><td>Nome comercial</td></tr>
      <tr><td><b>Comprovação central</b></td><td>Equivalência farmacêutica + BD/BE ou bioisenção</td><td>Equivalência farmacêutica + BD/BE ou bioisenção</td><td>Estudos não clínicos e clínicos completos</td><td>Dados proporcionais à inovação</td></tr>
      <tr><td><b>Norma principal</b></td><td class="mono">Lei nº 9.787/1999 · RDC nº 753/2022</td><td class="mono">RDC nº 753/2022</td><td class="mono">RDC nº 753/2022 · IN nº 184/2022</td><td class="mono">RDC nº 753/2022 · IN nº 184/2022</td></tr>
    </tbody></table></div>
    <h2 style="font-size:22px;margin:32px 0 12px">Situações de exemplo</h2>
    <div class="cases">
      <div class="cat"><h3>Comprimido igual ao referência</h3><p>Mesmo IFA, dose e indicação, vendido só pela DCB. Caminho de genérico, com estudo de equivalência farmacêutica e bioequivalência.</p></div>
      <div class="cat"><h3>Comprimido virou solução oral</h3><p>IFA conhecido em forma nova. Tende a medicamento inovador, com dados de segurança e eficácia proporcionais à mudança.</p></div>
      <div class="cat"><h3>Extrato de planta</h3><p>Sai do escopo da RDC nº 753/2022. A análise segue a norma de fitoterápicos.</p></div>
    </div>
    <h2 style="font-size:22px;margin:32px 0 12px">Glossário</h2>
    <div class="gl">${GLOSS.map(g=>`<div id="g-${g[0]}"><b>${g[1]}</b>${g[2]}</div>`).join("")}</div>
    <h2 style="font-size:22px;margin:32px 0 12px">Teste seus conhecimentos <span class="help" style="font-family:var(--f-body);font-size:14px;font-weight:400">${Object.keys(quizState).filter(k=>quizState[k]===QUIZ[k].c).length} de ${QUIZ.length} corretas</span></h2>
    <div class="quiz">${QUIZ.map((x,i)=>{const s=quizState[i]; return `<div class="qz"><p class="qq">${i+1}. ${x.q}</p><div class="ans">${x.o.map((o,j)=>`<button class="a ${s!==undefined?(j===x.c?"right":(j===s?"wrong":"")):""}" data-qz="${i}" data-opt="${j}" ${s!==undefined?"disabled":""}>${o}</button>`).join("")}</div>${s!==undefined?`<p class="ex"><b>${s===x.c?"Correto.":"Não é essa."}</b> ${x.e}</p>`:""}</div>`;}).join("")}</div>
    <p style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-qreset>Refazer questões</button></p></div>`;
  if(keep) window.scrollTo(0,y);
}

route();
