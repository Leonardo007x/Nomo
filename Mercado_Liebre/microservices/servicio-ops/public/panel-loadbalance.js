/**
 * Prueba de balanceo de carga — usuarios (2 réplicas vía gateway Nginx).
 */
(function () {
  function api(path) {
    const base = window.location.origin;
    return base + path;
  }

  function headers() {
    const raw = (document.getElementById('token') && document.getElementById('token').value) || '';
    const t = raw.trim().replace(/^bearer\s+/i, '');
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  function formatResult(j) {
    if (!j || j.error) return JSON.stringify(j, null, 2);
    const lines = [
      'Estrategia: ' + (j.strategy || 'nginx'),
      'Peticiones: ' + j.requests + ' (OK: ' + j.ok + ')',
      'Réplicas vistas: ' + j.replicas_seen + ' / ' + j.replicas_expected,
      'Balanceo OK: ' + (j.load_balanced ? 'sí — el gateway repartió entre réplicas' : 'no — revisá usuarios-service-2'),
      '',
      'Distribución:',
    ];
    const dist = j.distribution || {};
    Object.keys(dist)
      .sort()
      .forEach((k) => {
        const pct = j.requests ? Math.round((dist[k] / j.requests) * 100) : 0;
        lines.push('  ' + k + ': ' + dist[k] + ' (' + pct + '%)');
      });
    if (j.hint) lines.push('', j.hint);
    if (j.errors && j.errors.length) {
      lines.push('', 'Errores (muestra):', JSON.stringify(j.errors, null, 2));
    }
    return lines.join('\n');
  }

  async function runLbTest() {
    const out = document.getElementById('lbOut');
    const n = document.getElementById('lbRequests');
    const requests = n ? n.value : 40;
    if (out) out.textContent = 'Ejecutando ' + requests + ' peticiones vía gateway…';
    try {
      const res = await fetch(
        api('/api/ops/load-balance/test?requests=' + encodeURIComponent(requests)),
        { headers: headers() }
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        out.textContent = j.error || res.statusText || 'Error';
        return;
      }
      out.textContent = formatResult(j);
    } catch (e) {
      if (out) out.textContent = String(e.message || e);
    }
  }

  async function loadLbCommands() {
    const pre = document.getElementById('lbCommandsPre');
    if (!pre) return;
    try {
      const res = await fetch(api('/api/ops/load-balance/commands'), { headers: headers() });
      pre.textContent = res.ok ? await res.text() : 'No se pudieron cargar comandos.';
    } catch (e) {
      pre.textContent = String(e.message || e);
    }
  }

  function initPanelLoadBalance() {
    const btn = document.getElementById('btnLbTest');
    const copy = document.getElementById('btnLbCopy');
    if (btn) btn.onclick = runLbTest;
    if (copy) {
      copy.onclick = () => {
        const pre = document.getElementById('lbCommandsPre');
        if (!pre) return;
        navigator.clipboard.writeText(pre.textContent).catch(() => {});
      };
    }
    loadLbCommands();
  }

  window.initPanelLoadBalance = initPanelLoadBalance;
})();
