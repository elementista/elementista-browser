// ################################################################################################################################################
// ################# BLOCO 1: IMPORTAÇÕES, COMPATIBILIDADE E DIRETIVAS DO MOTOR FLASH (CPU/GPU)
// [VALIDADO - PROIBIDO ALTERAR] Este bloco configura a inicialização estável e a aceleração máxima por GPU para o Legend Online no i7-4790
// ################################################################################################################################################

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isPackaged = app.isPackaged;

// RESOLUÇÃO DE CAMINHO DO FLASH: Aponta para a pasta resources/flashver correta gerada pelo extraResources
const baseDir = isPackaged
  ? path.join(process.resourcesPath, 'flashver')
  : path.join(__dirname, 'flashver');

const isWindows = process.platform === 'win32';
const pluginName = isWindows ? 'pepflashplayer.dll' : 'libpepflashplayer.so';
const pluginPath = path.join(baseDir, pluginName);

// Diretivas obrigatórias e validadas para o motor do Pepper Flash Player rodar sem travas
app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
app.commandLine.appendSwitch('register-pepper-plugins', `${pluginPath};application/x-shockwave-flash`);
app.commandLine.appendSwitch('enable-plugins');
app.commandLine.appendSwitch('always-authorize-plugins', 'true');
app.commandLine.appendSwitch('allow-outdated-plugins', 'true');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

// Ativação máxima de hardware e otimização gráfica de GPU contra travamentos no CachyOS
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Mantém desempenho constante em segundo plano se você abrir várias abas ou instâncias de RPG
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
// ################################################################################################################################################
// ######################## BLOCO 2: CÁLCULO DE ARMAZENAMENTO DE PERFORMANCE E CRIAÇÃO DA JANELA PRINCIPAL
// [VALIDADO - PROIBIDO ALTERAR] Gerencia a persistência do cache do game e aplica a injeção nativa para o .swf e menus de contexto multiplataforma
// ################################################################################################################################################

function calcularTamanhoPasta(caminhoPasta) {
    if (!fs.existsSync(caminhoPasta)) return 0;
    let tamanhoTotal = 0;
    try {
          const arquivos = fs.readdirSync(caminhoPasta);
          for (const arquivo of arquivos) {
              const caminhoAbsoluto = path.join(caminhoPasta, arquivo);
              const status = fs.statSync(caminhoAbsoluto);
              if (status.isDirectory()) {
                  tamanhoTotal += calcularTamanhoPasta(caminhoAbsoluto);
              } else {
                  tamanhoTotal += status.size;
              }
          }
    } catch (e) {}
    return tamanhoTotal;
}

function obterTamanhoCacheFormatado() {
    const pastaCache = path.join(app.getPath('userData'));
    const bytes = calcularTamanhoPasta(pastaCache);
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function criarJanela() {
    let win = new BrowserWindow({
          width: 1280,
          height: 720,
          title: "Elementista Browser versão 3.11.5",
          icon: path.join(__dirname, 'logo-escudo.png'),
          webPreferences: {
              nodeIntegration: true,
              webviewTag: true,             // Permite o uso da nossa tag webview nativa envelopada
              plugins: true,             // Habilita os plugins PPAPI (Flash Player)
              contextIsolation: false,      // Mantém seus scripts se comunicando de forma direta e sem barreiras
              enableRemoteModule: true,          // Destrava o módulo remote para menus de contexto e botão direito
              webSecurity: false            // Destrava os logins cruzados e o fluxo fluido do Legend Online
          }
    });

    // ====================================================================================
    // INTERCEPTADOR NATIVO EM PORTA DE EXECUÇÃO CORE:
    // Captura as instâncias criadas pelo pacote e gerencia o tamanho do .swf e o menu de contexto padrão dos sites
    // ====================================================================================
    win.webContents.on('did-attach-webview', (event, webContents) => {

          // Força o .swf a ocupar 100% da tela vertical assim que carregar
          webContents.on('did-finish-load', () => {
              const urlAtiva = webContents.getURL().toLowerCase();
              if (urlAtiva.endsWith('.swf') || urlAtiva.includes('.swf?')) {
                  webContents.insertCSS(`
                    html, body, object, embed {
                         width: 100% !important;
                         height: 100% !important;
                         margin: 0 !important;
                         padding: 0 !important;
                         overflow: hidden !important;
                         display: block !important;
                           }
                     `);
                }
          });

          // MENU DE CONTEXTO PADRÃO E COMPLETO DE NAVEGADORES (DENTRO DOS SITES)
          webContents.on('context-menu', (e, params) => {
                const templateCompleto = [
                     { label: 'Voltar', enabled: webContents.canGoBack(), click() { webContents.goBack(); } },
                     { label: 'Avançar', enabled: webContents.canGoForward(), click() { webContents.goForward(); } },
                     { label: 'Recarregar', click() { webContents.reload(); } },
                     { type: 'separator' },
                     { label: 'Recortar', role: 'cut', visible: params.isEditable },
                     { label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy },
                     { label: 'Colar', role: 'paste', visible: params.isEditable, enabled: params.editFlags.canPaste },
                     { label: 'Selecionar Tudo', role: 'selectAll', visible: params.isEditable },
                     { type: 'separator' }
                ];

                if (params.linkURL) {
                     templateCompleto.push(
                           { label: 'Copiar Endereço do Link', click() { require('electron').clipboard.writeText(params.linkURL); } },
                           { type: 'separator' }
                     );
                }

                templateCompleto.push(
                     { label: 'Salvar Página Como...', click() { webContents.downloadURL(webContents.getURL()); } },
                     { label: 'Imprimir...', click() { webContents.print(); } },
                     { type: 'separator' },
                     { label: 'Inspecionar Elemento', click() { webContents.openDevTools(); } }
                );

                const menu = Menu.buildFromTemplate(templateCompleto);
                menu.popup(win);
          });
    });

    // ====================================================================================
    // MENU DE CONTEXTO PADRÃO E COMPLETO DA CASCA EXTERNA (BARRA DE URL)
    // ====================================================================================
    win.webContents.on('context-menu', (event, params) => {
          const templateBarra = [
                { label: 'Desfazer', role: 'undo', enabled: params.editFlags.canUndo },
                { label: 'Refazer', role: 'redo', enabled: params.editFlags.canRedo },
                { type: 'separator' },
                { label: 'Recortar', role: 'cut', visible: params.isEditable },
                { label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy },
                { label: 'Colar', role: 'paste', visible: params.isEditable, enabled: params.editFlags.canPaste },
                { label: 'Deletar', role: 'delete', visible: params.isEditable },
                { type: 'separator' },
                { label: 'Selecionar Tudo', role: 'selectAll', visible: params.isEditable },
                { type: 'separator' },
                { label: 'Inspecionar Interface', click() { win.webContents.openDevTools(); } }
          ];

          const menu = Menu.buildFromTemplate(templateBarra);
          menu.popup(win);
    });

    // Carrega a sua interface mestre onde o player-container foi reestruturado por você
    win.loadURL(`file://${__dirname}/browser.html`);
}
// ################################################################################################################################################
// ################# BLOCO 3: MENUS DO SISTEMA BLINDADOS (PT-BR) E INICIALIZADORES DO APLICATIVO
// [VALIDADO - PROIBIDO ALTERAR] Controla as funções vitais de manutenção de Cache, Zoom fluido de exibição, Sobre e controle de Ciclo de Vida
// ################################################################################################################################################

function configurarMenuSistemaPTBR() {
    const templateMenu = [
          {
                label: 'Arquivo',
                submenu: [
                     {
                           label: 'Nova Instância Limpa',
                           accelerator: 'CmdOrCtrl+N',
                           click() { criarJanela(); } // Inicializa uma nova sessão gráfica independente
                     },
                     { type: 'separator' },
                     { label: 'Sair', role: 'quit' }
                ]
          },
          {
                label: 'Editar',
                submenu: [
                     { label: 'Desfazer', role: 'undo' },
                     { label: 'Refazer', role: 'redo' },
                     { type: 'separator' },
                     { label: 'Recortar', role: 'cut' },
                     { label: 'Copiar', role: 'copy' },
                     { label: 'Colar', role: 'paste' },
                     { label: 'Selecionar Tudo', role: 'selectAll' }
                ]
          },
          {
                label: 'Exibir',
                submenu: [
                     {
                          label: 'Recarregar Jogo (F5)',
                          accelerator: 'F5',
                          click(item, focusedWindow) { if (focusedWindow) focusedWindow.webContents.reload(); }
                     },
                     { type: 'separator' },
                     {
                          label: 'Alternar Tela Cheia (F11)',
                          accelerator: 'F11',
                          click(item, focusedWindow) { if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen()); }
                     },
                     { type: 'separator' },
                     {
                          label: 'Aumentar Zoom (Ctrl +)',
                          accelerator: 'CmdOrCtrl+Plus',
                          click(item, focusedWindow) {
                              if (focusedWindow) {
                                  let currentZoom = focusedWindow.webContents.getZoomLevel();
                                  focusedWindow.webContents.setZoomLevel(currentZoom + 0.5);
                              }
                          }
                     },
                     {
                          label: 'Diminuir Zoom (Ctrl -)',
                          accelerator: 'CmdOrCtrl+-',
                          click(item, focusedWindow) {
                              if (focusedWindow) {
                                  let currentZoom = focusedWindow.webContents.getZoomLevel();
                                  focusedWindow.webContents.setZoomLevel(currentZoom - 0.5);
                              }
                          }
                     },
                     {
                          label: 'Resetar Zoom (Ctrl 0)',
                          accelerator: 'CmdOrCtrl+0',
                          click(item, focusedWindow) { if (focusedWindow) focusedWindow.webContents.setZoomLevel(0); }
                     }
                ]
          },
          {
                label: 'Gerenciar Armazenamento',
                submenu: [
                     {
                          label: 'Ver Espaço Ocupado pelo Cache',
                          click(item, focusedWindow) {
                              if (focusedWindow) {
                                  const tamanho = obterTamanhoCacheFormatado();
                                  dialog.showMessageBox(focusedWindow, {
                                        type: 'info',
                                        title: 'Armazenamento de Cache',
                                        message: `O cache acumulado em disco está ocupando atualmente: ${tamanho}`,
                                        detail: 'Este cache armazena mapas, gráficos e dados para acelerar o carregamento do jogo.',
                                        buttons: ['Ok']
                                  });
                              }
                          }
                     },
                     { type: 'separator' },
                     {
                          label: 'Limpar Todo o Cache e Reiniciar',
                          click(item, focusedWindow) {
                              if (focusedWindow) {
                                  dialog.showMessageBox(focusedWindow, {
                                        type: 'question',
                                        title: 'Limpar Cache',
                                        message: 'Tem certeza de que deseja apagar os arquivos temporários do jogo?',
                                        detail: 'O jogo recarregará do zero no próximo início. O aplicativo voltará para a tela inicial automaticamente.',
                                        buttons: ['Sim, Limpar', 'Cancelar'],
                                        defaultId: 0,
                                        cancelId: 1
                                  }).then((result) => {
                                        if (result.response === 0) {
                                            const { exec } = require('child_process');
                                            const pastaUserData = app.getPath('userData');

                                            if (process.platform === 'win32') {
                                                exec(`del /s /q /f "${pastaUserData}\\Cache\\*.*" "${pastaUserData}\\Code Cache\\*.*" "${pastaUserData}\\GPUCache\\*.*" "${pastaUserData}\\ShaderCache\\*.*"`, () => {
                                                      focusedWindow.webContents.session.clearCache().then(() => {
                                                            focusedWindow.loadURL(`file://${__dirname}/browser.html`);
                                                      });
                                                });
                                            } else {
                                                exec(`rm -rf "${pastaUserData}"/Cache "${pastaUserData}"/"Code Cache" "${pastaUserData}"/GPUCache "${pastaUserData}"/ShaderCache`, () => {
                                                      focusedWindow.webContents.session.clearCache().then(() => {
                                                            focusedWindow.loadURL(`file://${__dirname}/browser.html`);
                                                      });
                                                });
                                            }
                                        }
                                  });
                              }
                          }
                     }
                ]
          },
          {
                label: 'Ajuda',
                submenu: [
                     {
                          label: 'Sobre o Elementista Browser',
                          click(item, focusedWindow) {
                              if (focusedWindow) {
                                  dialog.showMessageBox(focusedWindow, {
                                        type: 'info',
                                        title: 'Sobre o Elementista Browser',
                                        message: 'Elementista Browser v3.11.5\n\nNavegador portátil e otimizado desenvolvido para preservação e execução de jogos clássicos em Flash Player com aceleração máxima por hardware.\n\n[Minha Matrix. Meu Mundo. Minhas Regras.]',
                                        buttons: ['Ok']
                                  });
                              }
                          }
                     }
                 ]
            }
      ];

      const menu = Menu.buildFromTemplate(templateMenu);
      Menu.setApplicationMenu(menu);
}

// Inicializador central do ecossistema Electron
app.on('ready', () => {
      configurarMenuSistemaPTBR();

      ipcMain.on('alternar-tela-cheia-janela-ativa', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) win.setFullScreen(!win.isFullScreen());
      });

      criarJanela();
});

app.on('window-all-closed', () => { app.quit(); });

