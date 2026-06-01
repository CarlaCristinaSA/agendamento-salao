const fs = require('fs');
const { execSync } = require('child_process');

const htmlPath = 'frontend/pages/admin/tela-inicial-adm.html';
const cssPath = 'frontend/css/tela-inicial-adm.css';
const jsPath = 'frontend/js/tela-inicial-adm.js';

const htmlFull = fs.readFileSync(htmlPath, 'utf8');
const cssFull = fs.readFileSync(cssPath, 'utf8');
const jsFull = fs.readFileSync(jsPath, 'utf8');

function commit(msg) {
  execSync(`git add "${htmlPath}" "${cssPath}" "${jsPath}"`, { stdio: 'inherit' });
  try {
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log("Nothing to commit?");
  }
}

function safeIndexOf(str, target) {
  let idx = str.indexOf(target);
  if (idx === -1) {
    idx = str.indexOf(target.replace(/\n/g, '\r\n'));
  }
  if (idx === -1) {
     idx = str.indexOf(target.replace(/\r\n/g, '\n'));
  }
  return idx;
}

const htmlIdx1 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 1');
const htmlIdx2 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 2');
const htmlIdx3 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 3');
//const htmlIdx4 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 4');
const htmlIdx5 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 5');
//const htmlIdx6 = safeIndexOf(htmlFull, '<!-- ═══════════════════════ SECTION 6');
const htmlIdx7 = safeIndexOf(htmlFull, '<!-- ═══════════════════════════ FOOTER');

const cssIdx1 = safeIndexOf(cssFull, '/* ================================================================\nNAVBAR');
const cssIdx2 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 1');
const cssIdx3 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 2');
const cssIdx4 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 3');
//const cssIdx5 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 4');
const cssIdx6 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 5');
//const cssIdx7 = safeIndexOf(cssFull, '/* ================================================================\nSECTION 6');
const cssIdx8 = safeIndexOf(cssFull, '/* ================================================================\nFOOTER');
const cssIdx9 = safeIndexOf(cssFull, '/* ================================================================\nREVEAL ANIMATIONS');
const cssIdx10 = safeIndexOf(cssFull, '/* ================================================================\nMOBILE');

const jsIdx1 = safeIndexOf(jsFull, 'document.addEventListener(\'click\'');
const jsIdx2 = safeIndexOf(jsFull, '(function initScrollReveal() {');

let currentHtml = htmlFull.substring(0, htmlIdx1);
fs.writeFileSync(htmlPath, currentHtml + '</main>\n</body>\n</html>');
fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx1));
fs.writeFileSync(jsPath, '');
commit('feat(html): criar estrutura base e cabecalho da inicial adm');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx2));
commit('feat(css): adicionar variaveis globais e estilo da navbar');

currentHtml = htmlFull.substring(0, htmlIdx2);
fs.writeFileSync(htmlPath, currentHtml + '</main>\n</body>\n</html>');
commit('feat(html): adicionar secao hero de adm');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx3));
commit('feat(css): estilizar e formatar destaque no hero');

currentHtml = htmlFull.substring(0, htmlIdx3);
fs.writeFileSync(htmlPath, currentHtml + '</main>\n</body>\n</html>');
commit('feat(html): listar botoes de acesso rapido');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx4));
commit('feat(css): ajustar responsividade dos cards de acesso rapido');

currentHtml = htmlFull.substring(0, htmlIdx5);
fs.writeFileSync(htmlPath, currentHtml + '</main>\n</body>\n</html>');
commit('feat(html): implementar features sistemicas e modo de uso');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx6));
commit('feat(css): definir tipografia e margin nas secoes informativas');

currentHtml = htmlFull.substring(0, htmlIdx7);
fs.writeFileSync(htmlPath, currentHtml + '</main>\n</body>\n</html>');
commit('feat(html): incluir vantagens e CTA centralizado para conversao');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx8));
commit('feat(css): adicionar gradientes nas secoes why-us e cta');

fs.writeFileSync(htmlPath, htmlFull);
commit('feat(html): adicionar rodape global com brand');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx9));
commit('feat(css): organizar links em colunas no footer');

fs.writeFileSync(jsPath, jsFull.substring(0, jsIdx1));
commit('feat(js): implementar toggle do menu hamburguer');

fs.writeFileSync(jsPath, jsFull.substring(0, jsIdx2));
commit('fix(js): corrigir validacao de clique fora no off-canvas');

fs.writeFileSync(jsPath, jsFull);
commit('feat(js): adicionar IntersectionObserver para animacoes');

fs.writeFileSync(cssPath, cssFull.substring(0, cssIdx10));
commit('refactor(css): integrar estado CSS das classes do reveal');

fs.writeFileSync(cssPath, cssFull);
commit('refactor(css): ajustes finos para telas mobile e media queries');

console.log("Todos os commits iterativos foram gerados com sucesso!");
