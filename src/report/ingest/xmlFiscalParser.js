// Parser de XML fiscal (NF-e, NFC-e e NFS-e nacional) — extraído do
// importador em lote do módulo de Precificação (App.jsx `handleGlobalImport`)
// pra poder ser reaproveitado fora de um componente React, na ingestão do
// Report Semestral. Mantém o mesmo formato de item (`saidas`/`entradas`) pra
// poder alimentar `computeDashboardStats` sem nenhuma adaptação.
import JSZip from 'jszip';
import { CFOP_CONVERSION_MAP } from '../../constants';

const cleanCNPJ = (v) => (v ? v.replace(/\D/g, '') : '');

const safeExtract = (parent, tag) => {
  if (!parent) return '';
  const col = parent.getElementsByTagName(tag);
  return col && col.length > 0 ? col[0].textContent : '';
};

const safeNumber = (v) => {
  if (!v) return 0;
  const n = parseFloat(v.toString().replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

const IBGE_UF_MAP = { '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF' };

const converterCFOPEntrada = (cfop) => {
  if (!cfop) return cfop;
  const mapa = { '5': '1', '6': '2', '7': '3' };
  const primeiro = cfop[0];
  return mapa[primeiro] ? mapa[primeiro] + cfop.slice(1) : cfop;
};

const MAPA_PAGAMENTOS = {
  '01': 'Dinheiro', '02': 'Cheque', '03': 'Cartão de Crédito', '04': 'Cartão de Débito',
  '05': 'Crédito Loja', '10': 'Vale Alimentação', '11': 'Vale Refeição', '12': 'Vale Presente',
  '13': 'Vale Combustível', '14': 'Duplicata Mercantil', '15': 'Boleto Bancário',
  '16': 'Depósito Bancário', '17': 'PIX', '18': 'Transferência Bancária', '19': 'Fidelidade',
  '90': 'A Prazo / Faturado', '99': 'Outros / Não Informado',
};

function extractImpostoDestacado(detNode) {
  const imposto = detNode.getElementsByTagName('imposto')[0];
  if (!imposto) return { icms: 0, fcp: 0, pis: 0, cofins: 0, ibs: 0, cbs: 0, total: 0, temDados: false, temIBSCBS: false };

  let vICMS = 0, vFCP = 0;
  const icmsBlock = imposto.getElementsByTagName('ICMS')[0];
  if (icmsBlock && icmsBlock.children.length > 0) {
    const filho = icmsBlock.children[0];
    vICMS = safeNumber(safeExtract(filho, 'vICMS'));
    vICMS += safeNumber(safeExtract(filho, 'vICMSST'));
    vICMS += safeNumber(safeExtract(filho, 'vICMSSTRet'));
    vFCP = safeNumber(safeExtract(filho, 'vFCP'))
      + safeNumber(safeExtract(filho, 'vFCPST'))
      + safeNumber(safeExtract(filho, 'vFCPSTRet'));
  }

  let vPIS = 0;
  const pisBlock = imposto.getElementsByTagName('PIS')[0];
  if (pisBlock && pisBlock.children.length > 0) vPIS = safeNumber(safeExtract(pisBlock.children[0], 'vPIS'));

  let vCOFINS = 0;
  const cofinsBlock = imposto.getElementsByTagName('COFINS')[0];
  if (cofinsBlock && cofinsBlock.children.length > 0) vCOFINS = safeNumber(safeExtract(cofinsBlock.children[0], 'vCOFINS'));

  let vIBS = 0, vCBS = 0;
  const ibscbsBlock = imposto.getElementsByTagName('IBSCBS')[0];
  if (ibscbsBlock) {
    const gIBSCBS = ibscbsBlock.getElementsByTagName('gIBSCBS')[0];
    if (gIBSCBS) {
      vIBS = safeNumber(safeExtract(gIBSCBS, 'vIBS'));
      vCBS = safeNumber(safeExtract(gIBSCBS, 'vCBS'));
    }
  }

  const total = vICMS + vFCP + vPIS + vCOFINS;
  return { icms: vICMS, fcp: vFCP, pis: vPIS, cofins: vCOFINS, ibs: vIBS, cbs: vCBS, total, temDados: icmsBlock !== undefined, temIBSCBS: vIBS > 0 || vCBS > 0 };
}

function parseNFSe(xmlDoc, cleanLicense, globalId) {
  const infNFSe = xmlDoc.getElementsByTagName('infNFSe')[0];
  const infDPS = xmlDoc.getElementsByTagName('infDPS')[0];
  if (!infNFSe || !infDPS) return { blocked: true };

  const emitNFSe = infNFSe.getElementsByTagName('emit')[0];
  const prest = infDPS.getElementsByTagName('prest')[0];
  const toma = infDPS.getElementsByTagName('toma')[0];

  const prestCNPJ = cleanCNPJ(safeExtract(prest, 'CNPJ') || safeExtract(emitNFSe, 'CNPJ'));
  const tomaCNPJ = toma ? cleanCNPJ(safeExtract(toma, 'CNPJ')) : '';
  const isIssuer = prestCNPJ === cleanLicense;
  const isReceiver = tomaCNPJ === cleanLicense;
  if (!isIssuer && !isReceiver) return { blocked: true };
  const isSaida = isIssuer;

  const prestNome = safeExtract(emitNFSe, 'xNome') || 'Prestador';
  const tomaNome = toma ? (safeExtract(toma, 'xNome') || 'Tomador') : 'Tomador';
  const prestUF = safeExtract(emitNFSe?.getElementsByTagName('enderNac')?.[0], 'UF') || 'RJ';
  const tomaEndNac = toma?.getElementsByTagName('endNac')?.[0];
  const tomaCMun = safeExtract(tomaEndNac, 'cMun');
  const tomaUF = (tomaCMun ? IBGE_UF_MAP[tomaCMun.slice(0, 2)] : null) || prestUF;

  const peerCNPJ = isSaida ? tomaCNPJ : prestCNPJ;
  const peerNome = isSaida ? tomaNome : prestNome;
  const peerUF = isSaida ? tomaUF : prestUF;

  const servBlock = infDPS.getElementsByTagName('serv')[0];
  const cServBlock = servBlock?.getElementsByTagName('cServ')?.[0];
  const xDescServ = safeExtract(cServBlock, 'xDescServ') || 'Serviço';
  const cNBS = safeExtract(cServBlock, 'cNBS');
  const cTribNac = safeExtract(cServBlock, 'cTribNac');

  const vServPrest = infDPS.getElementsByTagName('vServPrest')[0];
  const vServ = safeNumber(safeExtract(vServPrest, 'vServ'));
  if (vServ <= 0) return { blocked: true };

  const valoresNFSe = infNFSe.getElementsByTagName('valores')[0];
  const vISSQN = safeNumber(safeExtract(valoresNFSe, 'vISSQN'));
  const tribMun = infDPS.getElementsByTagName('tribMun')[0];
  const tpRetISSQN = safeExtract(tribMun, 'tpRetISSQN');
  const issRetido = tpRetISSQN === '2';

  const item = {
    id: globalId, nNF: safeExtract(infNFSe, 'nNFSe') || '1',
    peerCNPJ, peerNome, peerUF, emitUF: prestUF,
    date: safeExtract(infDPS, 'dhEmi'),
    isNFCE: false, tipoDoc: 'NFSe',
    prodNome: xDescServ, prodNCM: '',
    prodNBS: cNBS, prodCodServ: cTribNac,
    prodValUnit: vServ, prodValTotal: vServ,
    prodQty: 1, prodUnit: 'SV', prodCFOP: '',
    formaPagamento: 'Outros',
    vISSQN, issRetido,
    impostoDestacado: { icms: 0, fcp: 0, pis: 0, cofins: 0, ibs: 0, cbs: 0, total: 0, temDados: false, temIBSCBS: false },
  };
  return { blocked: false, isSaida, item, nomeEmitente: isSaida ? prestNome : null };
}

function parseNFe(xmlDoc, cleanLicense, globalIdStart) {
  const emit = xmlDoc.getElementsByTagName('emit')[0];
  const dest = xmlDoc.getElementsByTagName('dest')[0];
  const emitCNPJ = cleanCNPJ(safeExtract(emit, 'CNPJ'));
  const destCNPJ = dest ? cleanCNPJ(safeExtract(dest, 'CNPJ')) : '';
  const isIssuer = emitCNPJ === cleanLicense;
  const isReceiver = destCNPJ === cleanLicense;
  if (!isIssuer && !isReceiver) return { blocked: true, items: [] };

  const ide = xmlDoc.getElementsByTagName('ide')[0];
  const nNF = safeExtract(ide, 'nNF');
  const modelo = safeExtract(ide, 'mod');
  const tpNF = safeExtract(ide, 'tpNF') ? safeExtract(ide, 'tpNF').trim() : '';
  const dhEmi = safeExtract(ide, 'dhEmi');

  // Se EU sou o destinatário → sempre entrada. Se EU sou o emitente → depende do tpNF.
  const isSaida = isReceiver ? false : (isIssuer ? (tpNF === '1') : false);
  const nomeEmitente = isIssuer ? (safeExtract(emit, 'xNome') || null) : null;

  const emitUFReal = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
  const destUFReal = dest ? safeExtract(dest.getElementsByTagName('enderDest')[0], 'UF') || 'RJ' : 'RJ';
  let peerCNPJ, peerNome, peerUF;
  if (isSaida) {
    peerCNPJ = dest ? (safeExtract(dest, 'CNPJ') || safeExtract(dest, 'CPF') || 'Consumidor Final') : 'Consumidor Final';
    peerNome = dest ? (safeExtract(dest, 'xNome') || 'Não Identificado') : 'Consumidor Final';
    const ed = dest ? dest.getElementsByTagName('enderDest')[0] : null;
    peerUF = ed ? (safeExtract(ed, 'UF') || 'RJ') : 'RJ';
  } else {
    peerCNPJ = safeExtract(emit, 'CNPJ');
    peerNome = safeExtract(emit, 'xNome');
    peerUF = safeExtract(emit.getElementsByTagName('enderEmit')[0], 'UF') || 'RJ';
  }

  const items = [];
  const dets = xmlDoc.getElementsByTagName('det');
  let globalId = globalIdStart;
  for (let j = 0; j < dets.length; j++) {
    const prod = dets[j].getElementsByTagName('prod')[0];
    const vProd = safeNumber(safeExtract(prod, 'vProd'));
    const vFrete = safeNumber(safeExtract(prod, 'vFrete'));
    const vSeg = safeNumber(safeExtract(prod, 'vSeg'));
    const vOutro = safeNumber(safeExtract(prod, 'vOutro'));
    const vDesc = safeNumber(safeExtract(prod, 'vDesc'));
    const impNode = dets[j].getElementsByTagName('imposto')[0];
    const ipiEls = impNode ? impNode.getElementsByTagName('vIPI') : [];
    const vIPI = ipiEls.length > 0 ? safeNumber(ipiEls[0].textContent) : 0;
    const valTotal = vProd + vFrete + vSeg + vOutro + vIPI - vDesc;
    const valUnit = safeNumber(safeExtract(prod, 'vUnCom'));
    const qty = safeNumber(safeExtract(prod, 'qCom'));
    if (valUnit <= 0 && valTotal <= 0) continue;

    const originalCFOP = safeExtract(prod, 'CFOP') ? safeExtract(prod, 'CFOP').trim() : '';
    let finalCFOP = originalCFOP;
    if (!isSaida && originalCFOP) finalCFOP = CFOP_CONVERSION_MAP[originalCFOP] || converterCFOPEntrada(originalCFOP);

    const pag = xmlDoc.getElementsByTagName('pag')[0];
    let codPag = '99';
    if (pag) { const dp = pag.getElementsByTagName('detPag')[0]; if (dp) codPag = safeExtract(dp, 'tPag') || '99'; }
    const formaPag = MAPA_PAGAMENTOS[codPag] || 'Outros';
    const impostoDestacado = extractImpostoDestacado(dets[j]);

    items.push({
      id: globalId++, nNF, peerCNPJ, peerNome,
      peerUF, emitUF: isSaida ? emitUFReal : destUFReal, date: dhEmi, isNFCE: modelo === '65',
      prodNome: safeExtract(prod, 'xProd'), prodNCM: safeExtract(prod, 'NCM'),
      prodValUnit: valUnit, prodValTotal: valTotal > 0 ? valTotal : valUnit * qty,
      prodQty: qty, prodUnit: safeExtract(prod, 'uCom') || 'UN',
      prodCFOP: finalCFOP, formaPagamento: formaPag,
      impostoDestacado,
    });
  }

  return { blocked: false, isSaida, items, nomeEmitente, nextGlobalId: globalId };
}

const LOTE_EXTRACAO = 100;

// Lê um array de promises-factory em lotes de tamanho fixo, em vez de tudo de
// uma vez (Promise.all cru) ou um de cada vez (await sequencial) — paraleliza
// sem estourar memória/handles quando há milhares de entradas (zip grande ou
// muitos arquivos soltos).
async function emLotes(itens, tamanhoLote, tarefa) {
  const resultados = [];
  for (let i = 0; i < itens.length; i += tamanhoLote) {
    // eslint-disable-next-line no-await-in-loop
    const lote = await Promise.all(itens.slice(i, i + tamanhoLote).map(tarefa));
    resultados.push(...lote);
  }
  return resultados;
}

// Expande File[]/FileList (aceita .xml soltos e .zip com .xml dentro) em uma
// lista de textos XML crus. Zip é o formato recomendado pra lotes grandes —
// selecionar/arrastar um .zip é bem mais rápido que milhares de arquivos
// soltos, e a extração de dentro dele roda em paralelo (em lotes) aqui.
async function expandirArquivos(files) {
  const xmlTexts = [];
  const arquivosXmlSoltos = [];

  for (const file of files) {
    const nomeMin = file.name.toLowerCase();
    if (nomeMin.endsWith('.zip')) {
      try {
        const zip = await JSZip.loadAsync(file);
        const xmlEntries = Object.values(zip.files).filter((f) => f.name.toLowerCase().endsWith('.xml') && !f.dir);
        const textos = await emLotes(xmlEntries, LOTE_EXTRACAO, (entry) => entry.async('string'));
        xmlTexts.push(...textos);
      } catch (e) {
        console.error('Erro ao abrir ZIP:', e);
      }
    } else if (nomeMin.endsWith('.xml')) {
      arquivosXmlSoltos.push(file);
    }
  }

  const textosSoltos = await emLotes(arquivosXmlSoltos, LOTE_EXTRACAO, (file) => file.text());
  xmlTexts.push(...textosSoltos);

  return xmlTexts;
}

/**
 * Processa um lote de arquivos XML/ZIP (NF-e, NFC-e, NFS-e) e devolve os
 * itens de saída/entrada pertencentes ao CNPJ licenciado — mesmo formato de
 * item usado pelo módulo de Precificação, pra poder alimentar
 * `computeDashboardStats` sem adaptação.
 *
 * @param {FileList|File[]} files
 * @param {string} licenseCNPJ - CNPJ do cliente (com ou sem máscara)
 * @param {(done: number, total: number) => void} [onProgress]
 */
export async function parseFiscalXmlBatch(files, licenseCNPJ, onProgress) {
  const xmlTexts = await expandirArquivos(Array.from(files || []));
  const cleanLicense = cleanCNPJ(licenseCNPJ);

  const saidas = [];
  const entradas = [];
  let blocked = 0;
  let globalId = Date.now();
  let empresaNomeDetectado = null;

  for (let i = 0; i < xmlTexts.length; i++) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlTexts[i], 'text/xml');

      if (xmlDoc.getElementsByTagName('infNFSe').length > 0) {
        const r = parseNFSe(xmlDoc, cleanLicense, globalId++);
        if (r.blocked) { blocked++; }
        else {
          if (r.nomeEmitente && !empresaNomeDetectado) empresaNomeDetectado = r.nomeEmitente;
          (r.isSaida ? saidas : entradas).push(r.item);
        }
      } else {
        const r = parseNFe(xmlDoc, cleanLicense, globalId);
        if (r.blocked) { blocked++; }
        else {
          globalId = r.nextGlobalId;
          if (r.nomeEmitente && !empresaNomeDetectado) empresaNomeDetectado = r.nomeEmitente;
          (r.isSaida ? saidas : entradas).push(...r.items);
        }
      }
    } catch (e) {
      console.error('Erro XML:', e);
      blocked++;
    }

    // Atualizar o progresso é barato (só re-renderiza um número) e faz isso a
    // cada item; já ceder o controle pro event loop tem custo real (mínimo
    // de alguns ms por chamada) — em lotes de milhares, ceder a cada 10 itens
    // soma segundos de overhead à toa. 50 ainda mantém a aba responsiva.
    onProgress?.(i + 1, xmlTexts.length);
    if (i % 50 === 0) {
      await new Promise((r) => setTimeout(r, 0)); // não travar a UI em lotes grandes
    }
  }

  onProgress?.(xmlTexts.length, xmlTexts.length);
  return { saidas, entradas, blocked, total: xmlTexts.length, empresaNomeDetectado };
}
