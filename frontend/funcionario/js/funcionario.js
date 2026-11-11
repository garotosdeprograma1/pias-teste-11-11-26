/* =====================================================
   MARIDO DE ALUGUEL · ÁREA DO PROFISSIONAL
   funcionario-dashboard.js — todas as ações funcionais
   ===================================================== */

   (function () {
    "use strict";

    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const onReady = (fn) => document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);
    const PAGE = document.body.dataset.page || "dashboard";
    const account = window.DafixAccount;
    if (!account) return;

    const STORAGE = {
      THEME: "dafix_theme",
      SIDEBAR: account.key("sidebar"),
      SETTINGS: account.key("settings")
    };

    /* ====== TOASTS ====== */
    function showToast({ title, message, type = "success", duration = 3800 }) {
      const wrap = $("#toasts");
      if (!wrap) return;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        info:    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8h.01M11 12h1v5h1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l10 18H2L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        error:   '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      };
      const toast = document.createElement("div");
      toast.className = `toast toast--${type}`;
      toast.setAttribute("role", "status");
      toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.success}</span><div class="toast__body"><p></p><small></small></div>`;
      toast.querySelector("p").textContent = title || "";
      toast.querySelector("small").textContent = message || "";
      toast.querySelector("small").hidden = !message;
      wrap.appendChild(toast);
      setTimeout(() => { toast.classList.add("is-leaving"); toast.addEventListener("animationend", () => toast.remove(), { once: true }); }, duration);
    }
    window._showToast = showToast;

    /* ====== THEME ====== */
    function initTheme() {
      const root = document.body;
      const toggle = $("#themeToggle");
      const saved = localStorage.getItem(STORAGE.THEME) || localStorage.getItem("mda.pro.theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
      if (!toggle) return;
      toggle.addEventListener("click", () => {
        const current = root.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        localStorage.setItem(STORAGE.THEME, next);
        showToast({ title: next === "dark" ? "Modo escuro ativado" : "Modo claro ativado", message: "Preferência salva automaticamente.", type: "info" });
        const setDark = $("#setDark"); if (setDark) setDark.checked = (next === "dark");
      });
    }

    /* ====== SIDEBAR ====== */
    function initSidebar() {
      const shell = $("#appShell");
      const menuBtn = $("#menuToggle");
      const overlay = $("#sidebarOverlay");
      const collapseBtn = $("#sidebarCollapse");
      if (!shell) return;
      if (localStorage.getItem(STORAGE.SIDEBAR) === "collapsed" && window.innerWidth > 1024) shell.classList.add("is-collapsed");
      const syncButton = () => {
        if (!menuBtn) return;
        const mobile = window.innerWidth <= 1024;
        const expanded = mobile ? shell.classList.contains("is-mobile-open") : !shell.classList.contains("is-collapsed");
        menuBtn.setAttribute("aria-controls", "sidebar");
        menuBtn.setAttribute("aria-expanded", String(expanded));
        menuBtn.setAttribute("aria-label", expanded ? "Recolher menu" : "Abrir menu");
      };
      const closeMobile = () => { shell.classList.remove("is-mobile-open"); overlay?.setAttribute("aria-hidden", "true"); syncButton(); };
      const toggleDesktop = () => {
        closeMobile();
        shell.classList.toggle("is-collapsed");
        localStorage.setItem(STORAGE.SIDEBAR, shell.classList.contains("is-collapsed") ? "collapsed" : "expanded");
        syncButton();
      };
      menuBtn?.addEventListener("click", () => {
        if (window.innerWidth > 1024) { toggleDesktop(); return; }
        shell.classList.toggle("is-mobile-open");
        overlay?.setAttribute("aria-hidden", String(!shell.classList.contains("is-mobile-open")));
        syncButton();
      });
      overlay?.addEventListener("click", closeMobile);
      collapseBtn?.addEventListener("click", () => window.innerWidth <= 1024 ? closeMobile() : toggleDesktop());
      $("#sidebar")?.addEventListener("click", event => { if (event.target.closest("a, [data-action]")) closeMobile(); });
      document.addEventListener("keydown", event => { if (event.key === "Escape" && shell.classList.contains("is-mobile-open")) { closeMobile(); menuBtn?.focus(); } });
      window.addEventListener("resize", () => { if (window.innerWidth > 1024) closeMobile(); syncButton(); });
      syncButton();
    }

    /* ====== DROPDOWNS ====== */
    function initDropdowns() {
      const items = [{ btn: "#notifToggle", panel: "#notifPanel" }, { btn: "#userToggle", panel: "#userPanel" }];
      const closeAll = (except) => {
        items.forEach(({ btn, panel }) => {
          const b = $(btn), p = $(panel); if (!b || !p) return;
          if (panel === except) return;
          b.setAttribute("aria-expanded", "false"); p.classList.remove("is-open");
        });
      };
      items.forEach(({ btn, panel }) => {
        const b = $(btn), p = $(panel); if (!b || !p) return;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          const isOpen = p.classList.contains("is-open");
          closeAll(panel);
          if (!isOpen) { p.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); }
          else { p.classList.remove("is-open"); b.setAttribute("aria-expanded", "false"); }
        });
      });
      document.addEventListener("click", (e) => { if (!e.target.closest(".notifications, .user-menu")) closeAll(null); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(null); });

      // Click em itens de notificação
      $$(".notif-item").forEach((item) => {
        item.addEventListener("click", () => {
          item.classList.remove("notif-item--new");
          const remaining = $$(".notif-item--new").length;
          const badge = $(".notif-badge");
          if (badge) { if (remaining > 0) badge.textContent = remaining; else badge.remove(); }

          // Fechar dropdown
          const panel = $("#notifPanel"), notifBtn = $("#notifToggle");
          if (panel) panel.classList.remove("is-open");
          if (notifBtn) notifBtn.setAttribute("aria-expanded", "false");

          // Navegar para a página relacionada
          const target = item.dataset.notifTarget;
          if (!target) return;

          if (target === "funcionario-dashboard.html#reviews" && PAGE === "dashboard") {
            // Já está no dashboard: mudar para aba visão geral e rolar até avaliações
            if (typeof switchTab === "function") switchTab("overview");
            setTimeout(() => {
              const reviewsEl = document.querySelector(".reviews");
              if (reviewsEl) reviewsEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 350);
          } else {
            window.location.href = target;
          }
        });
      });
    }

    /* ====== TABS ====== */
    function moveTabsIndicator(activeBtn) {
      const indicator = $("#tabsIndicator");
      if (!indicator || !activeBtn) return;
      indicator.style.transform = `translateX(${activeBtn.offsetLeft - 6}px)`;
      indicator.style.width = `${activeBtn.offsetWidth}px`;
    }
    function switchTab(tabKey) {
      const btn = $(`#tabBtn-${tabKey}`); const panel = $(`#tab-${tabKey}`);
      if (!btn || !panel) return;
      $$(".tab").forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      $$(".tab-panel").forEach((p) => { p.classList.remove("is-active"); p.setAttribute("hidden", ""); });
      btn.classList.add("is-active"); btn.setAttribute("aria-selected", "true");
      panel.classList.add("is-active"); panel.removeAttribute("hidden");
      moveTabsIndicator(btn);
    }
    window._switchTab = switchTab;
    function initTabs() {
      const buttons = $$(".tab");
      if (!buttons.length) return;
      buttons.forEach((b) => {
        b.addEventListener("click", () => switchTab(b.dataset.tab));
        b.addEventListener("keydown", (e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const idx = buttons.indexOf(b);
            const next = e.key === "ArrowRight" ? buttons[(idx+1)%buttons.length] : buttons[(idx-1+buttons.length)%buttons.length];
            next.focus(); switchTab(next.dataset.tab);
          }
        });
      });
      requestAnimationFrame(() => moveTabsIndicator($(".tab.is-active")));
      window.addEventListener("resize", () => moveTabsIndicator($(".tab.is-active")));
    }

    /* ====== MODALS GENÉRICOS ====== */
    function openModal(id) {
      const modal = $("#" + id); if (!modal) return;
      modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const firstInput = modal.querySelector("input, select, textarea, button:not([data-close-modal])");
      setTimeout(() => firstInput && firstInput.focus(), 200);
    }
    function closeModal(modal) {
      if (typeof modal === "string") modal = $("#" + modal);
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      if (!$(".modal.is-open")) document.body.style.overflow = "";
    }
    window._openModal = openModal;
    window._closeModal = closeModal;
    function initModalsBase() {
      document.addEventListener("click", (e) => {
        const close = e.target.closest("[data-close-modal]");
        if (close) { const modal = close.closest(".modal"); if (modal) closeModal(modal); }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { const open = $(".modal.is-open"); if (open) closeModal(open); }
      });
    }

    /* ====== PROFILE / EDIT MODAL ====== */
    function loadProfile() { return account.loadProfile(); }
    function saveProfile(p) { return account.saveProfile(p); }
    function initialsFromName(name) {
      const parts = (name || "").trim().split(/\s+/).filter(Boolean);
      return parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() : "—";
    }
    function applyProfileToUI(p) {
      const initials = initialsFromName(p.name);
      const fields = {
        "#profileName, .user-menu__name, .user-card__name": p.name,
        "#profileRole, .user-menu__role": p.specialty,
        "#profilePhone": p.phone,
        "#profileCity": p.city,
        "#profileEmail, .user-card__meta": p.email,
        "#profileBio": p.bio,
        "#profileSpecialty": p.specialty
      };
      Object.entries(fields).forEach(([selector, value]) => {
        $$(selector).forEach(element => { element.textContent = value || "Não informado"; });
      });
      const greeting = $("#accountGreeting");
      if (greeting) {
        const hour = new Date().getHours();
        const welcome = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
        const firstName = (p.name || "").trim().split(/\s+/)[0];
        greeting.textContent = firstName ? `${welcome}, ${firstName}` : welcome;
      }
      $$(".avatar__initials").forEach(element => { element.textContent = initials; });
      const photo = typeof p.photo === "string" && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(p.photo) ? p.photo : "";
      $$(".user-menu .avatar, .profile__id .avatar, #uploadPreview").forEach(avatar => {
        avatar.style.backgroundImage = photo ? `url("${photo}")` : "";
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        const label = avatar.querySelector(".avatar__initials");
        if (label) label.style.display = photo ? "none" : "";
      });
      const preview = $("#uploadPreview");
      if (preview) {
        if (photo) preview.dataset.photo = photo;
        else delete preview.dataset.photo;
      }
    }
    function fillForm(p) {
      $("#fName") && ($("#fName").value = p.name || "");
      const specialty = $("#fSpec");
      if (specialty) {
        const oldCustom = specialty.querySelector("[data-account-specialty]");
        if (oldCustom) oldCustom.remove();
        if (p.specialty && !Array.from(specialty.options).some(option => option.value === p.specialty)) {
          const option = new Option(p.specialty, p.specialty);
          option.dataset.accountSpecialty = "";
          specialty.add(option);
        }
        specialty.value = p.specialty || "";
      }
      $("#fPhone") && ($("#fPhone").value = p.phone || "");
      $("#fCity") && ($("#fCity").value = p.city || "");
      $("#fBio") && ($("#fBio").value = p.bio || "");
      $("#bioCount") && ($("#bioCount").textContent = (p.bio || "").length);
      $("#uploadInitials") && ($("#uploadInitials").textContent = initialsFromName(p.name));
    }
    function validatePhone(value) { const d = (value||"").replace(/\D/g,""); return d.length === 10 || d.length === 11; }
    function setError(fieldId, message) {
      const fld = $(`#${fieldId}`); if (!fld) return;
      const wrap = fld.closest(".field"); const err = $(`[data-error-for="${fieldId}"]`);
      if (message) { wrap.classList.add("is-invalid"); if (err) err.textContent = message; }
      else { wrap.classList.remove("is-invalid"); if (err) err.textContent = ""; }
    }
    function validateProfileForm() {
      let ok = true;
      if ($("#fName").value.trim().length < 3) { setError("fName", "Informe seu nome completo (mín. 3 letras)."); ok=false; } else setError("fName", "");
      if (!$("#fSpec").value) { setError("fSpec", "Selecione uma especialidade."); ok=false; } else setError("fSpec", "");
      if (!validatePhone($("#fPhone").value)) { setError("fPhone", "Telefone inválido."); ok=false; } else setError("fPhone", "");
      const city = $("#fCity").value.trim();
      const bio = $("#fBio").value.trim();
      if (city && city.length < 2) { setError("fCity", "Informe o nome da cidade ou deixe em branco."); ok=false; } else setError("fCity", "");
      if (bio && bio.length < 20) { setError("fBio", "Escreva pelo menos 20 caracteres ou deixe em branco."); ok=false; } else setError("fBio", "");
      return ok;
    }
    function initEditModal() {
      if (!$("#editModal")) return;
      $("#openEditModal") && $("#openEditModal").addEventListener("click", () => { const profile = loadProfile(); applyProfileToUI(profile); fillForm(profile); openModal("editModal"); });
      const phoneInput = $("#fPhone");
      phoneInput && phoneInput.addEventListener("input", (e) => {
        let v = e.target.value.replace(/\D/g,"").slice(0,11);
        if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
        else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
        else if (v.length > 0) v = v.replace(/^(\d{0,2})/, "($1");
        e.target.value = v;
      });
      const bio = $("#fBio");
      bio && bio.addEventListener("input", () => $("#bioCount").textContent = bio.value.length);
      const upload = $("#uploadInput");
      upload && upload.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { showToast({ title: "Arquivo inválido", message: "Selecione uma imagem JPG, PNG ou WebP.", type: "error" }); return; }
        if (file.size > 4*1024*1024) { showToast({ title: "Arquivo muito grande", message: "Tamanho máximo: 4MB.", type: "error" }); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataURL = ev.target.result;
          const preview = $("#uploadPreview");
          preview.style.backgroundImage = `url(${dataURL})`;
          const s = preview.querySelector("span"); if (s) s.style.display = "none";
          preview.dataset.photo = dataURL;
        };
        reader.readAsDataURL(file);
      });
      $("#removePhoto") && $("#removePhoto").addEventListener("click", () => {
        const preview = $("#uploadPreview");
        preview.style.backgroundImage = ""; const s = preview.querySelector("span"); if (s) s.style.display = "";
        delete preview.dataset.photo;
      });
      const form = $("#editForm");
      form && form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!validateProfileForm()) { showToast({ title: "Verifique os campos", message: "Há informações inválidas no formulário.", type: "warning" }); return; }
        const current = loadProfile();
        const updated = { ...current, name: $("#fName").value.trim(), specialty: $("#fSpec").value, phone: $("#fPhone").value.trim(), city: $("#fCity").value.trim(), bio: $("#fBio").value.trim(), photo: $("#uploadPreview").dataset.photo || null };
        try {
          saveProfile(updated); applyProfileToUI(updated); closeModal("editModal");
          showToast({ title: "Perfil atualizado", message: "Suas informações foram salvas para esta conta neste navegador.", type: "success" });
        } catch {
          showToast({ title: "Não foi possível salvar", message: "Verifique o espaço disponível no navegador ou tente uma foto menor.", type: "error" });
        }
      });
    }

    /* ====== SETTINGS ====== */
    function loadSettings() { try { return Object.assign({ notifOrders: true, notifReviews: true, notifPromo: false, available: true }, JSON.parse(localStorage.getItem(STORAGE.SETTINGS) || "{}")); } catch { return { notifOrders: true, notifReviews: true, notifPromo: false, available: true }; } }
    function initSettings() {
      if (!$("#settingsModal")) return;
      const settings = loadSettings();
      const setDark = $("#setDark"); if (setDark) setDark.checked = document.body.getAttribute("data-theme") === "dark";
      $("#setNotifOrders") && ($("#setNotifOrders").checked = settings.notifOrders);
      $("#setNotifReviews") && ($("#setNotifReviews").checked = settings.notifReviews);
      $("#setNotifPromo") && ($("#setNotifPromo").checked = settings.notifPromo);
      $("#setAvailable") && ($("#setAvailable").checked = settings.available);
      setDark && setDark.addEventListener("change", () => { $("#themeToggle").click(); });
      $("#saveSettings") && $("#saveSettings").addEventListener("click", () => {
        const s = { notifOrders: $("#setNotifOrders").checked, notifReviews: $("#setNotifReviews").checked, notifPromo: $("#setNotifPromo").checked, available: $("#setAvailable").checked };
        localStorage.setItem(STORAGE.SETTINGS, JSON.stringify(s));
        closeModal("settingsModal");
        showToast({ title: "Preferências salvas", message: "Suas configurações foram atualizadas.", type: "success" });
      });
    }

    /* ====== LOGOUT ====== */
    function initLogout() {
      const btn = $("#confirmLogout"); if (!btn) return;
      btn.addEventListener("click", () => {
        btn.disabled = true;
        window.DafixAccount.logout().catch(error => {
          btn.disabled = false;
          showToast({title:'Não foi possível sair',message:error.message,type:'error'});
        });
      });
    }

    /* ====== SHARE ====== */
    function initShare() {
      const copyBtn = $("#copyLink");
      copyBtn && copyBtn.addEventListener("click", async () => {
        const link = $("#shareLink");
        try { await navigator.clipboard.writeText(link.value); }
        catch { link.select(); document.execCommand("copy"); }
        showToast({ title: "Link copiado!", message: "Compartilhe com seus clientes.", type: "success" });
      });
      $$("[data-share]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const platform = btn.dataset.share;
          const url = encodeURIComponent($("#shareLink").value);
          const text = encodeURIComponent("Confira meu perfil profissional na Marido de Aluguel!");
          const links = {
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            instagram: null,
            email: `mailto:?subject=${text}&body=${url}`
          };
          if (platform === "instagram") {
            showToast({ title: "Instagram", message: "Copie o link e cole na sua bio do Instagram.", type: "info" });
            navigator.clipboard && navigator.clipboard.writeText($("#shareLink").value);
            return;
          }
          window.open(links[platform], "_blank", "noopener,width=600,height=600");
        });
      });
    }

    /* ====== GLOBAL ACTION HANDLER ====== */
    function initActionHandler() {
      document.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-action]");
        if (!trigger) return;
        const action = trigger.dataset.action;
        // Não bloquear o link, apenas se for âncora vazia
        const isAnchor = trigger.tagName === "A";
        if (isAnchor && trigger.getAttribute("href") === "#") e.preventDefault();

        switch (action) {
          case "open-profile-tab":
            if (PAGE === "dashboard") switchTab("profile");
            else window.location.href = "funcionario-dashboard.html#profile";
            break;
          case "open-settings": openModal("settingsModal"); break;
          case "open-logout": openModal("logoutModal"); break;

          case "open-benefits": openModal("benefitsModal"); break;
          case "share-profile":
            showToast({ title: "Compartilhamento de perfil", message: "O perfil público ainda não está disponível.", type: "info" });
            break;
          case "open-payments":
            showToast({ title: "Pagamentos", message: "Nenhum pagamento registrado.", type: "info", duration: 5000 });
            break;
          case "open-support":
            window.location.href = "../suporte/index.html";
            break;
          case "open-terms":
            showToast({ title: "Termos de uso", message: "Abra em uma nova janela para ler na íntegra.", type: "info" });
            break;
          case "open-privacy":
            showToast({ title: "Política de privacidade", message: "Sua privacidade é nossa prioridade.", type: "info" });
            break;
          case "mark-all-read":
            $$(".notif-item--new").forEach((it) => it.classList.remove("notif-item--new"));
            const badge = $(".notif-badge"); if (badge) badge.remove();
            showToast({ title: "Notificações marcadas", message: "Todas foram marcadas como lidas.", type: "success" });
            break;
          case "see-all-notifs":
            showToast({ title: "Central de notificações", message: "Em breve uma página dedicada com histórico completo.", type: "info" });
            break;
          case "see-all-reviews":
            showToast({ title: "Todas as avaliações", message: "Visualize seu histórico completo em breve.", type: "info" });
            break;
          case "agenda-options":
            e.stopPropagation();
            showToast({ title: "Opções do agendamento", message: "Reagendar · Confirmar · Cancelar", type: "info" });
            break;
          case "calendar-prev":
          case "calendar-next":
            showToast({ title: "Calendário", message: action === "calendar-prev" ? "Mês anterior" : "Próximo mês", type: "info", duration: 1800 });
            break;
          case "calendar-today":
            showToast({ title: "Hoje", message: "Voltou para a data atual.", type: "info", duration: 1800 });
            break;
          case "new-appointment":
            showToast({ title: "Novo agendamento", message: "Selecione data e horário no calendário.", type: "info" });
            break;
          case "export-data": {
            if (typeof window._exportOrders === "function") {
              const activeFilter = (() => { const fc = document.querySelector(".filter-chip.is-active"); return fc ? fc.dataset.filter : "all"; })();
              const count = window._exportOrders(activeFilter);
              const label = activeFilter && activeFilter !== "all" ? ` (${activeFilter === "completed" ? "concluídos" : activeFilter === "pending" ? "aguardando" : activeFilter === "progress" ? "em andamento" : "agendados"})` : "";
              showToast({ title: "Exportado!", message: `${count} pedido${count !== 1 ? "s" : ""}${label} baixados em CSV.`, type: "success" });
            } else {
              showToast({ title: "Exportação", message: "Nenhum dado disponível para exportar.", type: "warning" });
            }
            break;
          }
          case "filter-clear":
            $$(".filter-chip.is-active").forEach((c) => c.classList.remove("is-active"));
            const allChip = $(".filter-chip[data-filter='all']"); if (allChip) allChip.classList.add("is-active");
            const searchInput = $("#globalSearch") || $("#serviceSearch");
            if (searchInput) searchInput.value = "";
            if (typeof window._applyFilter === "function") window._applyFilter("all");
            if (typeof window._applySearch === "function") window._applySearch("");
            showToast({ title: "Filtros limpos", message: "Exibindo todos os itens.", type: "info", duration: 1800 });
            break;
        }
      });

      // Filtros (chips)
      $$(".filter-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const group = chip.closest(".filter-bar");
          if (!group) return;
          $$(".filter-chip", group).forEach((c) => c.classList.remove("is-active"));
          chip.classList.add("is-active");
          const filter = chip.dataset.filter;
          if (typeof window._applyFilter === "function") window._applyFilter(filter);
        });
      });

      // Search field handler
      const search = $("#globalSearch");
      search && search.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        if (typeof window._applySearch === "function") window._applySearch(term);
      });

      // Trata abertura via hash #profile
      if (window.location.hash === "#profile" && PAGE === "dashboard") {
        setTimeout(() => switchTab("profile"), 300);
      }
    }

    /* ====== ATALHOS DE TECLADO ====== */
    function initShortcuts() {
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault(); const input = $(".search input"); input && input.focus();
        }
        if (e.altKey && e.key.toLowerCase() === "t") { e.preventDefault(); $("#themeToggle") && $("#themeToggle").click(); }
      });
    }

    /* ====== YEAR ====== */
    function initYear() { const el = $("#year"); if (el) el.textContent = new Date().getFullYear(); }

    /* ====== INIT ====== */
    onReady(() => {
      if (!account.requireProfile("funcionario")) return;
      applyProfileToUI(loadProfile());
      initTheme();
      initSidebar();
      initDropdowns();
      initTabs();

      initModalsBase();
      initEditModal();



      initSettings();
      initLogout();
      initShare();
      initActionHandler();
      initShortcuts();
      initYear();

      // Page-specific renderers
      if (PAGE === "servicos" && typeof window._initServicesPage === "function") window._initServicesPage();
      if (PAGE === "pedidos"  && typeof window._initPedidosPage === "function") window._initPedidosPage();
      if (PAGE === "agenda"   && typeof window._initAgendaPage === "function") window._initAgendaPage();
    });

  })();
