/**
 * 旅圖集 Travel Atlas — 路由與頁面渲染
 * 路由：
 *   #/                 首頁（全部地區）
 *   #/region/<id>      首頁（篩選地區）
 *   #/trip/<id>        行程頁
 */
(function () {
    'use strict';

    const A = window.TravelAtlas;
    const view = document.getElementById('app-view');
    const navInner = document.getElementById('nav-inner');

    /* ============================================================
       Utils
       ============================================================ */
    const esc = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const maps = {
        embed(stops) {
            const [start, ...rest] = stops.map(encodeURIComponent);
            const daddr = rest.length ? `&daddr=${rest.join('+to:')}` : '';
            return `https://maps.google.com/maps?saddr=${start}${daddr}&output=embed`;
        },
        nav(stops) {
            return 'https://www.google.com/maps/dir/' + stops.map(encodeURIComponent).join('/');
        },
    };

    const extLink = (url, text, cls) =>
        `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${cls}">${esc(text)}</a>`;

    function loadScript(src) {
        return new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => {
                console.warn('[TravelAtlas] 無法載入行程檔：', src);
                resolve();
            };
            document.head.appendChild(s);
        });
    }

    /* ============================================================
       Router
       ============================================================ */
    let lastPageKey = null;

    function parseRoute() {
        const [page, id] = location.hash.replace(/^#\/?/, '').split('/');
        if (page === 'trip' && id) return { page: 'trip', id: decodeURIComponent(id) };
        if (page === 'region' && id) return { page: 'home', region: decodeURIComponent(id) };
        return { page: 'home', region: 'all' };
    }

    function route() {
        const r = parseRoute();
        const pageKey = r.page === 'trip' ? `trip:${r.id}` : 'home';

        if (r.page === 'trip') {
            const trip = A.trips[r.id];
            trip ? renderTrip(trip) : renderNotFound();
        } else {
            renderHome(r.region);
        }

        if (pageKey !== lastPageKey) {
            window.scrollTo({ top: 0, behavior: 'instant' });
            view.classList.remove('view-enter');
            void view.offsetWidth;
            view.classList.add('view-enter');
        }
        lastPageKey = pageKey;
    }

    /* ============================================================
       Nav
       ============================================================ */
    const navLinkCls = 'hover:text-nordic-text transition-colors';

    function renderNav(trip) {
        if (!trip) {
            navInner.innerHTML = `
                <a href="#/" class="flex items-center space-x-2" id="nav-home">
                    <i class="fa-solid fa-leaf text-nordic-accent1"></i>
                    <span class="font-serif font-medium text-lg tracking-[0.2em]">${esc(A.site.name)}</span>
                </a>
                <div class="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-medium text-nordic-muted overflow-x-auto no-scrollbar whitespace-nowrap">
                    ${A.regions.map((r) => `<a href="#/region/${r.id}" id="nav-region-${r.id}" class="${navLinkCls}">${esc(r.name)}</a>`).join('')}
                </div>`;
            return;
        }

        const sections = [
            ['route', '路線總覽', trip.route],
            ['itinerary', '每日行程', trip.days?.length],
            ['curated', '嚴選清單', trip.curated],
            ['map-route', '導航地圖', trip.mapOverview || trip.days?.some((d) => d.map)],
        ].filter((s) => s[2]);

        navInner.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <a href="#/" id="nav-back" class="w-8 h-8 rounded-full border border-nordic-border flex items-center justify-center text-nordic-muted hover:text-nordic-text hover:border-nordic-accent1 transition-colors flex-shrink-0" title="回到所有旅程">
                    <i class="fa-solid fa-arrow-left text-xs"></i>
                </a>
                <span class="font-serif font-medium text-lg tracking-[0.2em] truncate">${esc(trip.brand || trip.title)}</span>
            </div>
            <div class="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm font-medium text-nordic-muted overflow-x-auto no-scrollbar whitespace-nowrap pl-4">
                ${sections.map(([id, label]) => `<button data-scroll="${id}" id="nav-${id}" class="${navLinkCls}">${label}</button>`).join('')}
            </div>`;
    }

    /* ============================================================
       Home
       ============================================================ */
    function renderHome(regionId) {
        document.title = `${A.site.name}｜${A.site.tagline}`;
        renderNav(null);

        const trips = A.listTrips();
        const regions = regionId === 'all' ? A.regions : A.regions.filter((r) => r.id === regionId);
        const areaCount = new Set(trips.map((t) => t.area)).size;

        const chip = (id, label, count) => `
            <a href="${id === 'all' ? '#/' : `#/region/${id}`}" id="chip-${id}"
               class="region-chip ${regionId === id ? 'is-active' : ''} px-4 py-2 rounded-full border border-nordic-border bg-white/70 text-sm text-nordic-text hover:border-nordic-accent1 flex items-center gap-2">
                ${esc(label)}<span class="text-[10px] opacity-60">${count}</span>
            </a>`;

        view.innerHTML = `
            <header class="atlas-hero pt-36 pb-20 px-4 text-center">
                <span class="blob blob-1"></span><span class="blob blob-2"></span><span class="blob blob-3"></span>
                <span class="text-nordic-accent1 font-medium tracking-[0.4em] text-xs uppercase">${esc(A.site.en)}</span>
                <h1 class="font-serif text-5xl md:text-6xl font-medium mt-5 mb-6 tracking-[0.15em]">${esc(A.site.name)}</h1>
                <p class="text-nordic-muted font-light max-w-xl mx-auto text-sm md:text-base leading-relaxed">${esc(A.site.description)}</p>
                <div class="flex justify-center gap-10 mt-12 text-center">
                    ${[
                        [trips.length, '段旅程'],
                        [areaCount, '個目的地'],
                        [A.regions.length, '個國家／地區'],
                    ].map(([n, l]) => `
                        <div>
                            <div class="font-serif text-3xl text-nordic-text">${n}</div>
                            <div class="text-[11px] text-nordic-muted tracking-widest mt-1">${l}</div>
                        </div>`).join('<div class="w-px bg-nordic-border"></div>')}
                </div>
            </header>

            <section id="trips" class="max-w-6xl mx-auto px-4 pb-24">
                <div class="flex flex-wrap justify-center gap-3 mb-14">
                    ${chip('all', '全部', trips.length)}
                    ${A.regions.map((r) => chip(r.id, r.name, trips.filter((t) => t.region === r.id).length)).join('')}
                </div>
                ${regions.length ? regions.map((r) => regionBlock(r, trips.filter((t) => t.region === r.id))).join('') : emptyRegion()}
            </section>`;

        if (window.TravelAtlasChat) window.TravelAtlasChat.setContext(homeChatContext(trips));
    }

    function regionBlock(region, trips) {
        return `
            <div class="mb-16" id="region-${region.id}">
                <div class="flex items-end justify-between border-b border-nordic-border pb-4 mb-8">
                    <div class="flex items-center gap-4">
                        <div class="w-11 h-11 rounded-full bg-white border border-nordic-border flex items-center justify-center text-nordic-accent1">
                            <i class="fa-solid ${esc(region.icon || 'fa-location-dot')}"></i>
                        </div>
                        <div>
                            <h2 class="font-serif text-2xl font-medium">${esc(region.name)}
                                <span class="text-xs text-nordic-muted tracking-[0.3em] uppercase ml-2 font-sans">${esc(region.en)}</span>
                            </h2>
                            <p class="text-xs text-nordic-muted mt-1">${esc(region.blurb || '')}</p>
                        </div>
                    </div>
                    <span class="text-xs text-nordic-muted">${trips.length} 段旅程</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${trips.map(tripCard).join('')}
                    ${trips.length ? placeholderCard(region) : emptyRegionCard(region)}
                </div>
            </div>`;
    }

    function tripCard(t) {
        const region = A.getRegion(t.region);
        const planning = t.status === 'planning';
        return `
            <a href="#/trip/${encodeURIComponent(t.id)}" id="card-${esc(t.id)}" class="trip-card group block bg-white rounded-2xl overflow-hidden border border-nordic-border">
                <div class="relative aspect-[4/3] overflow-hidden bg-nordic-bg">
                    <img src="${esc(t.cover || region?.cover || '')}" alt="${esc(t.title)}" loading="lazy" class="cover w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    <span class="absolute top-3 left-3 text-[11px] px-2.5 py-1 rounded-full bg-white/85 backdrop-blur text-nordic-text">
                        <i class="fa-regular fa-calendar mr-1 text-nordic-accent1"></i>${esc(t.duration || '')}
                    </span>
                    ${planning ? `<span class="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-nordic-text/80 text-white">規劃中</span>` : ''}
                </div>
                <div class="p-5">
                    <div class="text-[11px] tracking-[0.25em] text-nordic-accent1 uppercase mb-1">${esc(t.area || '')}</div>
                    <h3 class="font-serif text-lg font-medium mb-2 group-hover:text-nordic-accent1 transition-colors">${esc(t.title)}</h3>
                    <p class="text-xs text-nordic-muted leading-relaxed line-clamp-2 mb-4">${esc(t.summary || '')}</p>
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${(t.tags || []).map((tag) => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-nordic-bg border border-nordic-border text-nordic-muted">${esc(tag)}</span>`).join('')}
                    </div>
                    <div class="flex items-center justify-between text-xs pt-3 border-t border-nordic-border">
                        <span class="text-nordic-muted"><i class="fa-solid fa-train-subway mr-1"></i>${esc(t.transport || '')}</span>
                        <span class="text-nordic-text font-medium group-hover:translate-x-1 transition-transform">查看行程 <i class="fa-solid fa-arrow-right-long ml-1"></i></span>
                    </div>
                </div>
            </a>`;
    }

    function placeholderCard(region) {
        return `
            <div class="placeholder-card rounded-2xl border-2 border-dashed border-nordic-border min-h-[280px] flex flex-col items-center justify-center text-center p-8">
                <div class="w-12 h-12 rounded-full border border-dashed border-nordic-accent1 text-nordic-accent1 flex items-center justify-center mb-4">
                    <i class="fa-solid fa-plus"></i>
                </div>
                <h3 class="font-serif text-base mb-1">${esc(region.name)}的下一段旅程</h3>
                <p class="text-xs text-nordic-muted">預留中・等待新的足跡</p>
            </div>`;
    }

    function emptyRegionCard(region) {
        return `
            <div class="relative rounded-2xl overflow-hidden min-h-[280px] sm:col-span-2 lg:col-span-3 border border-nordic-border group">
                <img src="${esc(region.cover || '')}" alt="${esc(region.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover saturate-[0.7] group-hover:scale-105 transition-transform duration-[1.5s]">
                <div class="absolute inset-0 bg-gradient-to-r from-nordic-bg via-nordic-bg/85 to-transparent"></div>
                <div class="relative h-full flex flex-col justify-center p-8 md:p-12 max-w-md">
                    <span class="text-[11px] tracking-[0.4em] text-nordic-accent1 uppercase mb-3">Coming Soon</span>
                    <h3 class="font-serif text-2xl md:text-3xl font-medium mb-3">${esc(region.name)}旅程規劃中</h3>
                    <p class="text-sm text-nordic-muted leading-relaxed">${esc(region.blurb || '')}，<br>新的行程即將收錄於此。</p>
                </div>
            </div>`;
    }

    function emptyRegion() {
        return `<p class="text-center text-nordic-muted py-20">找不到這個地區 · <a href="#/" class="text-nordic-accent1 hover:underline">回到全部</a></p>`;
    }

    function homeChatContext(trips) {
        const list = trips
            .map((t) => `- ${t.title}（${A.getRegion(t.region)?.name || t.region}・${t.area}・${t.duration}）：${t.summary}`)
            .join('\n');
        return {
            name: `${A.site.name} 旅遊顧問 AI`,
            greeting: `哈囉！我是您的旅遊規劃顧問 ✨<br>目前旅圖集收錄了 ${trips.length} 段旅程，也可以和我討論下一趟要去哪裡！例如：`,
            suggestions: ['幫我規劃日本五天四夜的行程', '韓國首爾適合幾月去？', '台灣還有哪些適合搭火車的地方？'],
            prompt: `你是一個溫暖、專業的旅遊 AI 顧問。
使用者正在瀏覽個人旅行規劃網站「${A.site.name}」，目前收錄的行程：
${list}
使用者也可能想規劃台灣其他地區、日本、韓國等新旅程，請提供具體可行的建議。
請用繁體中文回答，語氣專業且具雅緻北歐風格。`,
        };
    }

    /* ============================================================
       Trip Page
       ============================================================ */
    function renderTrip(t) {
        document.title = t.pageTitle || `${t.title}｜${A.site.name}`;
        renderNav(t);

        view.innerHTML = [heroTpl(t), routeTpl(t), itineraryTpl(t), curatedTpl(t), mapTpl(t)].join('');

        if (t.days?.length) showDay(t.days[0].id);

        if (window.TravelAtlasChat) {
            window.TravelAtlasChat.setContext({
                name: t.ai?.name || `${t.title} 嚮導 AI`,
                greeting: t.ai?.greeting || `哈囉！有任何關於「${esc(t.title)}」的問題都可以問我喔！`,
                suggestions: t.ai?.suggestions || [],
                prompt: `你是一個溫暖、專業的戶外旅遊 AI 顧問。\n${t.ai?.context || `目前使用者正在瀏覽「${t.title}」（${t.area}・${t.duration}）。請用繁體中文回答。`}`,
            });
        }
    }

    function heroTpl(t) {
        const h = t.hero || {};
        const region = A.getRegion(t.region);
        const cover = t.cover || region?.cover || '';
        const firstSection = t.days?.length ? 'itinerary' : 'route';
        return `
            <header class="hero-bg h-[80vh] flex flex-col items-center justify-end pb-24 text-center px-4 relative" style="--hero-img:url('${esc(cover)}')">
                <div class="flex items-center gap-2 mb-5 text-[11px] text-nordic-text">
                    ${region ? `<span class="px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-nordic-border"><i class="fa-solid ${esc(region.icon)} mr-1 text-nordic-accent1"></i>${esc(region.name)}</span>` : ''}
                    ${t.duration ? `<span class="px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-nordic-border">${esc(t.duration)}</span>` : ''}
                    ${t.status === 'planning' ? `<span class="px-3 py-1 rounded-full bg-nordic-text/80 text-white">規劃中</span>` : ''}
                </div>
                <span class="text-nordic-accent1 font-medium tracking-[0.3em] text-sm mb-4 uppercase">${esc(h.tagline || '')}</span>
                <h1 class="text-4xl md:text-5xl font-serif font-medium mb-6 text-nordic-text leading-tight">${h.title || esc(t.title)}</h1>
                ${h.description ? `<p class="text-nordic-muted font-light mb-10 max-w-xl mx-auto text-sm md:text-base leading-relaxed">${h.description}</p>` : ''}
                <button data-scroll="${firstSection}" id="hero-start" class="text-nordic-text hover:text-nordic-accent1 transition duration-300 flex flex-col items-center gap-2">
                    <span class="text-xs tracking-widest font-medium">啟程</span>
                    <i class="fa-solid fa-angle-down animate-bounce text-lg"></i>
                </button>
            </header>`;
    }

    function routeTpl(t) {
        const r = t.route;
        if (!r?.stops?.length) return '';
        return `
            <section id="route" class="max-w-5xl mx-auto px-4 py-20 border-b border-nordic-border">
                <div class="text-center mb-12">
                    <h2 class="font-serif text-2xl md:text-3xl font-medium mb-3">${esc(r.title || '移動軌跡')}</h2>
                    ${r.subtitle ? `<p class="text-nordic-muted text-sm font-light">${esc(r.subtitle)}</p>` : ''}
                </div>
                <div class="relative w-full max-w-3xl mx-auto pb-8">
                    <div class="flex flex-col md:flex-row justify-between items-start relative pt-8 px-8 md:px-4 gap-8 md:gap-0">
                        <div class="hidden md:block absolute top-10 left-8 right-8 h-[1px] bg-nordic-border -z-10"></div>
                        <div class="md:hidden absolute top-8 bottom-8 left-[39px] w-[1px] bg-nordic-border -z-10"></div>
                        ${r.stops.map((s) => `
                            <div class="flex flex-row md:flex-col items-center md:relative z-10 group w-full md:w-auto">
                                <div class="w-4 h-4 rounded-full bg-nordic-bg border-[3px] border-nordic-${esc(s.color || 'accent1')} mr-4 md:mr-0 md:mb-4 group-hover:scale-125 transition-transform duration-300 flex-shrink-0"></div>
                                <div class="flex flex-col md:items-center">
                                    <span class="font-serif font-medium mb-1">${esc(s.name)}</span>
                                    <span class="text-[10px] text-nordic-muted tracking-wider">${esc(s.label || '')}</span>
                                    ${s.note ? `<div class="mt-2 text-xs text-nordic-${esc(s.color || 'accent1')}">${s.icon ? `<i class="fa-solid ${esc(s.icon)}"></i> ` : ''}${esc(s.note)}</div>` : ''}
                                </div>
                            </div>`).join('')}
                    </div>
                </div>
            </section>`;
    }

    function itineraryTpl(t) {
        if (!t.days?.length) return '';
        return `
            <section id="itinerary" class="max-w-4xl mx-auto px-4 py-20">
                <div class="overflow-x-auto no-scrollbar mb-12 border-b border-nordic-border">
                    <div class="flex w-max mx-auto space-x-8">
                        ${t.days.map((d, i) => `
                            <button id="tab-${esc(d.id)}" data-day="${esc(d.id)}" style="--tab-color:var(--c-${esc(d.color || 'accent1')})"
                                class="day-tab pb-3 px-2 font-serif text-lg transition-all focus:outline-none whitespace-nowrap">Day ${i + 1}. ${esc(d.tab || '')}</button>`).join('')}
                    </div>
                </div>
                ${t.days.map(dayTpl).join('')}
            </section>`;
    }

    function dayTpl(d) {
        const color = d.color || 'accent1';
        const items = d.items || [];
        return `
            <div id="${esc(d.id)}" class="day-content hidden">
                <div class="text-center mb-10">
                    <h3 class="text-xl font-serif mb-2">${esc(d.title || '')}</h3>
                    ${d.path ? `<p class="text-sm text-nordic-muted">${esc(d.path)}</p>` : ''}
                </div>
                <div class="timeline-container">
                    ${items.map((it, i) => itemTpl(it, color, i === items.length - 1)).join('')}
                </div>
            </div>`;
    }

    function itemTpl(it, color, last) {
        const hasExtra = it.list?.length || it.rainPlan || it.stay;
        const list = it.list?.length
            ? `<ul class="text-sm text-nordic-text space-y-2 ${it.rainPlan || it.stay ? 'mb-3' : ''}">${it.list.map((li) => listItemTpl(li, color)).join('')}</ul>`
            : '';
        return `
            <div class="timeline-item ${last ? '' : 'pb-10'}" style="--dot:var(--c-${esc(color)})">
                <div class="text-xs text-nordic-${esc(color)} font-medium tracking-widest mb-1">${esc(it.time || '')}</div>
                <h4 class="text-lg font-serif mb-2">${esc(it.title || '')}</h4>
                <div class="bg-white p-5 rounded-xl border border-nordic-border shadow-sm">
                    ${it.desc ? `<p class="text-sm text-nordic-muted leading-relaxed ${hasExtra ? 'mb-3' : ''}">${it.desc}</p>` : ''}
                    ${list}
                    ${it.rainPlan ? `<div class="text-xs bg-nordic-bg px-3 py-2 rounded-lg inline-flex text-nordic-text ${it.stay ? 'mb-3' : ''}"><i class="fa-solid fa-cloud-rain mr-2 text-nordic-muted mt-0.5"></i> 雨天備案：${esc(it.rainPlan)}</div>` : ''}
                    ${it.stay ? `<p class="text-xs text-nordic-muted"><i class="fa-solid fa-bed mr-1"></i> ${esc(it.stay)}</p>` : ''}
                </div>
            </div>`;
    }

    function listItemTpl(li, color) {
        if (typeof li === 'string') return `<li>• ${li}</li>`;
        const label = li.label ? `<span class="font-medium">${esc(li.label)}：</span> ` : '';
        const name = li.name
            ? li.url
                ? extLink(li.url, li.name, `text-nordic-${esc(color)} hover:underline`)
                : `<span class="font-medium">${esc(li.name)}</span>`
            : '';
        return `<li>• ${label}${name}${esc(li.note || '')}</li>`;
    }

    function curatedTpl(t) {
        const c = t.curated;
        if (!c?.groups?.length) return '';
        const cols = c.groups.length >= 3 ? 'md:grid-cols-3' : c.groups.length === 2 ? 'md:grid-cols-2' : '';
        return `
            <section id="curated" class="bg-white py-20 border-t border-nordic-border">
                <div class="max-w-5xl mx-auto px-4">
                    <div class="text-center mb-12">
                        <h2 class="font-serif text-2xl md:text-3xl font-medium mb-3">${esc(c.title || '嚴選清單')}</h2>
                        ${c.subtitle ? `<p class="text-nordic-muted text-sm font-light">${esc(c.subtitle)}</p>` : ''}
                    </div>
                    <div class="grid grid-cols-1 ${cols} gap-8">
                        ${c.groups.map((g) => {
                            const color = esc(g.color || 'accent1');
                            return `
                            <div class="border border-nordic-border rounded-2xl p-6 bg-nordic-bg/50">
                                <h3 class="font-serif text-lg mb-4 flex items-center"><i class="fa-solid ${esc(g.icon || 'fa-star')} text-nordic-${color} mr-2"></i> ${esc(g.title)}</h3>
                                <div class="space-y-4">
                                    ${(g.items || []).map((item) => {
                                        const tag = item.url ? 'a' : 'div';
                                        const attrs = item.url ? `href="${esc(item.url)}" target="_blank" rel="noopener noreferrer"` : '';
                                        return `
                                        <${tag} ${attrs} class="block p-4 bg-white rounded-xl hover:shadow-md transition-shadow group">
                                            <h4 class="font-medium text-nordic-text group-hover:text-nordic-${color} transition-colors">${esc(item.name)}</h4>
                                            ${item.desc ? `<p class="text-xs text-nordic-muted mt-1">${esc(item.desc)}</p>` : ''}
                                        </${tag}>`;
                                    }).join('')}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </section>`;
    }

    /* ---------- Map ---------- */
    let currentMaps = {};

    function mapTpl(t) {
        const entries = [];
        if (t.mapOverview?.stops?.length) entries.push({ key: 'overview', color: 'accent1', ...t.mapOverview });
        (t.days || []).forEach((d) => {
            if (d.map?.stops?.length) entries.push({ key: d.id, color: d.color || 'accent1', ...d.map });
        });
        if (!entries.length) return '';

        currentMaps = Object.fromEntries(entries.map((e) => [e.key, maps.embed(e.stops)]));

        return `
            <section id="map-route" class="max-w-5xl mx-auto px-4 py-20 border-t border-nordic-border">
                <div class="text-center mb-12">
                    <h2 class="font-serif text-2xl md:text-3xl font-medium mb-3">Google Maps 實境導航</h2>
                    <p class="text-nordic-muted text-sm font-light">點擊卡片查看各日路線，或點擊下方連結於手機開啟導航</p>
                </div>
                <div class="flex flex-col lg:flex-row gap-8">
                    <div class="w-full lg:w-1/3 flex flex-col space-y-4">
                        ${entries.map((e, i) => `
                            <div role="button" tabindex="0" data-map="${esc(e.key)}" id="btn-map-${esc(e.key)}"
                                class="map-card ${i === 0 ? 'is-active' : ''} p-5 bg-white border rounded-xl transition-all text-left group focus:outline-none">
                                <h4 class="font-serif text-lg text-nordic-${esc(e.color)} mb-2 group-hover:text-nordic-text transition-colors flex items-center">
                                    <i class="fa-solid ${esc(e.icon || 'fa-map-location-dot')} mr-2"></i>${esc(e.title)}
                                </h4>
                                ${e.desc ? `<p class="text-xs text-nordic-muted leading-relaxed">${esc(e.desc)}</p>` : ''}
                                <a href="${esc(maps.nav(e.stops))}" target="_blank" rel="noopener noreferrer"
                                    class="text-xs text-nordic-${esc(e.color)} font-medium hover:underline inline-flex items-center mt-3">開啟手機導航
                                    <i class="fa-solid fa-arrow-right-long ml-2"></i></a>
                            </div>`).join('')}
                    </div>
                    <div class="w-full lg:w-2/3 h-[450px] md:h-[600px] rounded-xl overflow-hidden border border-nordic-border shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] relative bg-nordic-bg">
                        <iframe id="main-map-iframe" src="${esc(currentMaps[entries[0].key])}"
                            width="100%" height="100%" style="border:0; filter: contrast(1.02) saturate(0.85);"
                            allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                            class="absolute inset-0 transition-opacity duration-500"></iframe>
                    </div>
                </div>
            </section>`;
    }

    function changeMap(key) {
        const iframe = document.getElementById('main-map-iframe');
        if (!iframe || !currentMaps[key]) return;
        iframe.src = currentMaps[key];
        document.querySelectorAll('.map-card').forEach((el) => el.classList.toggle('is-active', el.dataset.map === key));
    }

    function showDay(dayId) {
        document.querySelectorAll('.day-content').forEach((el) => {
            el.classList.add('hidden');
            el.classList.remove('fade-in');
        });
        document.querySelectorAll('.day-tab').forEach((el) => el.classList.toggle('tab-active', el.dataset.day === dayId));

        const content = document.getElementById(dayId);
        if (!content) return;
        content.classList.remove('hidden');
        setTimeout(() => content.classList.add('fade-in'), 10);
    }

    function renderNotFound() {
        document.title = `找不到行程｜${A.site.name}`;
        renderNav(null);
        view.innerHTML = `
            <section class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-16">
                <i class="fa-regular fa-compass text-4xl text-nordic-accent1 mb-6"></i>
                <h1 class="font-serif text-2xl mb-3">找不到這段旅程</h1>
                <p class="text-sm text-nordic-muted mb-8">可能是網址有誤，或行程尚未加入 catalog.js 的 tripFiles。</p>
                <a href="#/" class="px-5 py-2.5 rounded-full bg-nordic-text text-white text-sm hover:bg-nordic-accent1 transition-colors">回到所有旅程</a>
            </section>`;
    }

    /* ============================================================
       Events (delegated)
       ============================================================ */
    document.addEventListener('click', (e) => {
        const scrollBtn = e.target.closest('[data-scroll]');
        if (scrollBtn) {
            document.getElementById(scrollBtn.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        const dayBtn = e.target.closest('[data-day]');
        if (dayBtn) {
            showDay(dayBtn.dataset.day);
            return;
        }
        const mapBtn = e.target.closest('[data-map]');
        if (mapBtn && !e.target.closest('a')) changeMap(mapBtn.dataset.map);
    });

    document.addEventListener('keydown', (e) => {
        const mapBtn = e.target.closest?.('[data-map]');
        if (mapBtn && (e.key === 'Enter' || e.key === ' ') && e.target === mapBtn) {
            e.preventDefault();
            changeMap(mapBtn.dataset.map);
        }
    });

    /* ============================================================
       Boot
       ============================================================ */
    async function boot() {
        for (const file of A.tripFiles) await loadScript(file);
        route();
        window.addEventListener('hashchange', route);
    }

    boot();
})();
