const $ = (id) => document.getElementById(id);

const dateEl = $('date');
const subtitle = $('subtitle');
const sectionsEl = $('sections');
const settingsEl = $('settings');
const empty = $('empty');
const form = $('add-form');
const input = $('new-task');
const dateBtn = $('date-btn');
const composerCal = $('composer-cal');
const categoryBtn = $('category-btn');
const composerCategoryPanel = $('composer-category-panel');
const filterBar = $('filter-bar');
const settingsBtn = $('settings-btn');
const modeBtn = $('mode-btn');
const quitBtn = $('quit');
const opacityInput = $('opacity');
const opacityValue = $('opacity-value');
const swatchesEl = $('swatches');
const positionsEl = $('positions');
const googleStatusEl = $('google-status');
const googleConnectBtn = $('google-connect-btn');
const googleDisconnectBtn = $('google-disconnect-btn');
const skeletonEl = $('skeleton');
const bootStart = performance.now();
const MIN_LOADING_MS = 450; // o skeleton fica pelo menos este tempo, para não piscar
let loaded = false; // passa a true quando o skeleton sai

// Secções por ordem de apresentação (tarefas sem data ficam sempre no topo)
const SECTIONS = [
  { key: 'none', title: 'Sem data' },
  { key: 'overdue', title: 'Atrasadas' },
  { key: 'today', title: 'Hoje' },
  { key: 'tomorrow', title: 'Amanhã' },
  { key: 'upcoming', title: 'Próximas' },
  { key: 'done', title: 'Concluídas' }
];

// Ícones SVG estáticos (sem texto), para ficarem centrados nos botões
const ICON_PLUS = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
const ICON_CLOSE = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_CAL = '<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/></svg>';
const ICON_TAG = '<svg viewBox="0 0 24 24"><path d="M3 11.5V5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 .7.29l9.51 9.51a1 1 0 0 1 0 1.42l-7.5 7.5a1 1 0 0 1-1.42 0L2.3 13.2a1 1 0 0 1-.29-.7z"/><circle cx="7.5" cy="7.5" r="1.4"/></svg>';
const ICON_GEAR = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

// Posições no ecrã, pela mesma ordem da grelha 3×3 (ver POSITIONS em main.js)
const POSITION_NAMES = {
  'top-left': 'Canto superior esquerdo',
  'top-center': 'Topo ao centro',
  'top-right': 'Canto superior direito',
  'middle-left': 'Lado esquerdo',
  'middle-center': 'Centro',
  'middle-right': 'Lado direito',
  'bottom-left': 'Canto inferior esquerdo',
  'bottom-center': 'Fundo ao centro',
  'bottom-right': 'Canto inferior direito'
};
// Compacto: setas para dentro; edição: setas para fora
const ICON_SHRINK = '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
const ICON_EXPAND = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICON_LEFT ='<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';
const ICON_RIGHT = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const longDateFormat = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const monthFormat = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' });
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // semana começa à segunda

const SWATCHES = [
  { name: 'Vermelho', color: '#ff3b30' },
  { name: 'Laranja', color: '#ff9500' },
  { name: 'Verde', color: '#34c759' },
  { name: 'Azul', color: '#007aff' },
  { name: 'Roxo', color: '#af52de' },
  { name: 'Rosa', color: '#ff2d55' },
  { name: 'Cinzento', color: '#8e8e93' }
];
// Cores atribuídas às categorias, por ordem de criação (repete em ciclo se houver mais categorias que cores)
const CATEGORY_COLORS = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be', '#007aff', '#5856d6', '#af52de', '#ff2d55'];
const DEFAULT_SETTINGS = { opacity: 100, accent: '#ff3b30' };
const SETTINGS_KEY = 'todo-widget-settings';
const CATEGORIES_KEY = 'todo-widget-categories';
const LEGACY_AREAS_KEY = 'todo-widget-areas'; // nome antigo, antes de "área" passar a "categoria"
const CATEGORY_FILTER_KEY = 'todo-widget-category-filter';
const LEGACY_AREA_FILTER_KEY = 'todo-widget-area-filter';

let tasks = [];
let settings = loadSettings();
let categories = loadCategories();         // categorias conhecidas ({name, color}), por ordem de criação
let activeCategory = loadActiveCategory(); // categoria usada para filtrar a lista (null = todas)

// Migra de imediato para as novas chaves, para não depender do antigo nome "área"
try {
  if (categories.length && !localStorage.getItem(CATEGORIES_KEY)) saveCategories();
  if (activeCategory && !localStorage.getItem(CATEGORY_FILTER_KEY)) saveActiveCategory();
} catch {
  // sem armazenamento disponível: a migração fica só para esta sessão
}
let settingsOpen = false;
let panelFor = null;  // 'new' ou id da tarefa com o painel de data aberto
let categoryPanelFor = null; // 'new' ou id da tarefa com o painel de categoria aberto
let pendingDate = null;
let pendingTime = null;
let pendingCategory = null;
let currentPosition = 'top-right';
let compact = false; // modo compacto: só leitura
const seenIds = new Set(); // tarefas já desenhadas, para só animar as novas

// ---------- Definições (guardadas no próprio computador) ----------

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // sem armazenamento disponível: as definições valem só nesta sessão
  }
}

function applySettings() {
  document.documentElement.style.setProperty('--glass-opacity', String(settings.opacity / 100));
  document.documentElement.style.setProperty('--accent', settings.accent);
  opacityInput.value = settings.opacity;
  opacityValue.textContent = `${settings.opacity}%`;

  swatchesEl.replaceChildren(...SWATCHES.map((s) => {
    const button = el('button', s.color === settings.accent ? 'swatch active' : 'swatch');
    button.type = 'button';
    button.style.background = s.color;
    button.title = s.name;
    button.setAttribute('aria-label', s.name);
    button.addEventListener('click', () => {
      settings.accent = s.color;
      saveSettings();
      applySettings();
    });
    return button;
  }));
}

// ---------- Categorias (guardadas no próprio computador) ----------

// Lê a lista de categorias, migrando o formato antigo (lista de nomes, chave "todo-widget-areas")
// para o atual ({name, color}, chave "todo-widget-categories")
function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY) ?? localStorage.getItem(LEGACY_AREAS_KEY) ?? '[]';
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];

    const result = [];
    for (const item of saved) {
      if (typeof item === 'string' && item.trim()) {
        result.push({ name: item.trim(), color: CATEGORY_COLORS[result.length % CATEGORY_COLORS.length] });
      } else if (item && typeof item.name === 'string' && item.name.trim()) {
        const color = typeof item.color === 'string' ? item.color : CATEGORY_COLORS[result.length % CATEGORY_COLORS.length];
        result.push({ name: item.name.trim(), color });
      }
    }
    return result;
  } catch {
    return [];
  }
}

function saveCategories() {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // sem armazenamento disponível: as categorias valem só nesta sessão
  }
}

function loadActiveCategory() {
  try {
    return localStorage.getItem(CATEGORY_FILTER_KEY) ?? localStorage.getItem(LEGACY_AREA_FILTER_KEY) ?? null;
  } catch {
    return null;
  }
}

function saveActiveCategory() {
  try {
    if (activeCategory) localStorage.setItem(CATEGORY_FILTER_KEY, activeCategory);
    else localStorage.removeItem(CATEGORY_FILTER_KEY);
  } catch {
    // sem armazenamento disponível: o filtro vale só nesta sessão
  }
}

function findCategory(name) {
  return name ? categories.find((c) => c.name === name) : undefined;
}

// Garante que a categoria existe na lista (nova ou já conhecida) e devolve o nome tratado
function ensureCategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (!findCategory(trimmed)) {
    categories.push({ name: trimmed, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length] });
    saveCategories();
  }
  return trimmed;
}

// Mistura uma cor hex com o fundo numa certa opacidade, para dar um "tint" suave
function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Aplica a cor da categoria a um chip/pill: fundo em tint, texto na cor cheia
function colorize(element, color) {
  element.style.background = tint(color, 0.18);
  element.style.color = color;
}

// Grelha 3×3: cada botão é uma zona do ecrã, com um ponto na posição correspondente
function renderPositions() {
  const names = Object.keys(POSITION_NAMES);
  const alignment = { 0: 'start', 1: 'center', 2: 'end' };

  positionsEl.replaceChildren(...names.map((name, i) => {
    const button = el('button', name === currentPosition ? 'pos-btn active' : 'pos-btn');
    button.type = 'button';
    button.title = POSITION_NAMES[name];
    button.setAttribute('aria-label', POSITION_NAMES[name]);
    button.style.justifyItems = alignment[i % 3];
    button.style.alignItems = alignment[Math.floor(i / 3)];
    button.append(el('span', 'pos-dot'));
    button.addEventListener('click', async () => {
      currentPosition = await window.api.setPosition(name);
      renderPositions();
    });
    return button;
  }));
}

// Sincronização: liga a conta Google (Drive) para partilhar as tarefas entre dispositivos.
// O Client ID/secret vêm fixos do código (googleConfig.js) — cada pessoa só faz login com a sua própria conta.
async function renderGoogleSettings() {
  const status = await window.api.getGoogleStatus();
  googleConnectBtn.hidden = !status.available || status.connected;
  googleDisconnectBtn.hidden = !status.connected;

  if (status.connected) {
    googleStatusEl.textContent = 'Tarefas sincronizadas através da tua conta Google.';
  } else if (status.available) {
    googleStatusEl.textContent = 'As tarefas ficam só neste dispositivo. Liga a tua conta Google para as sincronizar com os teus outros dispositivos.';
  } else {
    googleStatusEl.textContent = 'Sincronização por configurar nesta app.';
  }
}

googleConnectBtn.addEventListener('click', async () => {
  googleConnectBtn.disabled = true;
  googleStatusEl.textContent = 'A abrir o browser para autorizar…';
  try {
    await window.api.connectGoogle();
    await renderGoogleSettings();
    await reloadTasks();
  } catch {
    googleStatusEl.textContent = 'Não foi possível ligar a conta Google. Confirma as credenciais e tenta outra vez.';
  } finally {
    googleConnectBtn.disabled = false;
  }
});

googleDisconnectBtn.addEventListener('click', async () => {
  await window.api.disconnectGoogle();
  await renderGoogleSettings();
  await reloadTasks();
});

window.api.onTasksExternalChange(() => {
  reloadTasks();
});

// ---------- Datas e horas (fuso local; data YYYY-MM-DD, hora HH:MM) ----------

const pad = (n) => String(n).padStart(2, '0');

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso, days) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

function dateLabel(iso, today) {
  if (iso === today) return 'Hoje';
  if (iso === addDays(today, 1)) return 'Amanhã';
  if (iso === addDays(today, -1)) return 'Ontem';
  const date = fromISO(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function taskWhen(task, today) {
  const date = task.dueDate ? dateLabel(task.dueDate, today) : '';
  if (!task.dueDate) return '+ Adicionar data';
  return task.dueTime ? `${date} · ${task.dueTime}` : date;
}

// ---------- Dados ----------

async function persist() {
  await window.api.saveTasks(tasks);
}

// Recarrega as tarefas do disco (ex.: depois de outro dispositivo as ter sincronizado) e redesenha
async function reloadTasks() {
  tasks = await window.api.loadTasks();
  render();
}

function groupTasks(list, today) {
  const groups = Object.fromEntries(SECTIONS.map((s) => [s.key, []]));
  const tomorrow = addDays(today, 1);

  for (const task of list) {
    if (task.done) groups.done.push(task);
    else if (!task.dueDate) groups.none.push(task);
    else if (task.dueDate < today) groups.overdue.push(task);
    else if (task.dueDate === today) groups.today.push(task);
    else if (task.dueDate === tomorrow) groups.tomorrow.push(task);
    else groups.upcoming.push(task);
  }

  const byWhen = (a, b) => `${a.dueDate || ''} ${a.dueTime || ''}`.localeCompare(`${b.dueDate || ''} ${b.dueTime || ''}`);
  groups.overdue.sort(byWhen);
  groups.upcoming.sort(byWhen);
  return groups;
}

// ---------- Componentes ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Calendário mensal (semana começa à segunda)
function calendarPicker(current, onPick) {
  const start = current ? fromISO(current) : new Date();
  let view = new Date(start.getFullYear(), start.getMonth(), 1);
  const today = toISO(new Date());

  const box = el('div', 'calendar');

  function navButton(icon, label, step) {
    const button = el('button', 'round-btn cal-nav');
    button.type = 'button';
    button.innerHTML = icon;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => {
      view = new Date(view.getFullYear(), view.getMonth() + step, 1);
      draw();
    });
    return button;
  }

  function draw() {
    box.replaceChildren();

    const monthText = monthFormat.format(view);
    const head = el('div', 'cal-head');
    head.append(
      navButton(ICON_LEFT, 'Mês anterior', -1),
      el('span', 'cal-title', monthText.charAt(0).toUpperCase() + monthText.slice(1)),
      navButton(ICON_RIGHT, 'Mês seguinte', 1)
    );
    box.append(head);

    const grid = el('div', 'cal-grid');
    for (const day of WEEKDAYS) grid.append(el('span', 'cal-weekday', day));

    const leading = (view.getDay() + 6) % 7;
    for (let i = 0; i < leading; i++) grid.append(el('span', 'cal-blank'));

    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = toISO(new Date(view.getFullYear(), view.getMonth(), d));
      const cls = ['cal-day'];
      if (iso === today) cls.push('today');
      if (iso === current) cls.push('selected');
      const cell = el('button', cls.join(' '), String(d));
      cell.type = 'button';
      cell.addEventListener('click', () => onPick(iso));
      grid.append(cell);
    }
    box.append(grid);
  }

  draw();
  return box;
}

// Seletor de hora: horas e minutos em passos (minutos de 5 em 5)
function timeRow(time, onChange) {
  const row = el('div', 'time-row');
  row.append(el('span', 'time-label', 'Hora'));

  if (!time) {
    const add = el('button', 'chip', 'Adicionar hora');
    add.type = 'button';
    add.addEventListener('click', () => onChange('09:00'));
    row.append(add);
    return row;
  }

  const [h, m] = time.split(':').map(Number);
  const minute = Math.floor(m / 5) * 5;
  const hour = (delta) => onChange(`${pad((h + delta + 24) % 24)}:${pad(minute)}`);
  const min = (delta) => onChange(`${pad(h)}:${pad((minute + delta + 60) % 60)}`);

  row.append(
    stepper(pad(h), () => hour(-1), () => hour(1)),
    el('span', 'time-sep', ':'),
    stepper(pad(minute), () => min(-5), () => min(5))
  );

  const remove = el('button', 'link-btn', 'Remover hora');
  remove.type = 'button';
  remove.addEventListener('click', () => onChange(null));
  row.append(remove);
  return row;
}

function stepper(value, onDown, onUp) {
  const box = el('div', 'stepper');
  const down = el('button', 'stepper-btn');
  down.type = 'button';
  down.innerHTML = ICON_LEFT;
  down.setAttribute('aria-label', 'Diminuir');
  down.addEventListener('click', onDown);

  const up = el('button', 'stepper-btn');
  up.type = 'button';
  up.innerHTML = ICON_RIGHT;
  up.setAttribute('aria-label', 'Aumentar');
  up.addEventListener('click', onUp);

  box.append(down, el('span', 'stepper-value', value), up);
  return box;
}

// Painel completo: calendário, hora e botões de remover/concluir
function datePanel({ date, time }, onChange, onDone) {
  const panel = el('div', 'date-panel');
  const today = toISO(new Date());

  panel.append(calendarPicker(date, (iso) => onChange(iso, time)));
  panel.append(timeRow(time, (t) => onChange(date || today, t)));

  const footer = el('div', 'panel-footer');
  if (date || time) {
    const clear = el('button', 'link-btn', 'Remover data');
    clear.type = 'button';
    clear.addEventListener('click', () => onChange(null, null));
    footer.append(clear);
  }
  const done = el('button', 'done-btn', 'Concluir');
  done.type = 'button';
  done.addEventListener('click', onDone);
  footer.append(done);
  panel.append(footer);
  return panel;
}

// Painel de seleção de categoria: categorias existentes (com a sua cor) + opção de criar uma nova
function categoryPanel(current, onSelect) {
  const panel = el('div', 'category-panel');
  const list = el('div', 'category-list');

  const noneChip = el('button', !current ? 'chip active' : 'chip', 'Sem categoria');
  noneChip.type = 'button';
  noneChip.addEventListener('click', () => onSelect(null));
  list.append(noneChip);

  for (const cat of categories) {
    const isActive = cat.name === current;
    const chip = el('button', isActive ? 'chip active' : 'chip');
    chip.type = 'button';
    const dot = el('span', 'cat-dot');
    dot.style.background = cat.color;
    chip.append(dot, cat.name);
    if (isActive) colorize(chip, cat.color);
    chip.addEventListener('click', () => onSelect(cat.name));
    list.append(chip);
  }
  panel.append(list);

  const form = el('form', 'category-add');
  const input = el('input');
  input.type = 'text';
  input.placeholder = 'Nova categoria';
  input.maxLength = 40;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Nova categoria');
  const add = el('button', 'round-btn');
  add.type = 'submit';
  add.innerHTML = ICON_PLUS;
  add.setAttribute('aria-label', 'Criar categoria');
  form.append(input, add);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const created = ensureCategory(input.value);
    if (!created) return;
    onSelect(created);
  });
  panel.append(form);
  return panel;
}

function buildRow(task, today) {
  const li = el('li', 'task');
  if (task.done) li.classList.add('done');

  const main = el('div', 'task-main');
  // Só a primeira vez que a tarefa aparece entra animada; os redesenhos seguintes não repetem a animação
  if (!seenIds.has(task.id)) main.classList.add('enter');
  seenIds.add(task.id);
  let panel = null; // painel de data, na largura total da linha
  let categoryPnl = null; // painel de categoria, na largura total da linha

  const check = el('button', 'check');
  check.type = 'button';
  check.innerHTML = ICON_CHECK;
  check.setAttribute('aria-label', task.done ? 'Marcar como por fazer' : 'Marcar como feita');
  check.addEventListener('click', async () => {
    task.done = !task.done;
    panelFor = null;
    render();
    await persist();
  });

  const body = el('div', 'task-body');
  body.append(el('span', 'task-title', task.text));

  if (!task.done) {
    const meta = el('div', 'task-meta');

    const taskCategory = findCategory(task.category);
    const categoryPillClass = task.category ? 'category-pill' : 'category-pill empty';
    const categoryPillEl = el('button', categoryPillClass, task.category || '+ Categoria');
    categoryPillEl.type = 'button';
    if (taskCategory) colorize(categoryPillEl, taskCategory.color);
    categoryPillEl.addEventListener('click', () => {
      categoryPanelFor = categoryPanelFor === task.id ? null : task.id;
      render();
    });
    meta.append(categoryPillEl);

    const overdue = !!task.dueDate && task.dueDate < today;
    const pillClass = task.dueDate ? (overdue ? 'date-pill overdue' : 'date-pill') : 'date-pill empty';
    const pill = el('button', pillClass, taskWhen(task, today));
    pill.type = 'button';
    pill.addEventListener('click', () => {
      panelFor = panelFor === task.id ? null : task.id;
      render();
    });
    meta.append(pill);

    body.append(meta);

    if (categoryPanelFor === task.id) {
      categoryPnl = categoryPanel(task.category, async (category) => {
        task.category = category;
        categoryPanelFor = null;
        render();
        await persist();
      });
    }

    if (panelFor === task.id) {
      panel = datePanel({ date: task.dueDate, time: task.dueTime }, async (date, time) => {
        task.dueDate = date;
        task.dueTime = date ? time : null;
        render();
        await persist();
      }, () => {
        panelFor = null;
        render();
      });
    }
  }

  const del = el('button', 'delete');
  del.type = 'button';
  del.innerHTML = ICON_CLOSE;
  del.title = 'Apagar';
  del.setAttribute('aria-label', 'Apagar tarefa');
  del.addEventListener('click', async () => {
    if (main.classList.contains('leaving')) return;
    main.classList.add('leaving');
    await new Promise((resolve) => setTimeout(resolve, 200)); // espera pela animação de saída
    tasks = tasks.filter((t) => t.id !== task.id);
    render();
    await persist();
  });

  main.append(check, body, del);
  li.append(main);
  if (categoryPnl) li.append(categoryPnl);
  if (panel) li.append(panel);
  return li;
}

function renderHeader(groups, list) {
  const pending = list.length - groups.done.length;
  const overdue = groups.overdue.length;

  if (list.length === 0) {
    subtitle.textContent = '';
  } else if (pending === 0) {
    subtitle.textContent = 'Tudo feito';
  } else {
    const parts = [`${pending} por fazer`];
    if (overdue) parts.push(`${overdue} atrasada${overdue > 1 ? 's' : ''}`);
    subtitle.textContent = parts.join(' · ');
  }
}

// Barra de filtro por categoria: só aparece quando existem categorias criadas
function renderFilterBar() {
  const show = categories.length > 0 && !settingsOpen;
  filterBar.hidden = !show;
  filterBar.replaceChildren();
  if (!show) return;

  const allChip = el('button', !activeCategory ? 'chip active' : 'chip', 'Todas');
  allChip.type = 'button';
  allChip.addEventListener('click', () => {
    activeCategory = null;
    saveActiveCategory();
    render();
  });
  filterBar.append(allChip);

  for (const cat of categories) {
    const isActive = cat.name === activeCategory;
    const chip = el('button', isActive ? 'chip active' : 'chip');
    chip.type = 'button';
    const dot = el('span', 'cat-dot');
    dot.style.background = cat.color;
    chip.append(dot, cat.name);
    if (isActive) colorize(chip, cat.color);
    chip.addEventListener('click', () => {
      activeCategory = cat.name;
      saveActiveCategory();
      render();
    });
    filterBar.append(chip);
  }
}

function render() {
  const today = toISO(new Date());
  const visibleTasks = activeCategory ? tasks.filter((t) => t.category === activeCategory) : tasks;
  const groups = groupTasks(visibleTasks, today);

  const longDate = longDateFormat.format(new Date());
  dateEl.textContent = longDate.charAt(0).toUpperCase() + longDate.slice(1);
  renderHeader(groups, visibleTasks);
  renderFilterBar();

  document.querySelector('.widget').classList.toggle('compact', compact);
  modeBtn.innerHTML = compact ? ICON_EXPAND : ICON_SHRINK;
  modeBtn.title = compact ? 'Modo de edição' : 'Modo compacto';
  modeBtn.setAttribute('aria-label', modeBtn.title);
  if (compact) {
    settingsOpen = false;
    panelFor = null;
    categoryPanelFor = null;
  }

  settingsBtn.classList.toggle('active', settingsOpen);
  settingsEl.hidden = !settingsOpen;
  sectionsEl.hidden = !loaded || settingsOpen; // a lista só aparece quando o skeleton sai
  empty.innerHTML = tasks.length === 0 ? 'Sem tarefas.<br>Escreve uma acima.' : 'Sem tarefas nesta categoria.';
  empty.hidden = settingsOpen || visibleTasks.length > 0;

  sectionsEl.replaceChildren();
  if (settingsOpen) return;

  for (const section of SECTIONS) {
    const items = groups[section.key];
    if (items.length === 0) continue;

    const wrap = el('section', 'section');
    const title = el('h2', section.key === 'overdue' ? 'section-title overdue' : 'section-title', section.title);
    const list = el('ul', 'list');

    for (const task of items) {
      list.append(buildRow(task, today));
    }

    wrap.append(title, list);
    sectionsEl.append(wrap);
  }
}

function renderComposerDate() {
  const today = toISO(new Date());
  const hasValue = !!pendingDate;
  dateBtn.className = hasValue || panelFor === 'new' ? 'chip active' : 'chip';
  dateBtn.innerHTML = ICON_CAL;
  dateBtn.append(` ${hasValue ? taskWhen({ dueDate: pendingDate, dueTime: pendingTime }, today) : 'Data'}`);

  composerCal.replaceChildren();
  if (panelFor === 'new') {
    composerCal.append(datePanel({ date: pendingDate, time: pendingTime }, (date, time) => {
      pendingDate = date;
      pendingTime = date ? time : null;
      renderComposerDate();
    }, () => {
      panelFor = null;
      renderComposerDate();
    }));
  }
}

function renderComposerCategory() {
  const hasValue = !!pendingCategory;
  categoryBtn.className = hasValue || categoryPanelFor === 'new' ? 'chip active' : 'chip';
  categoryBtn.replaceChildren();
  if (hasValue) {
    const cat = findCategory(pendingCategory);
    const dot = el('span', 'cat-dot');
    dot.style.background = cat ? cat.color : '#8e8e93';
    categoryBtn.append(dot, pendingCategory);
    if (cat) colorize(categoryBtn, cat.color);
  } else {
    categoryBtn.innerHTML = ICON_TAG;
    categoryBtn.append(' Categoria');
  }

  composerCategoryPanel.replaceChildren();
  if (categoryPanelFor === 'new') {
    composerCategoryPanel.append(categoryPanel(pendingCategory, (category) => {
      pendingCategory = category;
      categoryPanelFor = null;
      renderComposerCategory();
    }));
  }
}

// ---------- Composer ----------

dateBtn.addEventListener('click', () => {
  panelFor = panelFor === 'new' ? null : 'new';
  renderComposerDate();
});

categoryBtn.addEventListener('click', () => {
  categoryPanelFor = categoryPanelFor === 'new' ? null : 'new';
  renderComposerCategory();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.unshift({
    id: crypto.randomUUID(),
    text,
    done: false,
    dueDate: pendingDate,
    dueTime: pendingDate ? pendingTime : null,
    category: pendingCategory || activeCategory || null,
    createdAt: new Date().toISOString()
  });

  input.value = '';
  pendingDate = null;
  pendingTime = null;
  pendingCategory = null;
  panelFor = null;
  categoryPanelFor = null;
  renderComposerDate();
  renderComposerCategory();
  render();
  await persist();
});

modeBtn.addEventListener('click', async () => {
  compact = await window.api.setCompact(!compact);
  render();
});

settingsBtn.addEventListener('click', () => {
  settingsOpen = !settingsOpen;
  panelFor = null;
  categoryPanelFor = null;
  render();
});

opacityInput.addEventListener('input', () => {
  settings.opacity = Number(opacityInput.value);
  saveSettings();
  applySettings();
});

// Animação de saída antes de fechar a janela (o atraso tem de ser igual à duração de .widget.closing em styles.css)
let closing = false;
quitBtn.addEventListener('click', () => {
  if (closing) return;
  closing = true;
  document.querySelector('.widget').classList.add('closing');
  setTimeout(() => window.api.quit(), 220);
});

// ---------- Skeleton (arranque) ----------

// Desvanece o skeleton e revela a lista, com o tempo mínimo de loading
function hideSkeleton() {
  const wait = Math.max(0, MIN_LOADING_MS - (performance.now() - bootStart));
  setTimeout(() => {
    skeletonEl.classList.add('gone');
    setTimeout(() => {
      skeletonEl.hidden = true;
      loaded = true;
      render(); // mostra a lista (com a animação de entrada do painel)
    }, 350);
  }, wait);
}

// ---------- Scroll com inércia ----------
// A roda do rato desliza suavemente até ao destino, em vez de saltar linha a linha

let scrollTarget = null;
let scrollFrame = 0;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

sectionsEl.addEventListener('wheel', (event) => {
  if (reduceMotion.matches) return;
  event.preventDefault();
  const max = sectionsEl.scrollHeight - sectionsEl.clientHeight;
  const base = scrollTarget ?? sectionsEl.scrollTop;
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY; // linhas para pixels
  scrollTarget = Math.min(max, Math.max(0, base + delta));
  if (!scrollFrame) scrollFrame = requestAnimationFrame(stepScroll);
}, { passive: false });

function stepScroll() {
  const max = sectionsEl.scrollHeight - sectionsEl.clientHeight;
  scrollTarget = Math.min(scrollTarget, max); // o conteúdo pode ter mudado entretanto
  const diff = scrollTarget - sectionsEl.scrollTop;
  if (Math.abs(diff) < 0.5) {
    sectionsEl.scrollTop = scrollTarget;
    scrollTarget = null;
    scrollFrame = 0;
    sectionsEl.style.setProperty('--stretch', 1); // as tarefas voltam ao tamanho normal
    return;
  }
  const step = diff * 0.2;
  sectionsEl.scrollTop += step;
  // Quanto mais depressa se desliza, mais as tarefas se esticam na direção do movimento
  sectionsEl.style.setProperty('--stretch', (1 + Math.min(0.05, Math.abs(step) * 0.004)).toFixed(3));
  scrollFrame = requestAnimationFrame(stepScroll);
}

// ---------- Arranque ----------

(async () => {
  tasks = await window.api.loadTasks();
  // Migra tarefas gravadas antes de "área" passar a "categoria"
  let migrated = false;
  for (const task of tasks) {
    if (task.area !== undefined) {
      if (task.category === undefined) task.category = task.area;
      delete task.area;
      migrated = true;
    }
  }

  $('add-btn').innerHTML = ICON_PLUS;
  $('quit').innerHTML = ICON_CLOSE;
  settingsBtn.innerHTML = ICON_GEAR;
  applySettings();
  currentPosition = await window.api.getPosition();
  renderPositions();
  renderGoogleSettings();
  compact = await window.api.getCompact();
  renderComposerDate();
  renderComposerCategory();
  render();
  hideSkeleton();
  if (migrated) await persist();

  // Recalcula "Hoje", "Amanhã" e "Atrasadas" à passagem da meia-noite
  setInterval(render, 60 * 1000);
})();
