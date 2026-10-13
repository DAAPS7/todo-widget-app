// Sincronização das tarefas via Google Drive: login OAuth (fluxo "desktop app" com
// servidor local de loopback) + um único ficheiro criado pela própria app no Drive
// do utilizador (scope drive.file: só esse ficheiro, nunca o resto do Drive).
const { shell, safeStorage } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_NAME = 'tarefas-widget.json';

function configPath(userDataDir) {
  return path.join(userDataDir, 'google.json');
}

// Só guarda o que é específico deste dispositivo/conta; o Client ID/secret vêm de googleConfig.js
function loadConfig(userDataDir) {
  try {
    const saved = JSON.parse(fs.readFileSync(configPath(userDataDir), 'utf8'));
    return {
      refreshToken: typeof saved.refreshToken === 'string' ? saved.refreshToken : null,
      driveFileId: typeof saved.driveFileId === 'string' ? saved.driveFileId : null
    };
  } catch {
    return { refreshToken: null, driveFileId: null };
  }
}

function saveConfig(userDataDir, { refreshToken, driveFileId }) {
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(configPath(userDataDir), JSON.stringify({ refreshToken, driveFileId }));
}

// O refresh token é a credencial de longo prazo: guarda-se cifrado com o cofre do SO (DPAPI no Windows)
function encrypt(value) {
  if (!value) return null;
  if (safeStorage.isEncryptionAvailable()) {
    return 'enc:' + safeStorage.encryptString(value).toString('base64');
  }
  return 'plain:' + value; // sem cofre disponível: guarda em claro, para a sincronização continuar a funcionar
}

function decrypt(stored) {
  if (!stored) return null;
  if (stored.startsWith('enc:')) return safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64'));
  if (stored.startsWith('plain:')) return stored.slice(6);
  return null;
}

let accessToken = null;
let accessTokenExpiry = 0;

async function getAccessToken(cfg) {
  if (accessToken && Date.now() < accessTokenExpiry - 60000) return accessToken;
  const refreshToken = decrypt(cfg.refreshToken);
  if (!refreshToken) throw new Error('not_connected');

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) throw new Error(`refresh_failed: ${await res.text()}`);
  const data = await res.json();
  accessToken = data.access_token;
  accessTokenExpiry = Date.now() + data.expires_in * 1000;
  return accessToken;
}

// Abre o browser do sistema para o consentimento Google e recebe o código de autorização
// num pequeno servidor local (loopback) — é o fluxo recomendado pela Google para apps desktop.
function requestAuthorizationCode(clientId) {
  return new Promise((resolve, reject) => {
    let redirectUri = '';
    const server = http.createServer((req, res) => {
      let code = null;
      let error = null;
      try {
        const url = new URL(req.url, redirectUri || 'http://127.0.0.1');
        code = url.searchParams.get('code');
        error = url.searchParams.get('error');
      } catch {
        error = 'invalid_response';
      }
      res.end('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#222">' +
        '<h2>Conta Google ligada</h2><p>Podes fechar esta janela e voltar à app Tarefas.</p></body></html>');
      server.close();
      if (error) reject(new Error(error));
      else if (code) resolve({ code, redirectUri });
      else reject(new Error('missing_code'));
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      redirectUri = `http://127.0.0.1:${port}`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: SCOPE,
        access_type: 'offline',
        prompt: 'consent'
      });
      shell.openExternal(`${AUTH_ENDPOINT}?${params.toString()}`);
    });
  });
}

// Faz login: devolve o refresh token (ainda não cifrado) para quem chamou guardar na config
async function login(clientId, clientSecret) {
  const { code, redirectUri } = await requestAuthorizationCode(clientId);
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  if (!res.ok) throw new Error(`token_exchange_failed: ${await res.text()}`);
  const data = await res.json();
  accessToken = data.access_token;
  accessTokenExpiry = Date.now() + data.expires_in * 1000;
  return data.refresh_token;
}

// Encontra o ficheiro de tarefas já criado por esta app no Drive, ou cria um novo com as tarefas atuais
async function findOrCreateFile(cfg, currentTasks) {
  const token = await getAccessToken(cfg);
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const listRes = await fetch(`${DRIVE_FILES}?q=${q}&spaces=drive&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!listRes.ok) throw new Error(`list_failed: ${await listRes.text()}`);
  const listData = await listRes.json();
  if (listData.files && listData.files.length) return listData.files[0].id;

  const createRes = await fetch(DRIVE_FILES, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FILE_NAME })
  });
  if (!createRes.ok) throw new Error(`create_failed: ${await createRes.text()}`);
  const created = await createRes.json();

  const uploadRes = await fetch(`${DRIVE_UPLOAD}/${created.id}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(currentTasks)
  });
  if (!uploadRes.ok) throw new Error(`initial_upload_failed: ${await uploadRes.text()}`);
  return created.id;
}

async function loadTasks(cfg) {
  const token = await getAccessToken(cfg);
  const res = await fetch(`${DRIVE_FILES}/${cfg.driveFileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`load_failed: ${await res.text()}`);
  return res.json();
}

async function saveTasks(cfg, tasks) {
  const token = await getAccessToken(cfg);
  const res = await fetch(`${DRIVE_UPLOAD}/${cfg.driveFileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(tasks)
  });
  if (!res.ok) throw new Error(`save_failed: ${await res.text()}`);
}

module.exports = { loadConfig, saveConfig, encrypt, decrypt, login, findOrCreateFile, loadTasks, saveTasks };
