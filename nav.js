function renderNav(active) {
  const links = [
    { href: 'index.html', label: 'Resumen', key: 'resumen' },
    { href: 'cargos.html', label: 'Cargos', key: 'cargos' },
    { href: 'industria.html', label: 'Industria', key: 'industria' },
    { href: 'script.html', label: 'Categoría de script', key: 'script' },
    { href: 'config.html', label: 'Configuración', key: 'config' },
  ];
  const el = document.getElementById('nav');
  if (!el) return;
  el.innerHTML = `
    <div class="topnav">
      <div class="topnav-inner">
        <span class="brand">Prospección · Merari</span>
        ${links.map(l => `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`).join('')}
        <span class="spacer"></span>
        <span class="updated" id="nav-updated"></span>
      </div>
    </div>`;
}

function setNavUpdated(iso) {
  const el = document.getElementById('nav-updated');
  if (el && iso) el.textContent = 'Última lectura: ' + new Date(iso).toLocaleString('es-MX');
}
