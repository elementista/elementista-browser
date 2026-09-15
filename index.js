const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const isPackaged = app.isPackaged;
const baseDir = isPackaged ? process.resourcesPath : __dirname;

const isWindows = process.platform === 'win32';
const pluginName = isWindows ? 'flashver/pepflashplayer.dll' : 'flashver/libpepflashplayer.so';
const pluginPath = path.join(baseDir, pluginName);

// Otimizações do motor Flash Player nativo para Linux e Windows
app.commandLine.appendSwitch('ppapi-flash-path', pluginPath);
app.commandLine.appendSwitch('register-pepper-plugins', `${pluginPath};application/x-shockwave-flash`);
app.commandLine.appendSwitch('enable-plugins');
app.commandLine.appendSwitch('always-authorize-plugins', 'true');
app.commandLine.appendSwitch('allow-outdated-plugins', 'true');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'UseOzonePlatform'); // Garante letras nítidas no Wayland

function criarJanela(isPrincipal = false) {
    const idUnico = Date.now();
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        title: isPrincipal ? "Elementista Browser" : "Elementista Browser - Nova Instância",
        backgroundColor: '#1a1a1a',
        //icon: path.join(__dirname, 'build', 'icons', '512x512', 'icon.png'), // Proteção extra de ícone para o Arch Linux
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            plugins: true,
            contextIsolation: false,
            enableRemoteModule: true,
            webSecurity: false,
            allowRunningInsecureContent: true,
            partition: isPrincipal ? "persist:launcher_main" : `conta_extra_clean_${idUnico}`
        }
    });

    win.loadURL(`file://${__dirname}/browser.html`);
}

function lancarNovoProcessoDoApp() {
    const executavel = process.execPath;
    const idUnico = Date.now();
    const pastaIsolada = path.join(app.getPath('userData'), '..', `elementista_browser_session_${idUnico}`);

    const argumentos = [
        app.getAppPath(),
        `--user-data-dir=${pastaIsolada}`,
        '--incognito',
        '--disable-http-cache'
    ];

    spawn(executavel, argumentos, {
        detached: true,
        stdio: 'ignore'
    }).unref();
}

function configurarMenuSistemaPTBR() {
    const templateMenu = [
        {
            label: 'Arquivo',
            submenu: [
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
                    label: 'Recarregar Página',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) { if (focusedWindow) focusedWindow.webContents.reload(); }
                },
                {
                    label: 'Limpar Cache e Reiniciar',
                    accelerator: 'CmdOrCtrl+F5',
                    async click(item, focusedWindow) {
                        if (focusedWindow) {
                            await focusedWindow.webContents.session.clearCache();
                            app.relaunch();
                            app.exit();
                        }
                    }
                },
                { type: 'separator' },
                { label: 'Resetar Zoom', role: 'resetZoom' },
                { label: 'Aumentar Zoom', role: 'zoomIn' },
                { label: 'Diminuir Zoom', role: 'zoomOut' },
                { type: 'separator' },
                {
                    label: 'Alternar Tela Cheia',
                    accelerator: 'F11',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            ]
        },
        {
            label: 'Janela',
            submenu: [
                { label: 'Minimizar', role: 'minimize' },
                { label: 'Fechar Janela', role: 'close' },
                { type: 'separator' },
                {
                    label: 'Abrir Nova Instância (Limpa)',
                    accelerator: 'CmdOrCtrl+N',
                    click() {
                        lancarNovoProcessoDoApp();
                    }
                }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Sobre o Elementista Browser',
                    click() {
                        const { dialog } = require('electron');
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Sobre',
                            message: 'Elementista Browser',
                            detail: 'Navegador para jogos que usam flash player\n\nDesenvolvido por: pacjay / elementista\n\nCompatibilidade total com X11 e Wayland.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(templateMenu);
    Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
    configurarMenuSistemaPTBR();
    
    // Escuta o rádio do F11 enviado pelo launcher.js e localiza a janela dona da aba de forma precisa
    ipcMain.on('alternar-tela-cheia-janela-ativa', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
            win.setFullScreen(!win.isFullScreen());
        }
    });

    // Clique direito livre e nativo em qualquer janela ou aba
    app.on('web-contents-created', (event, webContents) => {
        webContents.on('context-menu', (e, props) => {
            const menuContexto = Menu.buildFromTemplate([
                { label: 'Copiar', role: 'copy' },
                { label: 'Colar', role: 'paste' },
                { type: 'separator' },
                { label: 'Selecionar Tudo', role: 'selectAll' },
                { type: 'separator' },
                {
                    label: 'Inspecionar Elemento',
                    click() { webContents.openDevTools(); }
                }
            ]);
            menuContexto.popup();
        });
    });

    criarJanela(true); // Inicializa a primeira janela
});

app.on('window-all-closed', () => {
    app.quit();
});
