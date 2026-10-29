"use strict";
/* =========================================================
   1. FONTES NORMATIVAS (camada de dados — independente da UI)
   status: "conferida" = vigência conferida em fonte em CHECKED
           "conferir"  = citada em fonte, vigência/atualizações não conferidas
   ========================================================= */
const CHECKED = "29/10/2026";
const ANVISA = "https://www.gov.br/anvisa/pt-br";
const NORMAS = {
  lei6360:{cod:"Lei nº 6.360/1976",titulo:"Vigilância sanitária de medicamentos",resumo:"Base legal do registro de medicamentos no Brasil. É citada como fundamento pela RDC nº 753/2022.",status:"conferida",fonte:"Planalto",url:"https://www.planalto.gov.br/ccivil_03/leis/l6360.htm"},
  lei9787:{cod:"Lei nº 9.787/1999",titulo:"Lei dos Medicamentos Genéricos",resumo:"Define medicamento genérico, de referência e similar, a denominação pela DCB e a intercambialidade.",status:"conferir",fonte:"Planalto",url:"https://www.planalto.gov.br/ccivil_03/leis/l9787.htm"},
  rdc753:{cod:"RDC nº 753/2022",titulo:"Registro de medicamentos sintéticos e semissintéticos",resumo:"Critérios e documentação mínima para registro de medicamentos novos, inovadores, genéricos e similares com IFA sintético ou semissintético. Revisou a RDC nº 200/2017 e criou as vias de registro completa e abreviada. Não se aplica a produtos regidos por legislação específica.",status:"conferida",fonte:"Diário Oficial da União",url:"https://www.in.gov.br/en/web/dou/-/resolucao-rdc-n-753-de-28-de-setembro-de-2022-433925794"},
  in184:{cod:"IN nº 184/2022",titulo:"Assuntos de protocolo para novos e inovadores",resumo:"Define os códigos de assunto para pedir registro de medicamento novo ou inovador (por exemplo, inovador por nova associação). O assunto pode ser discutido antes com a Anvisa em audiência ou protocolo prévio.",status:"conferida",fonte:"Diário Oficial da União",url:"https://www.in.gov.br/en/web/dou/-/instrucao-normativa-in-n-184-de-28-de-setembro-de-2022-433925323"},
  rdc957:{cod:"RDC nº 957/2024",titulo:"Critérios da Lista de Medicamentos de Referência",resumo:"Critérios para indicar um medicamento como referência e procedimentos de inclusão e exclusão na LMR. Alterada pela RDC nº 1.037/2026.",status:"conferida",fonte:"Portal da Anvisa (buscar pelo número)",url:ANVISA},
  lmr:{cod:"IN nº 353/2025",titulo:"Lista de Medicamentos de Referência (LMR)",resumo:"Publica a LMR, dividida em Grupo A (um IFA) e Grupo B (dois ou mais IFAs). É atualizada por novas instruções normativas, como a IN nº 455/2026.",status:"conferida",fonte:"Portal da Anvisa (buscar pelo número)",url:ANVISA},
  rdc742:{cod:"RDC nº 742/2022",titulo:"Estudos de biodisponibilidade relativa e bioequivalência",resumo:"Critérios para conduzir estudos de BD/BE e farmacocinéticos que compõem dossiês de registro e pós-registro.",status:"conferida",fonte:"Anvisa",url:"https://antigo.anvisa.gov.br/documents/10181/5740831/(1)RDC_742_2022_COMP.pdf"},
  rdc749:{cod:"RDC nº 749/2022",titulo:"Isenção de estudos de BD/BE (bioisenção)",resumo:"Hipóteses de bioisenção: outras concentrações, sistema de classificação biofarmacêutica e razão da forma farmacêutica, via de administração ou local de ação. Revogou a RDC nº 37/2011. Aplica-se a genéricos, similares, novos e inovadores.",status:"conferida",fonte:"Cópia publicada pela SES-SP",url:"https://ses.sp.bvs.br/wp-content/uploads/2022/09/U_RS-MS-ANVISA-RDC-749_050922.pdf"},
  rdc954:{cod:"RDC nº 954/2024",titulo:"Procedimento simplificado de registro",resumo:"Petição primária simplificada vinculada a uma petição matriz já deferida, para genéricos, similares, específicos, dinamizados, fitoterápicos e biológicos. Em vigor desde 24/03/2025.",status:"conferida",fonte:"Cópia publicada pela SESA-ES",url:"https://saude.es.gov.br/Media/sesa/Legisla%C3%A7%C3%A3o/Outros/Resolu%C3%A7%C3%A3o%20da%20Diretoria%20Colegiada%20-%20RDC%20n%C2%BA%20954,%20de%2020_12_2024.pdf"},
  rdc26:{cod:"RDC nº 26/2014",titulo:"Fitoterápicos",resumo:"Registro de medicamentos fitoterápicos e registro ou notificação de produtos tradicionais fitoterápicos. Citada como referência pela RDC nº 954/2024.",status:"conferir",fonte:"Anvisa",url:ANVISA},
  rdc24:{cod:"RDC nº 24/2011",titulo:"Medicamentos específicos",resumo:"Registro de medicamentos específicos. Citada como referência pela RDC nº 954/2024.",status:"conferir",fonte:"Anvisa",url:ANVISA},
  rdc55:{cod:"RDC nº 55/2010",titulo:"Produtos biológicos",resumo:"Registro de produtos biológicos, incluindo a via de desenvolvimento por comparabilidade. Está em revisão na agenda regulatória; há alterações posteriores a conferir.",status:"conferir",fonte:"Anvisa",url:ANVISA},
  rdc576:{cod:"RDC nº 576/2021",titulo:"Notificação de medicamentos de baixo risco",resumo:"Notificação simplificada de medicamentos de baixo risco. A lista dos passíveis de notificação está na IN nº 106/2021 e atualizações.",status:"conferir",fonte:"Perguntas frequentes da Anvisa",url:"https://www.gov.br/anvisa/pt-br/acessoainformacao/perguntasfrequentes/medicamentos/medicamentos-de-notificacao-simplificada/p-r-notificados-2a-edicao.pdf"},
  rdc238:{cod:"RDC nº 238/2018",titulo:"Medicamentos dinamizados",resumo:"Regularização de medicamentos dinamizados (homeopáticos, antroposóficos e anti-homotóxicos).",status:"conferir",fonte:"Anvisa",url:ANVISA},
  rdc263:{cod:"RDC nº 263/2019",titulo:"Radiofármacos",resumo:"Registro de radiofármacos. Citada pela RDC nº 954/2024, que não admite petição simplificada para esses produtos.",status:"conferir",fonte:"Anvisa",url:ANVISA}
};

/* =========================================================
   2. DADOS DEMONSTRATIVOS (substâncias) — sem integração oficial
   ========================================================= */
const DEMO_IFAS = [
  {n:"Paracetamol",s:["acetaminofeno"]},{n:"Dipirona monoidratada",s:["metamizol"]},{n:"Ibuprofeno",s:[]},
  {n:"Losartana potássica",s:["losartana"]},{n:"Amoxicilina tri-hidratada",s:["amoxicilina"]},{n:"Omeprazol",s:[]},
  {n:"Cloridrato de metformina",s:["metformina"]},{n:"Sinvastatina",s:[]},{n:"Diclofenaco sódico",s:["diclofenaco"]},
  {n:"Sulfato de salbutamol",s:["salbutamol","albuterol"]},{n:"Dexametasona",s:[]},{n:"Ácido acetilsalicílico",s:["AAS"]}
];
const CONSULTA = "https://consultas.anvisa.gov.br/";

/* =========================================================
   3. PERGUNTAS (árvore condicional)
   ========================================================= */
const FORMAS = ["Comprimido","Comprimido de liberação modificada","Cápsula","Solução oral","Suspensão oral","Solução injetável","Pó para solução injetável","Creme","Pomada","Gel","Colírio","Aerossol para inalação","Outra"];
const VIAS = ["Oral","Intravenosa","Intramuscular","Subcutânea","Tópica","Oftálmica","Inalatória","Outra"];
const CLASSES = ["Analgésico / antipirético","Anti-inflamatório","Anti-hipertensivo","Antimicrobiano","Antidiabético","Hipolipemiante","Antiulceroso","Broncodilatador","Corticosteroide","Outra"];
const DIFS = [
  ["nova_conc","Nova concentração","Concentração diferente das já registradas para esse IFA."],
  ["nova_forma","Nova forma farmacêutica","Ex.: o IFA só existe em comprimido e o produto é solução oral."],
  ["nova_via","Nova via de administração",""],
  ["nova_ind","Nova indicação terapêutica","Indicação ainda não aprovada para esse IFA."],
  ["nova_assoc","Nova associação de IFAs","Combinação ainda não registrada."],
  ["nova_pos","Nova posologia ou regime","Esquema de dose diferente do aprovado."],
  ["tecnologia","Tecnologia farmacêutica diferenciada","Ex.: liberação modificada, nanotecnologia, sistema de liberação."],
  ["nenhuma","Nenhuma diferença","Mesmo IFA, concentração, forma, via, posologia e indicação de um medicamento já registrado."]
];

const blank = () => ({natureza:"",ifaStatus:"",ifaNome:"",ifaRegistro:"",refExiste:"",refNome:"",composicao:"",composicaoOutra:"",
  ativos:[{nome:"",conc:"",un:"mg"}],forma:"",formaOutra:"",via:"",viaOutra:"",indicacao:"",classe:"",difs:[],assocRegistrada:"",intercambio:"",tecnologiaDesc:""});

const STEPS = [
  {id:"natureza",label:"Escopo",show:()=>true},
  {id:"ifa",label:"Princípio ativo",show:()=>true},
  {id:"ref",label:"Referência",show:a=>a.natureza==="sintetico" && a.ifaStatus!=="nao"},
  {id:"comp",label:"Composição",show:()=>true},
  {id:"forma",label:"Forma farmacêutica",show:()=>true},
  {id:"via",label:"Via",show:()=>true},
  {id:"ind",label:"Indicação",show:()=>true},
  {id:"car",label:"Características",show:a=>a.natureza==="sintetico" && a.ifaStatus!=="nao"}
];
