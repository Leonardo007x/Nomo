/**
 * Laboratorio del panel ops: control real de breakers, escenarios, logs, comandos por escenario.
 */
(function () {
  const LOG_SERVICES = [
    'usuarios-service',
    'tiendas-service',
    'catalogo-service',
    'categorias-service',
    'media-service',
    'ia-service',
    'db-usuarios',
    'db-tiendas',
    'db-catalogo',
  ];

  const BREAKER_META = {
    usuarios: { name: 'usuarios-mysql', logTarget: 'usuarios-service' },
    tiendas: { name: 'tiendas-catalogo-productos', logTarget: 'tiendas-service' },
    catalogo: { name: 'catalogo-tiendas-owner', logTarget: 'catalogo-service' },
    categorias: { name: 'categorias-tiendas-owner', logTarget: 'categorias-service' },
    media: { name: 'media-cloudinary-upload', logTarget: 'media-service' },
    ia: { name: 'ia-groq', logTarget: 'ia-service' },
  };

  function showLabMsg(text, ok) {
    const el = document.getElementById('labMsg');
    if (!el) return;
    el.style.display = 'block';
    el.style.color = ok ? '#bbf7d0' : '#fecaca';
    el.textContent = text;
  }

  function ensureLogTargetOption(target) {
    const sel = document.getElementById('logTarget');
    if (!sel || !target) return;
    const exists = Array.from(sel.options).some((o) => o.value === target);
    if (!exists) {
      const o = document.createElement('option');
      o.value = target;
      o.textContent = target;
      sel.appendChild(o);
    }
    sel.value = target;
  }

  function scrollToLogs() {
    const el = document.getElementById('logsSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function breakerControl(service, action, name) {
    const res = await fetch(api('/api/ops/breaker-control'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ service, action, name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || j.detail || res.statusText);
    return j;
  }

  async function runScenario(id) {
    const res = await fetch(api('/api/ops/lab/run'), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ scenarioId: id }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || res.statusText);
    return j;
  }

  async function fetchLogsForTarget(target, tail) {
    const res = await fetch(
      api('/api/ops/logs?target=' + encodeURIComponent(target) + '&tail=' + encodeURIComponent(tail || 120)),
      { headers: headers() }
    );
    const text = await res.text();
    return { ok: res.ok, text: res.ok ? text : text || res.statusText };
  }

  /** Carga logs en la sección inferior y hace scroll hasta ahí. */
  async function pullLogs(target) {
    if (!target) {
      showLabMsg('Target de logs no definido.', false);
      return;
    }
    const tail = document.getElementById('logTail')?.value || '120';
    ensureLogTargetOption(target);

    try {
      showLabMsg('Cargando logs de ' + target + '…', true);

      if (typeof window.opsShowLogs === 'function') {
        window.opsShowLogs('Cargando logs de ' + target + '…');
      }

      const r = await fetchLogsForTarget(target, tail);

      if (typeof window.opsShowLogs === 'function') {
        window.opsShowLogs(r.text);
      } else {
        const out = document.getElementById('logOut');
        if (out) {
          out.style.display = 'block';
          out.textContent = r.text;
        }
      }

      scrollToLogs();
      showLabMsg(r.ok ? 'Logs cargados (' + target + ').' : 'Error al cargar logs.', r.ok);
    } catch (e) {
      showLabMsg('Logs: ' + String(e.message || e), false);
      if (typeof window.opsShowLogs === 'function') {
        window.opsShowLogs(String(e.message || e));
      }
    }
  }

  async function loadScenarioCommands(scenarioId) {
    const pre = document.getElementById('labCommandsPre');
    const btnCopy = document.getElementById('btnCopyCommands');
    if (!pre) return;

    if (!scenarioId) {
      pre.textContent = 'Elegí un escenario arriba para ver los comandos de ese caso.';
      if (btnCopy) btnCopy.disabled = true;
      return;
    }

    pre.textContent = 'Cargando comandos…';
    if (btnCopy) btnCopy.disabled = true;

    try {
      const res = await fetch(
        api('/api/ops/lab/commands?scenarioId=' + encodeURIComponent(scenarioId)),
        { headers: headers() }
      );
      const text = await res.text();
      if (!res.ok) {
        pre.textContent = text || res.statusText;
        return;
      }
      pre.textContent = text;
      if (btnCopy) btnCopy.disabled = false;
    } catch (e) {
      pre.textContent = String(e.message || e);
    }
  }

  let breakerCommandsCache = null;

  async function loadBreakerCommandsCache() {
    if (breakerCommandsCache) return breakerCommandsCache;
    try {
      const res = await fetch(api('/api/ops/lab/breaker-commands'), { headers: headers() });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.commands) {
        breakerCommandsCache = j.commands;
        return breakerCommandsCache;
      }
    } catch {
      /* ignore */
    }
    breakerCommandsCache = {};
    return breakerCommandsCache;
  }

  function appendConsoleCommands(wrap, svc, cmdText) {
    const det = document.createElement('details');
    det.className = 'lab-cmd-details';
    det.open = false;
    const sum = document.createElement('summary');
    sum.textContent = 'Comandos consola (copiar y pegar)';
    det.appendChild(sum);

    const pre = document.createElement('pre');
    pre.className = 'lab-cmd-pre';
    pre.textContent = cmdText || '(sin comandos)';
    det.appendChild(pre);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'secondary lab-copy-cmd';
    copyBtn.textContent = 'Copiar comandos de ' + svc;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent).then(
        () => showLabMsg('Comandos de ' + svc + ' copiados.', true),
        () => showLabMsg('No se pudo copiar.', false)
      );
    };
    wrap.appendChild(det);
    wrap.appendChild(copyBtn);
  }

  async function renderLabControls() {
    const host = document.getElementById('labBreakerControls');
    if (!host) return;
    host.innerHTML = '<p style="color:var(--muted);font-size:0.8rem;margin:0">Cargando comandos…</p>';
    const cmds = await loadBreakerCommandsCache();
    host.innerHTML = '';
    Object.keys(BREAKER_META).forEach((svc) => {
      const meta = BREAKER_META[svc];
      const wrap = document.createElement('div');
      wrap.className = 'lab-svc';
      wrap.innerHTML =
        '<div><strong>' + svc + '</strong> <code style="font-size:0.68rem">' + meta.name + '</code></div>';
      const actions = document.createElement('div');
      actions.className = 'lab-actions';
      ['open', 'half_open', 'close'].forEach((act) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = act === 'open' ? 'danger' : 'secondary';
        b.textContent = act === 'open' ? 'Abrir' : act === 'half_open' ? 'Semiabierto' : 'Cerrar';
        b.onclick = async () => {
          try {
            showLabMsg('Aplicando ' + act + ' en ' + svc + '…', true);
            await breakerControl(svc, act, meta.name);
            showLabMsg('Breaker actualizado. Revisá monitoreo y logs.', true);
            if (typeof loadHealth === 'function') await loadHealth();
            const auto = document.getElementById('logAuto');
            if (auto && auto.checked) await pullLogs(meta.logTarget);
          } catch (e) {
            showLabMsg(String(e.message || e), false);
          }
        };
        actions.appendChild(b);
      });
      const logBtn = document.createElement('button');
      logBtn.type = 'button';
      logBtn.className = 'secondary';
      logBtn.textContent = 'Ver logs';
      logBtn.onclick = () => pullLogs(meta.logTarget);
      actions.appendChild(logBtn);
      wrap.appendChild(actions);
      appendConsoleCommands(wrap, svc, cmds[svc] || '');
      host.appendChild(wrap);
    });
  }

  function renderLogQuickButtons() {
    const host = document.getElementById('logQuickBtns');
    if (!host) return;
    host.innerHTML = '';
    LOG_SERVICES.forEach((id) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'secondary';
      b.style.fontSize = '0.72rem';
      b.textContent = id;
      b.onclick = () => pullLogs(id);
      host.appendChild(b);
    });
  }

  async function loadScenarios() {
    const sel = document.getElementById('labScenario');
    if (!sel) return;
    try {
      const res = await fetch(api('/api/ops/lab/scenarios'), { headers: headers() });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      sel.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Elegí un escenario —';
      sel.appendChild(placeholder);
      (j.scenarios || []).forEach((s) => {
        const o = document.createElement('option');
        o.value = s.id;
        o.textContent = s.title;
        sel.appendChild(o);
      });
      sel.onchange = () => loadScenarioCommands(sel.value);
      if (sel.options.length > 1) {
        sel.selectedIndex = 1;
        await loadScenarioCommands(sel.value);
      }
    } catch {
      /* ignore */
    }
  }

  async function initPanelLab() {
    await renderLabControls();
    renderLogQuickButtons();
    loadScenarios();

    const btnRun = document.getElementById('btnRunScenario');
    if (btnRun) {
      btnRun.onclick = async () => {
        const id = document.getElementById('labScenario')?.value;
        if (!id) {
          showLabMsg('Elegí un escenario primero.', false);
          return;
        }
        try {
          showLabMsg('Ejecutando escenario…', true);
          const r = await runScenario(id);
          const out = document.getElementById('labScenarioOut');
          if (out) {
            out.style.display = 'block';
            out.textContent = JSON.stringify(r, null, 2);
          }
          showLabMsg('Escenario completado.', true);
          if (typeof loadHealth === 'function') await loadHealth();
          if (typeof loadContainers === 'function') await loadContainers();
          const meta = BREAKER_META[id.split('-')[0]];
          if (meta?.logTarget) await pullLogs(meta.logTarget);
        } catch (e) {
          showLabMsg(String(e.message || e), false);
        }
      };
    }

    const btnCopy = document.getElementById('btnCopyCommands');
    if (btnCopy) {
      btnCopy.disabled = true;
      btnCopy.onclick = () => {
        const t = document.getElementById('labCommandsPre')?.textContent || '';
        if (!t || t.startsWith('Elegí un escenario')) {
          showLabMsg('No hay comandos para copiar.', false);
          return;
        }
        navigator.clipboard.writeText(t).then(
          () => showLabMsg('Comandos del escenario copiados.', true),
          () => showLabMsg('No se pudo copiar (permiso del navegador).', false)
        );
      };
    }

    const btnReload = document.getElementById('btnReloadCommands');
    if (btnReload) {
      btnReload.onclick = () => {
        const id = document.getElementById('labScenario')?.value;
        loadScenarioCommands(id);
      };
    }

    const auto = document.getElementById('healthAutoRefresh');
    if (auto) {
      let timer = null;
      auto.onchange = () => {
        if (timer) clearInterval(timer);
        timer = null;
        if (auto.checked) {
          timer = setInterval(() => {
            if (typeof loadHealth === 'function') loadHealth();
          }, 8000);
        }
      };
    }
  }

  window.initPanelLab = initPanelLab;
  window.pullOpsLogs = pullLogs;
})();
