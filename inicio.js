// ====== SISTEMA DE FAVORITOS INTERATIVO (INICIO.JS) ======

/**
 * Carrega os favoritos salvos no localStorage, renderiza na tela inicial
 * com estilo exclusivo (ciano) e gerencia a linha divisória amarela.
 */
function carregarFavoritos() {
    const container = document.getElementById('meus-favoritos');
    if (!container) return; // Segurança caso o contêiner não exista na tela
    
    container.innerHTML = ''; 
    const favoritos = JSON.parse(localStorage.getItem('elementista_bookmarks')) || [];
    
    favoritos.forEach((fav) => {
        const novoLink = document.createElement('a');
        novoLink.href = fav.url;
        novoLink.className = 'link-interno';
        
        // Estilo customizado de cor para os favoritos (Ciano/Azul Terminal)
        novoLink.style.color = '#00e5ff';
        novoLink.style.borderColor = '#00e5ff';
        novoLink.style.backgroundColor = 'rgba(0, 229, 255, 0.03)';
        
        let extensao = 'Custom';
        try {
            const urlObj = new URL(fav.url);
            const partesHost = urlObj.hostname.split('.');
            if (partesHost.length > 1) {
                extensao = partesHost[partesHost.length - 1].toUpperCase();
            }
        } catch(e) {
            extensao = 'Core';
        }

        novoLink.innerHTML = `> [LAUNCH] ${fav.nome} [://Custom.${extensao}]`;
        container.appendChild(novoLink);
    });

    // Se houver favoritos, adiciona a linha divisória amarela/laranja no final deles
    if (favoritos.length > 0) {
        const linhaDivisoria = document.createElement('div');
        linhaDivisoria.style.borderTop = '1px dashed #ff9800';
        linhaDivisoria.style.marginTop = '25px';
        linhaDivisoria.style.marginBottom = '15px';
        container.appendChild(linhaDivisoria);
    }
}

/**
 * Adiciona um novo link de jogo à lista de favoritos salvos.
 */
window.adicionarJogo = function(nome, url) {
    if (!nome || !url) return;
    
    const favoritos = JSON.parse(localStorage.getItem('elementista_bookmarks')) || [];
    favoritos.push({ nome: nome, url: url });
    localStorage.setItem('elementista_bookmarks', JSON.stringify(favoritos));
    
    carregarFavoritos();
};

/**
 * Remove um jogo salvo na lista buscando pelo nome exato (ignora maiúsculas/minúsculas).
 */
window.removerJogo = function(nome) {
    if (!nome) return;
    
    let favoritos = JSON.parse(localStorage.getItem('elementista_bookmarks')) || [];
    
    // Filtra a lista mantendo apenas os jogos que NÃO têm o nome digitado
    const listaFiltrada = favoritos.filter(fav => fav.nome.toLowerCase() !== nome.toLowerCase());
    
    if (favoritos.length === listaFiltrada.length) {
        alert(`⚠️ Jogo "${nome}" não foi encontrado na lista.`);
        return;
    }
    
    localStorage.setItem('elementista_bookmarks', JSON.stringify(listaFiltrada));
    carregarFavoritos();
};

/**
 * Monitora o carregamento da página e gerencia a entrada de comandos do terminal interativo.
 */
document.addEventListener('DOMContentLoaded', () => {
    carregarFavoritos();

    const terminalInput = document.getElementById('terminal-input');
    if (terminalInput) {
        terminalInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const inputVal = this.value.trim();
                if (!inputVal) return;

                const partes = inputVal.split(' ');
                const comando = partes[0].toLowerCase();
                
                // Comando 1: Adicionar (suporta nomes com espaços)
                if (comando === 'adicionar') {
                    if (partes.length >= 3) {
                        // O link é sempre o último elemento digitado na linha
                        const url = partes[partes.length - 1]; 
                        
                        // O nome junta tudo o que está entre a palavra 'adicionar' e a URL
                        const nome = partes.slice(1, partes.length - 1).join(' ');
                        
                        window.adicionarJogo(nome, url);
                        this.value = '';
                    } else {
                        alert("⚠️ Use: adicionar Nome Do Jogo https://link.com");
                    }
                    
                // Comando 2: Remover (suporta nomes com espaços)
                } else if (comando === 'remover') {
                    if (partes.length >= 2) {
                        // Junta todas as partes digitadas após a palavra 'remover'
                        const nome = partes.slice(1).join(' ');
                        
                        window.removerJogo(nome);
                        this.value = '';
                    } else {
                        alert("⚠️ Use: remover Nome Do Jogo");
                    }
                }
            }
        });
    }
});

