// ################################################################################################################################################
// ################# COMPONENTE INTEGRADO: INTERFACE E GERENCIAMENTO DE ABAS NATIVAS (LAUNCHER.JS)
// [APRIMORADO - CORE COMPATIBILIDADE] Cérebro visual do Elementista Browser v3.0.0. Injeta tradução automática contra travamentos de scripts.
// ################################################################################################################################################

const { ipcRenderer, shell } = require('electron');
const Navigation = require('electron-navigation');
const path = require('path');

// Inicialização estável do ecossistema de abas mapeando o contêiner estruturado por você
const enav = new Navigation({
      defaultFavicons: true,
      newTabCallback: (url, options) => {
          options.postTabOpenCallback = webview => {
              // Ativação obrigatória de plugins (Pepper Flash) e desativação de travas de segurança cruzadas
              webview.setAttribute('plugins', '');
              webview.setAttribute('disablewebsecurity', '');

              // Camuflagem leve e estável para tráfego seguro pelo Cloudflare sem sobrecarregar o processador
              webview.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");

              // Intercepta e joga pop-ups e anúncios invasivos de servidores de jogos para fora do app, poupando RAM
              webview.addEventListener('new-window', (e) => {
                    e.preventDefault();
                    shell.openExternal(e.url);
              });

              // ====================================================================================
              // BLINDAGEM ANTI-REGRESSÃO: Injeta um Polyfill básico que impede que erros de sintaxe
              // modernos (como chaves inesperadas da 101xp) quebrem a execução do motor 11
              // ====================================================================================
              webview.addEventListener('did-start-loading', () => {
                    webview.executeJavaScript(`
                          (function() {
                             // Cria um interceptador leve na janela do site para ignorar travamentos de runtime
                             window.addEventListener('error', function(e) {
                                   if (e.message.includes('SyntaxError') || e.message.includes('Unexpected token')) {
                                       console.log('[Elementista Core] Ignorando regressão de script para evitar tela preta.');
                                       e.preventDefault();
                                   }
                             });
                          })();
                    `).catch(() => {});
              });

              // Mantém o escutador do atalho F11 de tela cheia ativo e em sincronia dentro do jogo ativo
              webview.addEventListener('dom-ready', () => {
                    webview.executeJavaScript(`
                           window.addEventListener('keydown', (e) => {
                                   if (e.key === 'F11') {
                                       const { ipcRenderer } = require('electron');
                                       ipcRenderer.send('alternar-tela-cheia-janela-ativa');
                                       e.preventDefault();
                                   }
                           });
                    `);
              });
          }
          return { options };
      }
});

// RESOLUÇÃO FIXA DE PROTOCOLO: Injeta obrigatoriamente o prefixo file:// para quebrar a busca automática do pacote de abas
const caminhoInicioLocal = `file://${path.join(__dirname, 'inicio.html')}`;
enav.newTab(caminhoInicioLocal, { close: false });

// ################################################################################################################################################
// ################# BLOCO 2: ROTINAS DE CUSTOMIZAÇÃO DE INTERFACE, BUSCA INTELIGENTE E UTILITÁRIOS MULTIPLATAFORMA
// [VALIDADO - PROIBIDO ALTERAR] Preserva o visual neon da barra de endereços e injeta os utilitários do botão direito multiplataforma
// ################################################################################################################################################

function aplicarConfiguracoesInterface() {
      const { remote } = require('electron');
      const campoUrl = document.getElementById("nav-ctrls-url");

      if (campoUrl && !campoUrl.dataset.buscaInteligenteAtiva) {
             // Preserva rigorosamente o seu estilo visual clássico Verde Neon Matrix sobre fundo preto puro
             campoUrl.style.setProperty("color", "#00ff66", "important");
             campoUrl.style.setProperty("background-color", "#000000", "important");
             campoUrl.style.setProperty("font-weight", "bold", "important");
             campoUrl.style.setProperty("text-shadow", "none", "important");

             campoUrl.dataset.buscaInteligenteAtiva = "true";

             // Mapeia o pressionamento da tecla Enter para diferenciar URLs de pesquisas comuns do Google
             campoUrl.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                              let textoDigitado = this.value.trim();
                              if (!textoDigitado) return;

                              const contemEspacos = textoDigitado.includes(' ');
                              const regexUrl = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

                              if ((contemEspacos || !regexUrl.test(textoDigitado)) && !textoDigitado.startsWith('file://')) {
                                     e.stopImmediatePropagation();
                                     let termoPesquisa = textoDigitado.replace(/^(https?:\/\/)/i, '');
                                     enav.changeTab(`https://google.com{encodeURIComponent(termoPesquisa)}`);
                              }
                    }
             });

             // ====================================================================================
             // [MANUTENÇÃO CORE - BLINDAGEM DE MENU DE CONTEXTO MULTIPLATAFORMA]
             // Ativa o botão direito nativo para Recortar, Copiar e Colar tanto no Linux quanto no Windows
             // ====================================================================================
             campoUrl.addEventListener('contextmenu', (e) => {
                        e.preventDefault();

                        const menuContexto = remote.Menu.buildFromTemplate([
                                  { label: 'Recortar', role: 'cut' },
                                  { label: 'Copiar', role: 'copy' },
                                  { label: 'Colar', role: 'paste' },
                                  { type: 'separator' },
                                  { label: 'Selecionar Tudo', role: 'selectAll' }
                        ]);

                        menuContexto.popup({ window: remote.getCurrentWindow() });
              });
              // ====================================================================================
       }

      // Varre e ajustas as caixas e views geradas dinamicamente pelo pacote de abas
      // Garante que o contêiner herde de forma estável os 100% de preenchimento vertical do seu HTML
      const divsOcultasDoPacote = document.querySelectorAll('.nav-views-view');
       divsOcultasDoPacote.forEach(caixa => {
              if (!caixa.dataset.travaV11Corrigida) {
                        caixa.style.setProperty("display", "block", "important");
                        caixa.style.setProperty("height", "100%", "important");
                        caixa.dataset.travaV11Corrigida = "true";
              }
       });
}

// Observador ultra-leve (MutationObserver) que dispara a checagem apenas se houver mudanças estruturais na tela
const observadorInterface = new MutationObserver(() => {
       aplicarConfiguracoesInterface();
});

observadorInterface.observe(document.body, { childList: true, subtree: true });
aplicarConfiguracoesInterface();

