/**
 * AuthService & Database Integration Abstraction
 * Manages user accounts, session state, and barbershop customization settings.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    USERS: 'barber_app_users_v1',
    SESSION: 'barber_app_active_session_v1'
  };

  const DatabaseAdapter = {
    getUsers: function () {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : {};
      } catch (e) { return {}; }
    },
    saveUser: function (user) {
      const users = this.getUsers();
      users[user.email.toLowerCase()] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },
    findUser: function (email) {
      const users = this.getUsers();
      return users[email.toLowerCase()] || null;
    },
    getActiveSession: function () {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.SESSION);
        return data ? JSON.parse(data) : null;
      } catch (e) { return null; }
    },
    setActiveSession: function (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    },
    clearActiveSession: function () {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  };

  let currentUser = DatabaseAdapter.getActiveSession();

  const AuthService = {
    getCurrentUser: function () { return currentUser; },
    isLoggedIn: function () { return !!currentUser; },

    register: function (email, password, shopName) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) throw new Error('Preencha email e senha corretamente.');
      if (DatabaseAdapter.findUser(cleanEmail)) throw new Error('Este email já está cadastrado. Faça login para continuar.');

      const newUser = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        password: password,
        shopName: (shopName && shopName.trim()) ? shopName.trim() : 'Minha Barbearia',
        createdAt: new Date().toISOString(),
        quizAnswers: [],
        appointments: []
      };

      DatabaseAdapter.saveUser(newUser);
      currentUser = newUser;
      DatabaseAdapter.setActiveSession(currentUser);
      this.notifyStateChange();
      return newUser;
    },

    login: function (email, password) {
      const cleanEmail = email.trim().toLowerCase();
      const user = DatabaseAdapter.findUser(cleanEmail);
      if (!user) throw new Error('Usuário não encontrado. Crie uma conta para acessar.');
      if (user.password !== password) throw new Error('Senha incorreta. Verifique seus dados.');
      currentUser = user;
      DatabaseAdapter.setActiveSession(currentUser);
      this.notifyStateChange();
      return currentUser;
    },

    loginWithGmail: function () {
      const gmailAccount = prompt('Digite seu email do Gmail para login rápido:', 'barbeiro@gmail.com');
      if (!gmailAccount || !gmailAccount.includes('@')) return null;

      const cleanEmail = gmailAccount.trim().toLowerCase();
      let user = DatabaseAdapter.findUser(cleanEmail);
      if (!user) {
        user = {
          id: 'usr_gmail_' + Date.now(),
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          provider: 'google',
          shopName: 'Barbearia de ' + cleanEmail.split('@')[0],
          createdAt: new Date().toISOString(),
          quizAnswers: [],
          appointments: []
        };
        DatabaseAdapter.saveUser(user);
      }
      currentUser = user;
      DatabaseAdapter.setActiveSession(currentUser);
      this.notifyStateChange();
      return currentUser;
    },

    updateShopName: function (newShopName) {
      if (!currentUser) return;
      const cleanName = newShopName.trim();
      if (!cleanName) return;
      currentUser.shopName = cleanName;
      DatabaseAdapter.saveUser(currentUser);
      DatabaseAdapter.setActiveSession(currentUser);
      window.dispatchEvent(new CustomEvent('shopNameUpdated', { detail: { shopName: cleanName } }));
      this.notifyStateChange();
    },

    logout: function () {
      currentUser = null;
      DatabaseAdapter.clearActiveSession();
      this.notifyStateChange();
    },

    notifyStateChange: function () {
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: currentUser } }));
    }
  };

  window.AuthService = AuthService;

  document.addEventListener('DOMContentLoaded', function () {
    initAuthUI();
  });

  function initAuthUI() {
    const modalBackdrop = document.getElementById('authModalBackdrop');
    const shopModalBackdrop = document.getElementById('shopModalBackdrop');
    const closeBtns = document.querySelectorAll('.auth-modal-close');
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    const loginForm = document.getElementById('authLoginForm');
    const signupForm = document.getElementById('authSignupForm');
    const gmailBtn = document.getElementById('authGmailBtn');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const navAccountBtn = document.getElementById('btnNavAccount');
    const logoutBtn = document.getElementById('btnLogout');
    const openShopCustomizerBtn = document.getElementById('btnOpenShopCustomizer');
    const saveShopNameBtn = document.getElementById('btnSaveShopName');
    const alertBox = document.getElementById('authAlert');

    // Show auth modal on page load if NOT logged in
    if (!AuthService.isLoggedIn()) {
      setTimeout(() => { openAuthModal('signup'); }, 500);
    }

    // ── Modal open/close ──────────────────────────────────────────────────────
    window.openAuthModal = function (tab) {
      if (!modalBackdrop) return;
      if (userMenuDropdown) userMenuDropdown.classList.remove('active');
      modalBackdrop.classList.add('active');
      if (tab) switchTab(tab);
    };

    window.closeAuthModal = function () {
      if (modalBackdrop) modalBackdrop.classList.remove('active');
      if (shopModalBackdrop) shopModalBackdrop.classList.remove('active');
      hideAlert();
    };

    closeBtns.forEach(btn => btn.addEventListener('click', window.closeAuthModal));

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) window.closeAuthModal(); });
    }
    if (shopModalBackdrop) {
      shopModalBackdrop.addEventListener('click', e => { if (e.target === shopModalBackdrop) window.closeAuthModal(); });
    }

    // ── Tab switching ─────────────────────────────────────────────────────────
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function () { switchTab(this.getAttribute('data-tab')); });
    });

    function switchTab(tab) {
      tabBtns.forEach(b => b.classList.remove('active'));
      const activeTabBtn = document.querySelector(`.auth-tab-btn[data-tab="${tab}"]`);
      if (activeTabBtn) activeTabBtn.classList.add('active');
      hideAlert();
      const titleEl = document.getElementById('authModalTitle');
      if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (signupForm) signupForm.style.display = 'none';
        if (titleEl) titleEl.textContent = 'Entrar na conta';
      } else {
        if (loginForm) loginForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'block';
        if (titleEl) titleEl.textContent = 'Criar conta';
      }
    }

    // ── Alert helpers ─────────────────────────────────────────────────────────
    function showAlert(msg, isError) {
      if (!alertBox) return;
      alertBox.textContent = msg;
      alertBox.className = 'auth-alert ' + (isError ? 'error' : 'success');
      alertBox.style.display = 'block';
    }
    function hideAlert() {
      if (alertBox) alertBox.style.display = 'none';
    }

    // ── Signup ────────────────────────────────────────────────────────────────
    if (signupForm) {
      signupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        try {
          AuthService.register(
            document.getElementById('signupEmail').value,
            document.getElementById('signupPassword').value,
            document.getElementById('signupShopName').value
          );
          showAlert('Conta criada com sucesso! Bem-vindo!', false);
          setTimeout(() => window.closeAuthModal(), 800);
        } catch (err) { showAlert(err.message, true); }
      });
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    if (loginForm) {
      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        try {
          AuthService.login(
            document.getElementById('loginEmail').value,
            document.getElementById('loginPassword').value
          );
          showAlert('Login realizado com sucesso!', false);
          setTimeout(() => window.closeAuthModal(), 800);
        } catch (err) { showAlert(err.message, true); }
      });
    }

    // ── Gmail login ───────────────────────────────────────────────────────────
    if (gmailBtn) {
      gmailBtn.addEventListener('click', function () {
        try {
          const user = AuthService.loginWithGmail();
          if (user) {
            showAlert('Logado com sucesso via Gmail!', false);
            setTimeout(() => window.closeAuthModal(), 800);
          }
        } catch (err) { showAlert(err.message, true); }
      });
    }

    // ── Unified account icon button → dropdown ────────────────────────────────
    if (navAccountBtn) {
      navAccountBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (userMenuDropdown) userMenuDropdown.classList.toggle('active');
      });
    }

    document.addEventListener('click', function (e) {
      if (userMenuDropdown && !userMenuDropdown.contains(e.target) && e.target !== navAccountBtn) {
        userMenuDropdown.classList.remove('active');
      }
    });

    // ── Logout ────────────────────────────────────────────────────────────────
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        AuthService.logout();
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
      });
    }

    // ── Shop customizer modal ─────────────────────────────────────────────────
    if (openShopCustomizerBtn) {
      openShopCustomizerBtn.addEventListener('click', function () {
        if (userMenuDropdown) userMenuDropdown.classList.remove('active');
        if (shopModalBackdrop) {
          const input = document.getElementById('inputCustomShopName');
          const user = AuthService.getCurrentUser();
          if (input && user) input.value = user.shopName || '';
          shopModalBackdrop.classList.add('active');
        }
      });
    }

    if (saveShopNameBtn) {
      saveShopNameBtn.addEventListener('click', function () {
        const input = document.getElementById('inputCustomShopName');
        if (input && input.value.trim()) {
          AuthService.updateShopName(input.value.trim());
          if (shopModalBackdrop) shopModalBackdrop.classList.remove('active');
        }
      });
    }

    // ── Render navbar state ───────────────────────────────────────────────────
    function renderUserState() {
      const user = AuthService.getCurrentUser();
      const avatarEl = document.getElementById('userAvatarCircle');
      const emailDisplay = document.getElementById('userMenuEmail');
      const shopDisplay = document.getElementById('userMenuShopName');
      const loggedOutPanel = document.getElementById('dropdownLoggedOut');
      const loggedInPanel = document.getElementById('dropdownLoggedIn');

      if (user) {
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
        if (avatarEl) {
          avatarEl.classList.add('has-initial');
          avatarEl.textContent = initial;
        }
        if (emailDisplay) emailDisplay.textContent = user.email;
        if (shopDisplay) shopDisplay.textContent = user.shopName || 'Minha Barbearia';
        if (loggedOutPanel) loggedOutPanel.style.display = 'none';
        if (loggedInPanel) loggedInPanel.style.display = 'block';
      } else {
        if (avatarEl) {
          avatarEl.classList.remove('has-initial');
          avatarEl.innerHTML = '<i class="fas fa-user" id="navAccountIcon"></i>';
        }
        if (loggedOutPanel) loggedOutPanel.style.display = 'block';
        if (loggedInPanel) loggedInPanel.style.display = 'none';
      }
    }

    window.addEventListener('authStateChanged', renderUserState);
    renderUserState();
  }
})();
