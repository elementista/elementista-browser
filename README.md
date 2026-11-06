# Elementista Browser 🛡️✨🚀

> **Meu primeiro projeto oficial no desenvolvimento de software!** 🎉

Um navegador portátil e otimizado desenvolvido com **Electron** e **Flash Player nativo**, criado especialmente para rodar jogos clássicos em Flash sem travar o foco do teclado (suporte completo a F11 e cliques direitos livres). O projeto nasceu da necessidade de gerenciar múltiplas contas de jogos com total isolamento e alta performance no Linux e Windows.

---

## 🌟 Principais Funcionalidades

* **Flash Player Nativo:** Suporte integrado a plugins PPAPI (`.so` para Linux e `.dll` para Windows) para rodar conteúdos em Flash perfeitamente.
* **Isolamento de Contas / Múltiplas Instâncias:** Cada nova janela aberta (`Ctrl + N`) possui dados de sessão totalmente independentes e limpos.
* **Correção de Foco no Teclado (`F11`):** Comunicação via IPC entre as abas e o processo principal para garantir tela cheia independente em qualquer gerenciador de janelas (X11 ou Wayland).
* **Identidade Visual Personalizada:** Ícone de brasão próprio e suporte multiplataforma ajustado.

---

## 💻 Como Rodar o Projeto Localmente

Certifique-se de ter o **Node.js** instalado na sua máquina. Abra o terminal e siga os passos:

```bash
# Clone o repositório
git clone https://github.com/elementista/elementista-browser.git

# Entre na pasta do projeto
cd elementista-browser

# Instale as dependências
npm install

# Inicie o navegador em modo de desenvolvimento
npm start
```

## 📦 Como Gerar os Pacotes Portáteis

Para compilar os arquivos executáveis e distribuíveis:

### Para Linux (AppImage):
```bash
npm run dist
```

### Para Windows (Executável Portable):
```bash
npm run dist:win
```

---

## 🛠️ Tecnologias Utilizadas

* **Node.js**
* **Electron**
* **Electron Builder**

---

## 💡 Sobre o Projeto

Este projeto marcou o meu aprendizado prático com engenharia de software voltada para desktop, lidando com empacotamento, compatibilidade multiplataforma (Linux Mint, Arch Linux e Windows) e integração nativa de binários legados.

Sinta-se à vontade para explorar o código, abrir issues ou sugerir melhorias!
