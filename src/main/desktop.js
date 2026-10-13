// Mantém a janela logo acima do ambiente de trabalho (Progman) e abaixo de todas as aplicações.
// Não é ligada como filha: as janelas-filhas no Windows não suportam fundo transparente.
const koffi = require('koffi');

const user32 = koffi.load('user32.dll');

const FindWindowW = user32.func('intptr_t __stdcall FindWindowW(str16 lpClassName, str16 lpWindowName)');
const SetWindowPos = user32.func(
  'bool __stdcall SetWindowPos(intptr_t hWnd, intptr_t hWndInsertAfter, int32_t X, int32_t Y, int32_t cx, int32_t cy, uint32_t uFlags)'
);

// Sem SWP_NOMOVE/SWP_NOSIZE: só mexe na ordem Z; SWP_NOACTIVATE evita roubar o foco
const SWP_NOMOVE = 0x0002;
const SWP_NOSIZE = 0x0001;
const SWP_NOACTIVATE = 0x0010;
const Z_ONLY = SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE;

function getHwnd(win) {
  const handle = win.getNativeWindowHandle();
  return handle.length === 8 ? Number(handle.readBigUInt64LE(0)) : handle.readUInt32LE(0);
}

// Coloca a janela imediatamente acima do Progman. O Windows reativa o Progman
// quando se clica no ambiente de trabalho, por isso a posição é reaplicada periodicamente.
function attachToDesktop(win) {
  const progman = FindWindowW('Progman', null);
  if (!progman) {
    console.warn('Progman não encontrado; o widget fica com ordem Z normal.');
    return null;
  }

  const hwnd = getHwnd(win);
  const insertAfter = progman;
  const lower = () => {
    if (!win.isDestroyed()) SetWindowPos(hwnd, insertAfter, 0, 0, 0, 0, Z_ONLY);
  };

  lower();
  return setInterval(lower, 1000);
}

module.exports = { attachToDesktop };
