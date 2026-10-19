const fs = require('node:fs');
const path = require('node:path');

function renderTemplate(templateStr, data) {
  return templateStr.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
  });
}

function splitUpcomingPast(concerts, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = [];
  const past = [];
  for (const concert of concerts) {
    const concertDate = new Date(concert.date + 'T00:00:00');
    if (concertDate >= today) {
      upcoming.push(concert);
    } else {
      past.push(concert);
    }
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${Number(day)} de ${MONTHS_ES[Number(month) - 1]} de ${year}`;
}

function renderPosterHtml(concert) {
  if (concert.poster) {
    return `<img class="poster" src="${concert.poster}" alt="Cartel de ${concert.venue}">`;
  }
  return `<div class="poster-placeholder">[CARTEL<br>PRÓXIMAMENTE]</div>`;
}

function renderLineupHtml(lineup) {
  return lineup.join(', ');
}

function renderConciertoPage(concert, template, isUpcoming) {
  const data = {
    venue: concert.venue,
    city: concert.city,
    statusLabel: isUpcoming ? 'PRÓXIMO CONCIERTO' : 'CONCIERTO PASADO',
    posterHtml: renderPosterHtml(concert),
    dateDisplay: formatDateDisplay(concert.date),
    timeDisplay: concert.time ? ` · ${concert.time}h` : '',
    priceDisplay: concert.price || 'Más información próximamente',
    lineupHtml: renderLineupHtml(concert.lineup),
    descriptionHtml: concert.description ? `<p class="description">${concert.description}</p>` : '',
    ticketLinkHtml: concert.ticketUrl ? `<a class="cloud-link cloud-link--accent" href="${concert.ticketUrl}">Entradas</a>` : '',
    mapLinkHtml: concert.mapUrl ? `<a class="cloud-link" href="${concert.mapUrl}">Cómo llegar</a>` : ''
  };
  return renderTemplate(template, data);
}

function renderCardHtml(concert, isUpcoming) {
  const posterHtml = concert.poster
    ? `<img src="${concert.poster}" alt="Cartel de ${concert.venue}">`
    : `<div class="poster-placeholder">[CARTEL]</div>`;
  const actionHtml = (isUpcoming && concert.ticketUrl)
    ? `<a class="cloud-link cloud-link--accent" href="/conciertos/${concert.slug}/">Entradas</a>`
    : `<a class="cloud-link" href="/conciertos/${concert.slug}/">Ver detalles</a>`;
  return `
    <article class="concert-card">
      ${posterHtml}
      <div class="meta">
        <span class="venue">${concert.venue} <small>${concert.city}</small></span>
        <small>${formatDateDisplay(concert.date)}</small>
      </div>
      ${actionHtml}
    </article>`;
}

function renderCardsHtml(concerts, isUpcoming, emptyMessage) {
  if (concerts.length === 0) {
    return `<p class="note">${emptyMessage}</p>`;
  }
  return concerts.map(c => renderCardHtml(c, isUpcoming)).join('\n');
}

function renderListingPage(upcoming, past, template) {
  const data = {
    upcomingCards: renderCardsHtml(upcoming, true, 'No hay conciertos próximos. ¡Síguenos para enterarte!'),
    pastCards: renderCardsHtml(past, false, 'Todavía no hemos tocado en directo.')
  };
  return renderTemplate(template, data);
}

function copyRecursiveSync(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function copyStaticFiles(rootDir, distDir) {
  copyRecursiveSync(path.join(rootDir, 'src', 'index.html'), path.join(distDir, 'index.html'));
  copyRecursiveSync(path.join(rootDir, 'src', 'style.css'), path.join(distDir, 'style.css'));
  copyRecursiveSync(path.join(rootDir, 'src', 'merch'), path.join(distDir, 'merch'));
  copyRecursiveSync(path.join(rootDir, 'src', 'links'), path.join(distDir, 'links'));
  if (fs.existsSync(path.join(rootDir, 'assets'))) {
    copyRecursiveSync(path.join(rootDir, 'assets'), path.join(distDir, 'assets'));
  }
  copyRecursiveSync(path.join(rootDir, 'CNAME'), path.join(distDir, 'CNAME'));
}

function build(rootDir = path.join(__dirname, '..')) {
  const distDir = path.join(rootDir, 'dist');
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  copyStaticFiles(rootDir, distDir);

  const concerts = require(path.join(rootDir, 'data', 'concerts.js'));
  const { upcoming, past } = splitUpcomingPast(concerts);
  const upcomingSlugs = new Set(upcoming.map(c => c.slug));

  const conciertoTemplate = fs.readFileSync(path.join(rootDir, 'templates', 'concierto.html'), 'utf8');
  for (const concert of concerts) {
    const html = renderConciertoPage(concert, conciertoTemplate, upcomingSlugs.has(concert.slug));
    const outDir = path.join(distDir, 'conciertos', concert.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  }

  const listingTemplate = fs.readFileSync(path.join(rootDir, 'templates', 'conciertos-listing.html'), 'utf8');
  const listingHtml = renderListingPage(upcoming, past, listingTemplate);
  fs.mkdirSync(path.join(distDir, 'conciertos'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'conciertos', 'index.html'), listingHtml);

  return distDir;
}

module.exports = {
  renderTemplate,
  splitUpcomingPast,
  formatDateDisplay,
  renderPosterHtml,
  renderLineupHtml,
  renderConciertoPage,
  renderCardHtml,
  renderCardsHtml,
  renderListingPage,
  copyStaticFiles,
  build
};

if (require.main === module) {
  build();
}
