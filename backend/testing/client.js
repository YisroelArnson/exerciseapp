// Firebase Web SDK v9+ via ESM CDN
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth as getClientAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let app = null;
let clientAuth = null;

const qs = (id) => document.getElementById(id);

function setOutput(id, value) {
  qs(id).textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function logEvent(action, detail) {
  const now = new Date().toISOString();
  const line = `[${now}] ${action} ${detail !== undefined ? JSON.stringify(detail) : ''}`;
  const el = qs('logOut');
  el.textContent += (el.textContent ? '\n' : '') + line;
  el.scrollTop = el.scrollHeight;
  console.log(`[${action}]`, detail); // Also log to console for debugging
}

function getBackendBase() {
  return (qs('backendBase').value || 'http://localhost:3000').trim().replace(/\/$/, '');
}

async function fetchWithAuth(path, init = {}) {
  const user = clientAuth?.currentUser;
  if (!user) throw new Error('No user signed in');
  const token = await user.getIdToken();
  const url = `${getBackendBase()}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = Object.assign({}, init.headers || {}, {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
  const reqInit = Object.assign({}, init, { headers, credentials: 'include' });
  let bodyPreview = undefined;
  try { bodyPreview = init.body ? JSON.parse(init.body) : undefined; } catch (_) {}
  logEvent('REQUEST', { url, method: reqInit.method || 'GET', body: bodyPreview });
  const res = await fetch(url, reqInit);
  let data = null;
  try { data = await res.json(); } catch (_) {}
  logEvent('RESPONSE', { status: res.status, data });
  return { res, data };
}

function readConfig() {
  try {
    const raw = qs('fbConfig').value.trim();
    if (!raw) {
      logEvent('ERROR', 'No Firebase config provided');
      return null;
    }
    const cfg = JSON.parse(raw);
    logEvent('INFO', 'Firebase config parsed successfully');
    return cfg;
  } catch (e) {
    logEvent('ERROR', `Invalid Firebase config JSON: ${e.message}`);
    return null;
  }
}

// Wire up buttons
window.addEventListener('DOMContentLoaded', () => {
  logEvent('INFO', 'DOM loaded, setting up button handlers');
  
  // Test that we can find the buttons
  const btnInit = qs('btnInit');
  const btnSignUp = qs('btnSignUp');
  
  if (!btnInit) {
    logEvent('ERROR', 'btnInit button not found');
    return;
  }
  
  if (!btnSignUp) {
    logEvent('ERROR', 'btnSignUp button not found');
    return;
  }
  
  logEvent('INFO', 'All buttons found successfully');
  
  // Test button to verify JavaScript is working
  const btnTest = qs('btnTest');
  if (btnTest) {
    btnTest.onclick = () => {
      logEvent('INFO', 'Test button clicked - JavaScript is working!');
      setOutput('respOut', { status: 'JavaScript is working correctly' });
    };
  }
  
  btnInit.onclick = () => {
    logEvent('INFO', 'Initialize Firebase button clicked');
    const cfg = readConfig();
    if (!cfg) {
      logEvent('ERROR', 'Failed to read Firebase config');
      return;
    }
    
    try {
      if (!getApps().length) {
        app = initializeApp(cfg);
        logEvent('INFO', 'Firebase app initialized');
      } else {
        logEvent('INFO', 'Firebase app already exists');
      }
      
      clientAuth = getClientAuth();
      logEvent('INFO', 'Firebase Auth initialized');

      // Connect to Auth emulator in development
      if (window.location.hostname === 'localhost') {
        connectAuthEmulator(clientAuth, 'http://localhost:9099');
        logEvent('INFO', 'Connected to Firebase Auth Emulator');
      }

      setOutput('respOut', { status: 'Firebase initialized successfully' });
      onAuthStateChanged(clientAuth, (user) => {
        const payload = { status: 'Auth state changed', user: user ? { uid: user.uid, email: user.email } : null };
        setOutput('respOut', payload);
        logEvent('AUTH_STATE', payload);
      });
    } catch (error) {
      logEvent('ERROR', `Firebase initialization failed: ${error.message}`);
      setOutput('respOut', { error: error.message });
    }
  };

  qs('btnSignUp').onclick = async () => {
    try {
      if (!clientAuth) return alert('Initialize Firebase first');
      const email = qs('email').value.trim();
      const password = qs('password').value;
      const cred = await createUserWithEmailAndPassword(clientAuth, email, password);
      setOutput('respOut', { action: 'signUp', uid: cred.user.uid, email: cred.user.email });
      logEvent('SIGN_UP', { uid: cred.user.uid, email: cred.user.email });
    } catch (e) {
      setOutput('respOut', { error: e.message });
      logEvent('ERROR', e.message);
    }
  };

  qs('btnSignIn').onclick = async () => {
    try {
      if (!clientAuth) return alert('Initialize Firebase first');
      const email = qs('email').value.trim();
      const password = qs('password').value;
      const cred = await signInWithEmailAndPassword(clientAuth, email, password);
      setOutput('respOut', { action: 'signIn', uid: cred.user.uid, email: cred.user.email });
      logEvent('SIGN_IN', { uid: cred.user.uid, email: cred.user.email });
    } catch (e) {
      setOutput('respOut', { error: e.message });
      logEvent('ERROR', e.message);
    }
  };

  qs('btnSignOut').onclick = async () => {
    try {
      if (!clientAuth) return alert('Initialize Firebase first');
      await signOut(clientAuth);
      setOutput('respOut', { action: 'signOut', status: 'ok' });
      logEvent('SIGN_OUT');
    } catch (e) {
      setOutput('respOut', { error: e.message });
      logEvent('ERROR', e.message);
    }
  };

  qs('btnToken').onclick = async () => {
    try {
      if (!clientAuth) return alert('Initialize Firebase first');
      const user = clientAuth.currentUser;
      if (!user) return setOutput('tokenOut', 'No user signed in');
      const token = await user.getIdToken(/* forceRefresh */ true);
      setOutput('tokenOut', token);
      logEvent('TOKEN', token.substring(0, 24) + '...');
    } catch (e) {
      setOutput('tokenOut', e.message);
      logEvent('ERROR', e.message);
    }
  };

  qs('btnCallMe').onclick = async () => {
    try {
      const { res, data } = await fetchWithAuth('/api/users/me');
      setOutput('respOut', { status: res.status, data });
    } catch (e) {
      setOutput('respOut', { error: e.message });
      logEvent('ERROR', e.message);
    }
  };

  // Users
  qs('btnUsersMeGet').onclick = async () => {
    try {
      const { res, data } = await fetchWithAuth('/api/users/me');
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  qs('btnUsersMePatch').onclick = async () => {
    try {
      const schema_version = qs('schemaVersion').value.trim();
      const body = schema_version ? { schema_version } : {};
      const { res, data } = await fetchWithAuth('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  // Measurements
  qs('btnMeasCreate').onclick = async () => {
    try {
      const payload = {
        sex: qs('mSex').value.trim(),
        dob: qs('mDob').value.trim(),
        height_cm: Number(qs('mHeight').value),
        weight_kg: Number(qs('mWeight').value),
        body_fat_pct: Number(qs('mBfp').value)
      };
      const { res, data } = await fetchWithAuth('/api/users/me/measurements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  qs('btnMeasList').onclick = async () => {
    try {
      const { res, data } = await fetchWithAuth('/api/users/me/measurements');
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  qs('btnMeasCurrent').onclick = async () => {
    try {
      const { res, data } = await fetchWithAuth('/api/users/me/measurements/current');
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  qs('btnMeasGetById').onclick = async () => {
    try {
      const id = qs('mId').value.trim();
      const { res, data } = await fetchWithAuth(`/api/users/me/measurements/${encodeURIComponent(id)}`);
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };

  qs('btnMeasPatchById').onclick = async () => {
    try {
      const id = qs('mId').value.trim();
      const patch = {};
      if (qs('mSex').value) patch.sex = qs('mSex').value.trim();
      if (qs('mDob').value) patch.dob = qs('mDob').value.trim();
      if (qs('mHeight').value) patch.height_cm = Number(qs('mHeight').value);
      if (qs('mWeight').value) patch.weight_kg = Number(qs('mWeight').value);
      if (qs('mBfp').value) patch.body_fat_pct = Number(qs('mBfp').value);
      const { res, data } = await fetchWithAuth(`/api/users/me/measurements/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      setOutput('respOut', { status: res.status, data });
    } catch (e) { setOutput('respOut', { error: e.message }); logEvent('ERROR', e.message); }
  };
});


