const { ipcRenderer } = require('electron');
const Navigation = require('electron-navigation');

// Inicializa o gerenciador de abas padrão
const enav = new Navigation({
  defaultFavicons: true,
  newTabCallback: (url, options) => {
    options.postTabOpenCallback = webview => {
      // Injeta o Flash Player original na aba
      webview.setAttribute('plugins', '');
      
      // Mascara o navegador para o portal aceitar o acesso
      webview.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36");

      // SOLUÇÃO DEFINITIVA DO F11 NO LINUX: Captura a tecla direto na página antes do Flash Player roubar o foco
      webview.addEventListener('dom-ready', () => {
        webview.executeJavaScript(`
          window.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
              // Avisa o processo principal que esta janela específica quer Alternar a Tela Cheia
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

// Abre diretamente o portal do Legend Online na primeira aba
enav.newTab('https://lobr.creaction-network.com');
