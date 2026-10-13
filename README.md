# Tarefas — widget de tarefas para o Windows

Um widget de tarefas que fica no ambiente de trabalho, por baixo das outras janelas.

## Usar a app

Abre **`release\Tarefas.exe`** com duplo clique. Não é preciso instalar nada.

- **Adicionar tarefa:** escreve no campo de cima e carrega em **+**. Podes escolher data e hora com o botão **Data**.
- **Concluir:** carrega no círculo ao lado da tarefa.
- **Apagar:** passa o rato sobre a tarefa e carrega em **×**.
- **Modo compacto** (setas no cabeçalho): mostra só a lista, para ler. Carrega de novo para voltar ao modo de edição.
- **Definições** (engrenagem): opacidade do fundo, cor de destaque e posição no ecrã.

Os dados ficam em `%APPDATA%\todo-widget-app\` (tarefas, posição e modo).

> O Windows pode mostrar um aviso "Windows protegeu o seu PC" na primeira vez, porque o `.exe` não está assinado. Carrega em "Mais informações" e depois em "Executar mesmo assim".

## Desenvolvimento

Pré-requisitos: [Node.js](https://nodejs.org) (versão LTS).

```
npm install      # instala as dependências
npm start        # corre a app a partir do código
npm run dist     # gera release\Tarefas.exe
```

## Estrutura do código

```
todo-widget-app/
├── src/
│   ├── main/                  # processo principal da Electron (Node)
│   │   ├── main.js            # janela, dados, posição e modo compacto
│   │   ├── preload.js         # ponte segura entre a página e o processo principal
│   │   └── desktop.js         # ordem das janelas: fica por baixo das outras aplicações
│   └── renderer/              # interface (HTML, CSS e JavaScript da página)
│       ├── index.html
│       ├── renderer.js        # tarefas, datas, calendário e definições
│       └── styles.css
├── release/                   # executável gerado por "npm run dist"
├── package.json
└── README.md
```

## Notas técnicas

- **Ordem das janelas:** `desktop.js` usa a API do Windows (através do `koffi`) para manter a janela logo acima do ambiente de trabalho.
- **Transparência:** o fundo de vidro é desenhado em CSS. O desfoque nativo do Windows foi testado e não serve, porque desenha um retângulo.
- **Dados:** `tasks.json` guarda as tarefas, e `window.json` guarda a posição e o modo.
