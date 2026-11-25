/* Historial de sorteos por universo. Sin dependencias externas. */
(function (root) {
  'use strict';
  const GROUPS = [
    ['masters', 'Masterminds'],
    ['heroes', 'Héroes'],
    ['villains', 'Villanos'],
    ['henchmen', 'Esbirros'],
    ['schemes', 'Planes']
  ];
  const DEFAULTS = { masters: true, heroes: true, villains: true, henchmen: false, schemes: false };
  function create(namespace, catalog) {
    const storageKey = 'legendary-no-repeat-v1-' + namespace;
    let state = { enabled: { ...DEFAULTS }, used: Object.fromEntries(GROUPS.map(([k]) => [k, []])) };
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (stored && typeof stored === 'object') {
        for (const [k] of GROUPS) {
          if (typeof stored.enabled?.[k] === 'boolean') state.enabled[k] = stored.enabled[k];
          if (Array.isArray(stored.used?.[k]))
            state.used[k] = [...new Set(stored.used[k].filter(x => typeof x === 'string'))];
        }
      }
    } catch (error) { console.warn('Historial no disponible', error); }
    const save = () => {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); }
      catch (error) { console.warn('No se pudo guardar el historial', error); }
    };
    const allow = (k, name) => !state.enabled[k] || !state.used[k].includes(name);
    const available = (k, names) => names.filter(name => allow(k, name));
    let section;
    function draw() {
      if (!section) return;
      const sets = catalog();
      for (const [k] of GROUPS) {
        const label = section.querySelector('[data-count="' + k + '"]');
        const names = sets[k] || [];
        const remaining = available(k, names);
        label.textContent = state.used[k].length + ' usados · ' + remaining.length + ' disponibles' + (state.enabled[k] ? '' : ' (libre)');
        section.querySelector('[data-switch="' + k + '"]').checked = state.enabled[k];
      }
    }
    function mount(beforeNode) {
      const style = document.createElement('style');
      style.textContent = '.nr-panel{border:1px solid #6b657e;border-radius:13px;padding:17px 20px;margin:18px 0;background:#202337;color:#f5f0ed;font:14px/1.5 system-ui,sans-serif}.nr-panel h2{font-size:20px;margin:0 0 7px}.nr-panel p{color:#c3bfd4;margin:0 0 12px}.nr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px}.nr-item{border:1px solid #514c68;border-radius:8px;padding:10px}.nr-item label{display:flex;gap:9px;align-items:center;color:inherit;margin:0;font-weight:600}.nr-item input{accent-color:#77c7ff;min-width:18px;min-height:18px}.nr-item small{display:block;color:#bcb9ce;margin:5px 0}.nr-panel button{min-height:37px;padding:7px 11px;border-radius:6px;border:1px solid #707187;background:#171b2b;color:#eee;cursor:pointer}.nr-actions{display:flex;gap:10px;margin-top:13px;flex-wrap:wrap}.nr-panel .nr-reset-all{border-color:#e9a497;color:#ffd0c8}@media print{.nr-panel{display:none!important}}';
      document.head.appendChild(style);
      section = document.createElement('section');
      section.className = 'nr-panel';
      section.innerHTML = '<h2>🔁 Sorteo sin repeticiones</h2><p>Marca qué categorías no pueden repetirse. El historial se guarda en este dispositivo y es independiente de otros universos.</p><div class="nr-grid">' + GROUPS.map(([k, title]) => '<div class="nr-item"><label><input type="checkbox" data-switch="' + k + '"> ' + title + '</label><small data-count="' + k + '"></small><button type="button" data-reset="' + k + '">Resetear ' + title + '</button></div>').join('') + '</div><div class="nr-actions"><button type="button" class="nr-reset-all">Resetear todo el historial</button></div>';
      beforeNode.parentElement.insertBefore(section, beforeNode);
      for (const [k, title] of GROUPS) {
        section.querySelector('[data-switch="' + k + '"]').addEventListener('change', e => {
          state.enabled[k] = e.target.checked; save(); draw();
        });
        section.querySelector('[data-reset="' + k + '"]').addEventListener('click', () => {
          if (!confirm('¿Borrar el historial de ' + title + ' en ' + namespace.toUpperCase() + '?')) return;
          state.used[k] = []; save(); draw();
        });
      }
      section.querySelector('.nr-reset-all').addEventListener('click', () => {
        if (!confirm('¿Resetear TODO el historial de ' + namespace.toUpperCase() + '?')) return;
        for (const [k] of GROUPS) state.used[k] = [];
        save(); draw();
      });
      draw();
      return section;
    }
    function commit(selections) {
      for (const [k] of GROUPS) {
        if (!state.enabled[k]) continue;
        const values = Array.isArray(selections[k]) ? selections[k] : [];
        state.used[k] = [...new Set([...state.used[k], ...values])];
      }
      save();
      draw();
    }
    return { state, allow, available, mount, draw, commit };
  }
  root.LegendaryNoRepeat = { create, GROUPS };
})(window);
