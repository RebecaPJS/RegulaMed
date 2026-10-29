"use strict";
/* =========================================================
   4. MOTOR DE REGRAS (determinístico, sem dependência da UI)
   ========================================================= */
function evaluate(a){
  const out = {caminhos:[], pendencias:[], requisitos:[], normas:new Set(["lei6360"]), passos:[]};
  const add = (c)=>{ out.caminhos.push(c); (c.normas||[]).forEach(n=>out.normas.add(n)); };
  const pend = (t,crit)=>out.pendencias.push({t,crit:!!crit});

  // Escopo: categorias da RDC 753 só valem para IFA sintético/semissintético
  if(a.natureza!=="sintetico"){
    const map = {
      biologico:{id:"biologico",titulo:"Produto biológico",grau:"Via específica",
        porque:["Você indicou um IFA de origem biológica. A RDC nº 753/2022 exclui produtos regidos por legislação específica, e produtos biológicos têm norma própria."],
        req:["Dossiê de produto biológico pela via de desenvolvimento individual ou por comparabilidade (biossimilares).","Certificado de Boas Práticas de Fabricação (CBPF) de todos os locais de fabricação."],
        normas:["rdc55","rdc954"],pend:["Conferir as alterações recentes da RDC nº 55/2010, especialmente para biossimilares."]},
      vegetal:{id:"fito",titulo:"Medicamento fitoterápico ou produto tradicional fitoterápico",grau:"Via específica",
        porque:["Você indicou ativo de origem vegetal. Esses produtos seguem a RDC nº 26/2014, que distingue medicamento fitoterápico (registro) de produto tradicional fitoterápico (registro ou notificação)."],
        req:["Definir se a segurança e a eficácia serão comprovadas por estudos ou pela tradicionalidade de uso.","Verificar se o produto consta na lista de produtos tradicionais fitoterápicos passíveis de notificação."],
        normas:["rdc26","rdc954"],pend:["Conferir atualizações da RDC nº 26/2014."]},
      dinamizado:{id:"dinam",titulo:"Medicamento dinamizado",grau:"Via específica",
        porque:["Medicamentos homeopáticos, antroposóficos e anti-homotóxicos seguem norma própria."],
        req:["Verificar se o produto é passível de notificação ou exige registro."],normas:["rdc238"],pend:["Conferir a vigência da RDC nº 238/2018."]},
      baixo_risco:{id:"notif",titulo:"Medicamento de baixo risco sujeito a notificação",grau:"Via específica",
        porque:["A notificação é uma forma simplificada de regularização, aplicável apenas aos produtos listados pela Anvisa."],
        req:["Confirmar que o IFA, a concentração e a forma constam na lista da IN nº 106/2021 e atualizações.","Seguir rigorosamente as especificações da lista; qualquer diferença pode exigir registro."],
        normas:["rdc576"],pend:["Conferir a lista vigente de medicamentos passíveis de notificação."]},
      outro:{id:"outros",titulo:"Outras vias específicas",grau:"Depende de verificação",
        porque:["O produto não se encaixa nas categorias da RDC nº 753/2022 pelo que foi informado. Vias possíveis incluem medicamento específico e radiofármaco."],
        req:["Identificar a natureza exata do ativo e a norma específica aplicável."],normas:["rdc24","rdc263"],pend:["Detalhar a natureza do ativo com um especialista."]},
      nao_sei:{id:"indef",titulo:"Escopo indefinido",grau:"Depende de verificação",
        porque:["Sem saber a origem do ativo não é possível escolher a norma de registro. Sintéticos seguem a RDC nº 753/2022; biológicos, fitoterápicos, dinamizados e outros têm normas próprias."],
        req:[],normas:["rdc753"],pend:["Informar se o ativo é sintético, semissintético, biológico, vegetal ou dinamizado."]}
    };
    const m = map[a.natureza] || map.nao_sei;
    add({id:m.id,titulo:m.titulo,grau:m.grau,porque:m.porque,requisitos:m.req,normas:m.normas,lead:true});
    m.pend.forEach(p=>pend(p, a.natureza==="nao_sei"));
    out.normas.add("rdc753");
    finishCommon(a,out,pend);
    return out;
  }

  out.normas.add("rdc753");
  const ifaNovo = a.ifaStatus==="nao";
  const ifaIncerto = a.ifaStatus==="nao_sei";
  const naoVigente = a.ifaStatus==="sim" && a.ifaRegistro==="nao_vigente";

  if(ifaNovo){
    add({id:"novo",titulo:"Medicamento novo",grau:"Mais provável",lead:true,
      porque:["Você informou que o IFA não possui registro de medicamento no Brasil.","Pela RDC nº 753/2022, medicamento novo é aquele com IFA sintético ou semissintético ainda não registrado no país."],
      requisitos:["Comprovação completa de qualidade, segurança e eficácia, com estudos não clínicos e clínicos.","Escolha entre via de registro completa ou abreviada (a abreviada permite usar dados já existentes no lugar de novos estudos, nas condições da norma).","Protocolo no código de assunto de medicamento novo previsto na IN nº 184/2022."],
      normas:["rdc753","in184"]});
    pend("Confirmar que o IFA nunca teve registro no Brasil, inclusive registros cancelados ou caducos.",true);
    pend("Confirmar a Denominação Comum Brasileira (DCB) da substância ou pedir sua inclusão.");
    finishCommon(a,out,pend); return out;
  }

  if(naoVigente){
    add({id:"novo",titulo:"Medicamento novo",grau:"Possível",
      porque:["O IFA já esteve em medicamentos registrados, mas sem registro vigente hoje.","O material de orientação da Anvisa sobre a RDC nº 753/2022 trata de IFA com registro não mais válido no contexto de medicamento novo."],
      requisitos:["Confirmar com o texto da norma quais estudos podem ser aproveitados."],normas:["rdc753","in184"]});
    pend("Confirmar no texto da RDC nº 753/2022 o enquadramento de IFA com registro não mais válido.",true);
  }

  let difs = a.difs.slice();
  if(a.composicao==="assoc" && a.assocRegistrada==="nao" && !difs.includes("nova_assoc")){ difs = difs.filter(d=>d!=="nenhuma"); difs.push("nova_assoc"); }
  const innov = difs.filter(d=>d!=="nenhuma");
  const semDif = difs.includes("nenhuma") && !innov.length;
  const label = Object.fromEntries(DIFS.map(d=>[d[0],d[1].toLowerCase()]));

  if(innov.length){
    const certo = a.ifaStatus==="sim" && a.ifaRegistro==="vigente";
    const req = ["Comprovação de segurança e eficácia proporcional à inovação, com possibilidade de aproveitar dados existentes (via abreviada), nas condições da RDC nº 753/2022.",
      "Protocolo no código de assunto de medicamento inovador correspondente, conforme a IN nº 184/2022.",
      "Considerar audiência ou protocolo prévio com a Anvisa para alinhar o código de assunto antes do pedido."];
    if(innov.includes("nova_conc")) req.push("Para nova concentração, a Anvisa indica que não cabe bioisenção com base em outras concentrações, porque o registro exige avaliação clínica.");
    add({id:"inovador",titulo:"Medicamento inovador",grau:certo?"Mais provável":"Possível",lead:!naoVigente,
      porque:["O IFA já tem medicamento registrado e o produto traz diferença em relação a ele: "+innov.map(d=>label[d]).join(", ")+".",
        "A IN nº 184/2022 prevê assuntos de registro de medicamento inovador para mudanças desse tipo (por exemplo, nova combinação de IFAs já registrados)."],
      requisitos:req,normas:["rdc753","in184","rdc742","rdc749"]});
    if(innov.length===1 && innov[0]==="tecnologia") pend("Confirmar se a tecnologia diferenciada configura inovação ou apenas alteração de formulação; isso muda o enquadramento.",true);
    if(innov.includes("nova_assoc")) pend("Confirmar se a associação (IFAs e proporções) já existe registrada; se existir, a análise pode mudar para genérico ou similar.");
  }

  if(semDif){
    const refOk = a.refExiste==="sim";
    const bioReq = ["Estudo de equivalência farmacêutica frente ao medicamento de referência, em centro habilitado.",
      "Estudo de biodisponibilidade relativa/bioequivalência conforme a RDC nº 742/2022, ou justificativa de bioisenção pela RDC nº 749/2022.",
      "Medicamento de referência da LMR vigente como comparador (RDC nº 957/2024 e IN da LMR)."];
    const liquida = /Solução|Colírio|Aerossol|Creme|Pomada|Gel/.test(a.forma);
    if(liquida) bioReq.push("Para a forma farmacêutica informada, avaliar a hipótese de bioisenção em razão da forma, via ou local de ação (RDC nº 749/2022).");
    if(refOk){
      const g = a.intercambio==="generico", s = a.intercambio==="similar";
      add({id:"generico",titulo:"Medicamento genérico",grau:g?"Mais provável":"Possível",lead:g||(!s),
        porque:["Mesmo IFA, concentração, forma, via, posologia e indicação de um medicamento já registrado, com referência identificado.",
          g?"Você pretende que o produto seja intercambiável e identificado pela DCB, sem marca.":"O genérico é identificado pela DCB, sem nome comercial."],
        requisitos:bioReq.concat(["Designação pela DCB, conforme a Lei nº 9.787/1999.","Verificação da situação patentária do medicamento de referência."]),
        normas:["lei9787","rdc753","rdc742","rdc749","rdc957","lmr"]});
      add({id:"similar",titulo:"Medicamento similar",grau:s?"Mais provável":"Possível",lead:s,
        porque:["Contém o mesmo IFA, concentração, forma, via, posologia e indicação do referência, mas é identificado por nome comercial ou marca.",
          s?"Você pretende usar nome comercial.":"Esta via se aplica se o produto for comercializado com marca."],
        requisitos:bioReq.concat(["Nome comercial ou marca próprios."]),
        normas:["lei9787","rdc753","rdc742","rdc749","rdc957","lmr"]});
      if(!a.intercambio || a.intercambio==="indefinido") pend("Definir se o produto terá nome comercial (similar) ou só a DCB (genérico).");
    } else {
      add({id:"gensim",titulo:"Genérico ou similar, dependendo do referência",grau:"Depende de verificação",lead:true,
        porque:["O produto não tem diferenças em relação a um medicamento já registrado, mas o medicamento de referência não foi identificado.","Genéricos e similares são registrados por comparação com um medicamento de referência da LMR."],
        requisitos:["Consultar a LMR vigente (Grupo A para um IFA, Grupo B para associações).","Se não houver referência na lista, discutir com a Anvisa: a RDC nº 957/2024 prevê critérios de indicação e a eleição de substituto."],
        normas:["rdc957","lmr","rdc753"]});
      pend("Identificar o medicamento de referência na LMR vigente.",true);
    }
    out.passos.push("Se o produto for idêntico a um medicamento já registrado da mesma empresa ou grupo (petição matriz), avaliar o procedimento simplificado da RDC nº 954/2024.");
    out.normas.add("rdc954");
  }

  if(ifaIncerto){
    add({id:"novo",titulo:"Medicamento novo",grau:"Depende de verificação",
      porque:["Você não sabe se o IFA tem registro no Brasil. Se não tiver, o caminho provável é medicamento novo."],
      requisitos:["Ver requisitos de medicamento novo na base normativa."],normas:["rdc753","in184"]});
    out.caminhos.forEach(c=>{ if(c.grau==="Mais provável") c.grau="Possível"; });
    pend("Verificar se o IFA tem registro vigente no Brasil. Essa resposta muda toda a análise.",true);
  } else if(a.ifaStatus==="sim" && a.ifaRegistro==="nao_sei"){
    out.caminhos.forEach(c=>{ if(c.grau==="Mais provável") c.grau="Possível"; });
    pend("Verificar se há registro vigente com esse IFA, e não apenas registros antigos ou cancelados.",true);
  }

  if(!out.caminhos.length){
    add({id:"indef",titulo:"Sem enquadramento com os dados informados",grau:"Depende de verificação",lead:true,
      porque:["As respostas não bastam para aplicar as regras do motor."],requisitos:[],normas:["rdc753"]});
    pend("Revisar as características do produto em relação aos medicamentos já registrados.",true);
  }
  if(!out.caminhos.some(c=>c.lead)) out.caminhos[0].lead = true;
  finishCommon(a,out,pend);
  return out;
}
function finishCommon(a,out,pend){
  out.requisitos = ["Certificado de Boas Práticas de Fabricação (CBPF) emitido pela Anvisa para os locais de fabricação.","Dossiê de qualidade do IFA e do produto acabado, nos termos da norma aplicável.","Rotulagem, bula e embalagens conforme as normas vigentes."];
  if(!a.indicacao.trim()) pend("Descrever a indicação terapêutica pretendida.");
  if(a.ativos.some(x=>x.nome.trim() && !x.conc.trim())) pend("Informar a concentração de todos os IFAs.");
  if(a.composicao==="outra") pend("Detalhar a composição informada como 'outra'.");
  if(a.refExiste==="nao_sei") pend("Verificar a existência de medicamento de referência na LMR.");
  out.passos.unshift(
    "Consultar a situação de registro do IFA e dos medicamentos relacionados na consulta pública da Anvisa.",
    "Ler os artigos da norma principal indicada na seção F e conferir as definições da categoria.",
    "Resolver os pontos da seção D antes de planejar estudos."
  );
  out.passos.push("Para casos de enquadramento incerto, solicitar audiência ou protocolo prévio com a Anvisa.","Validar a análise com profissional de assuntos regulatórios.");
}

