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
            const cleanStops = (stops || []).map((s) => (typeof s === 'object' ? s.name : s));
            const [start, ...rest] = cleanStops.map(encodeURIComponent);
            const daddr = rest.length ? `&daddr=${rest.join('+to:')}` : '';
            return `https://maps.google.com/maps?saddr=${start}${daddr}&output=embed`;
        },
        nav(stops) {
            const cleanStops = (stops || []).map((s) => (typeof s === 'object' ? s.name : s));
            return 'https://www.google.com/maps/dir/' + cleanStops.map(encodeURIComponent).join('/');
        },
    };

    const extLink = (url, text, cls) =>
        `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${cls}">${esc(text)}</a>`;

    function loadScript(src) {
        return new Promise((resolve) => {
            const s = document.createElement('script');
            // 加入時間戳記避免瀏覽器快取舊的行程資料
            s.src = `${src}${src.includes('?') ? '&' : '?'}v=${Date.now()}`;
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
        currentTrip = t;
        document.title = t.pageTitle || `${t.title}｜${A.site.name}`;
        renderNav(t);

        view.innerHTML = [heroTpl(t), routeTpl(t), itineraryTpl(t), curatedTpl(t), mapTpl(t)].join('');

        if (t.days?.length) showDay(t.days[0].id);

        const isEmbedMode = (t.mapMode === 'google-embed') || (t.region === 'taiwan' && t.mapMode !== 'interactive');
        const firstMapKey = t.mapOverview?.stops?.length ? 'overview' : (t.days?.find((d) => d.map?.stops?.length)?.id || null);
        if (!isEmbedMode && firstMapKey) {
            initTripMap(firstMapKey);
        }

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

    /* ---------- Interactive Map (Google Maps Tiles + Route Polyline) ---------- */
    const AtlasGeoTable = {
        // 台灣 宜花
        '台北火車站': [25.0478, 121.5170],
        '台北': [25.0478, 121.5170],
        '礁溪火車站': [24.8290, 121.7744],
        '礁溪': [24.8290, 121.7744],
        '林美石磐步道': [24.8329, 121.7335],
        '弎蒔手作料理': [24.8277, 121.7712],
        '張美阿嬤農場': [24.6644, 121.6963],
        '羅東林業文化園區': [24.6853, 121.7709],
        '羅東火車站': [24.6766, 121.7718],
        '羅東': [24.6766, 121.7718],
        '羅東夜市': [24.6761, 121.7681],
        '花蓮火車站': [23.9932, 121.6015],
        '花蓮': [23.9932, 121.6015],
        '七星柴魚博物館': [24.0152, 121.6315],
        '七星潭風景區': [24.0289, 121.6306],
        '七星潭': [24.0289, 121.6306],
        '花蓮美崙海鮮': [23.9928, 121.6241],
        '松園別館': [23.9822, 121.6143],
        '將軍府1936園區': [23.9786, 121.6125],
        '東大門夜市': [23.9744, 121.6111],
        '吉安慶修院': [23.9733, 121.5645],
        '蓮城蓮花園': [23.9576, 121.5518],
        '蓮花城': [23.9576, 121.5518],
        '蓮城蓮花池': [23.9576, 121.5518],
        'City Lotus Garden': [23.9576, 121.5518],
        'City Lotus Garden, No. 66號, Nanhua 5th St, Nanhua Village, Ji’an Township, Hualien County, 973': [23.9576, 121.5518],
        '慶豐麵店': [23.9780, 121.5720],

        // 韓國 釜山
        '金海國際機場': [35.1795, 128.9382],
        '金海機場': [35.1795, 128.9382],
        '海雲台海水浴場': [35.1587, 129.1604],
        '海雲台': [35.1587, 129.1604],
        '新世界百貨 Centum City': [35.1689, 129.1296],
        'Spa Land': [35.1689, 129.1296],
        '海雲台藍線公園尾浦站': [35.1594, 129.1706],
        '青沙浦站': [35.1614, 129.1915],
        '青沙浦': [35.1614, 129.1915],
        '釜山 X the SKY': [35.1598, 129.1685],
        '海雲台傳統市場': [35.1610, 129.1612],
        '松島海上纜車': [35.0760, 129.0195],
        '岩南公園': [35.0617, 129.0202],
        '南浦洞商圈': [35.0990, 129.0305],
        '南浦洞': [35.0990, 129.0305],
        '樂天百貨光復店': [35.0984, 129.0360],
        'BIFF廣場': [35.0986, 129.0270],
        '冬柏島 APEC世峰樓': [35.1527, 129.1517],
        '冬柏島': [35.1527, 129.1517],
        '錦繡河豚湯': [35.1615, 129.1633],
        '廣安里海水浴場': [35.1532, 129.1186],
        '廣安里': [35.1532, 129.1186],
        '釜山水營灣遊艇競技場': [35.1601, 129.1418],
        '水營灣遊艇競技場': [35.1601, 129.1418],
        '西面地下街': [35.1578, 129.0592],
        '西面': [35.1578, 129.0592],
    };

    // 韓國景點韓文官方名稱表（供 Naver Map 精準導航與地標對照）
    const AtlasKoreaNames = {
        '金海國際機場': '김해국제공항',
        '金海機場': '김해국제공항',
        '海雲台海水浴場': '해운대해수욕장',
        '海雲台': '해운대해수욕장',
        '新世界百貨 Centum City': '신세계백화점 센텀시티점',
        'Spa Land': '스파랜드 센텀시티',
        '東萊蔘雞湯': '동래삼계탕',
        '海雲台藍線公園尾浦站': '해운대블루라인파크 미포정거장',
        '青沙浦站': '해운대블루라인파크 청사포정거장',
        '青沙浦': '청사포',
        '秀敏家烤貝': '수민이네',
        '釜山 X the SKY': '부산엑스더스카이',
        '海雲台傳統市場': '해운대 전통시장',
        '極東豬肉湯飯': '극동돼지국밥',
        '松島海上纜車': '송도해상케이블카',
        '岩南公園': '암남공원',
        '南浦洞商圈': '남포동',
        '南浦洞': '남포동',
        '樂天百貨光復店': '롯데백화점 광복점',
        'BIFF廣場': 'BIFF 광장',
        '首爾蘿蔔塊雪濃湯': '서울깍두기 남포',
        '冬柏島 APEC世峰樓': '누리마루 APEC하우스',
        '冬柏島': '동백섬',
        '錦繡河豚湯': '금수복국 해운대본점',
        '廣安里海水浴場': '광안리해수욕장',
        '廣安里': '광안리해수욕장',
        '釜山水營灣遊艇競技場': '부산요트경기장',
        '水營灣遊艇競技場': '부산요트경기장',
        '西面地下街': '서면지하상가',
        '西面': '서면',
    };

    function resolveCoords(stop) {
        if (!stop) return null;
        if (typeof stop === 'object') {
            if (Array.isArray(stop.coords)) return stop.coords;
            if (stop.lat && stop.lng) return [stop.lat, stop.lng];
            stop = stop.name || '';
        }
        if (AtlasGeoTable[stop]) return AtlasGeoTable[stop];
        for (const [name, coords] of Object.entries(AtlasGeoTable)) {
            if (stop.includes(name) || name.includes(stop)) return coords;
        }
        return null;
    }

    function naverDirections(stops, mode = 'car') {
        const list = Array.isArray(stops) ? stops : [stops];
        const segments = list.map((stop) => {
            const name = typeof stop === 'object' ? stop.name : stop;
            const coords = resolveCoords(stop);
            const kr = AtlasKoreaNames[name] || name;
            if (coords) {
                return `${coords[1]},${coords[0]},${encodeURIComponent(kr)}`;
            }
            return encodeURIComponent(kr);
        });
        if (segments.length === 0) return 'https://map.naver.com/p/directions';
        if (segments.length === 1) {
            return `https://map.naver.com/p/directions/-/${segments[0]}/-/${mode}`;
        }
        return `https://map.naver.com/p/directions/${segments.join('/')}/-/${mode}`;
    }

    let currentTrip = null;
    let leafletMap = null;
    let mapLayers = {
        routeLayer: null,
        markersLayer: null,
    };
    let currentMapEntries = {};

    const colorHex = {
        accent1: '#C68B7C',
        accent2: '#8FA0A8',
        accent3: '#D8C2AD',
        accent4: '#9AA89B',
    };

    function mapTpl(t) {
        const entries = [];
        if (t.mapOverview?.stops?.length) entries.push({ key: 'overview', color: 'accent1', ...t.mapOverview });
        (t.days || []).forEach((d) => {
            if (d.map?.stops?.length) entries.push({ key: d.id, color: d.color || 'accent1', ...d.map });
        });
        if (!entries.length) return '';

        currentMapEntries = Object.fromEntries(entries.map((e) => [e.key, e]));

        const isEmbedMode = (t.mapMode === 'google-embed') || (t.region === 'taiwan' && t.mapMode !== 'interactive');
        const isKorea = t.region === 'korea' || t.mapProvider === 'naver';
        const firstEntry = entries[0];
        const firstEmbedUrl = firstEntry.embedUrl || maps.embed(firstEntry.stops);
        const firstNavUrl = isKorea
            ? (firstEntry.naverUrl || naverDirections(firstEntry.stops, 'car'))
            : (firstEntry.navUrl || maps.nav(firstEntry.stops));

        const mainTitle = isEmbedMode ? 'Google Maps 實境路線預覽' : (isKorea ? 'Naver Map 實境導航路線' : 'Google Maps 實境導航');
        const mainSubtitle = isKorea
            ? '繁體中文地圖預覽標記，點擊可開啟 Naver Map 當地即時導航'
            : '點擊左側路線卡片切換實境路線，或點擊地圖右上角開啟完整導航';
        const openBtnLabel = isKorea ? '在 Naver Map 開啟導航' : '在 Google Maps 開啟完整導航';
        const openBtnIcon = isKorea ? 'fa-solid fa-location-arrow text-emerald-600' : 'fa-brands fa-google text-nordic-accent1';
        const badgeText = isKorea
            ? 'Naver Map 導航 ＆ 繁體中文實境地圖'
            : (isEmbedMode ? 'Google Maps 原生實境路線' : 'Google Maps 圖資 ＆ 實境路線圖');

        return `
            <section id="map-route" class="max-w-5xl mx-auto px-4 py-20 border-t border-nordic-border">
                <div class="text-center mb-12">
                    <h2 class="font-serif text-2xl md:text-3xl font-medium mb-3">${mainTitle}</h2>
                    <p class="text-nordic-muted text-sm font-light">${mainSubtitle}</p>
                </div>
                <div class="flex flex-col lg:flex-row gap-8">
                    <div class="w-full lg:w-1/3 flex flex-col space-y-4">
                        ${entries.map((e, i) => {
                            const navUrl = isKorea
                                ? (e.naverUrl || naverDirections(e.stops, 'car'))
                                : (e.navUrl || maps.nav(e.stops));
                            const navLabel = isKorea ? 'Naver 導航' : 'Google 導航';
                            return `
                            <div role="button" tabindex="0" data-map="${esc(e.key)}" id="btn-map-${esc(e.key)}"
                                class="map-card ${i === 0 ? 'is-active' : ''} p-5 bg-white border rounded-xl transition-all text-left group focus:outline-none cursor-pointer">
                                <h4 class="font-serif text-lg text-nordic-${esc(e.color)} mb-2 group-hover:text-nordic-text transition-colors flex items-center">
                                    <i class="fa-solid ${esc(e.icon || 'fa-map-location-dot')} mr-2"></i>${esc(e.title)}
                                </h4>
                                ${e.desc ? `<p class="text-xs text-nordic-muted leading-relaxed">${esc(e.desc)}</p>` : ''}
                                <div class="flex items-center justify-between mt-3 pt-2 border-t border-nordic-border/60">
                                    <span class="text-[11px] text-nordic-muted">${(e.stops || []).length} 個站點</span>
                                    <a href="${esc(navUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"
                                        class="text-xs text-nordic-${esc(e.color)} font-medium hover:underline inline-flex items-center">
                                        ${navLabel} <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
                                    </a>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="w-full lg:w-2/3 h-[450px] md:h-[600px] rounded-2xl overflow-hidden border border-nordic-border shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative bg-nordic-bg">
                        ${isEmbedMode ? `
                            <iframe id="gmaps-preview-frame"
                                class="w-full h-full border-0 rounded-2xl"
                                src="${esc(firstEmbedUrl)}"
                                loading="lazy"
                                allowfullscreen
                                referrerpolicy="no-referrer-when-downgrade">
                            </iframe>
                        ` : `
                            <div id="interactive-map" class="w-full h-full z-0"></div>
                        `}
                        <div class="absolute top-4 right-4 z-[400]">
                            <a id="btn-open-gmaps" href="${esc(firstNavUrl)}" target="_blank" rel="noopener noreferrer"
                               class="px-4 py-2 rounded-full bg-white/95 backdrop-blur text-nordic-text border border-nordic-border shadow-md text-xs font-medium hover:text-nordic-accent1 hover:border-nordic-accent1 transition-all flex items-center gap-2">
                                <i class="${openBtnIcon}"></i>
                                <span>${openBtnLabel}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-[10px] opacity-70"></i>
                            </a>
                        </div>
                        <div class="absolute bottom-4 left-4 z-[400] px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-nordic-border text-[11px] text-nordic-muted shadow-sm flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-nordic-accent1 animate-pulse"></span>
                            <span>${badgeText}</span>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    function initTripMap(activeKey) {
        const container = document.getElementById('interactive-map');
        if (!container || typeof L === 'undefined') return;

        if (leafletMap) {
            try {
                leafletMap.remove();
            } catch (e) {
                console.warn('Map cleanup:', e);
            }
            leafletMap = null;
        }

        leafletMap = L.map(container, {
            zoomControl: false,
            attributionControl: true,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

        // Google Maps Standard Road Tiles with Traditional Chinese language (繁體中文圖資)
        const googleRoads = L.tileLayer('https://mt1.google.com/vt/lyrs=m&hl=zh-TW&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google Maps (繁體中文)',
        });
        googleRoads.addTo(leafletMap);

        mapLayers.routeLayer = L.featureGroup().addTo(leafletMap);
        mapLayers.markersLayer = L.featureGroup().addTo(leafletMap);

        if (activeKey && currentMapEntries[activeKey]) {
            renderRouteOnMap(activeKey);
        }
    }

    function renderRouteOnMap(key) {
        if (!leafletMap || !currentMapEntries[key]) return;
        const entry = currentMapEntries[key];
        const hex = colorHex[entry.color] || '#C68B7C';

        mapLayers.routeLayer.clearLayers();
        mapLayers.markersLayer.clearLayers();

        const latlngs = [];
        const stops = entry.stops || [];
        const isKorea = currentTrip?.region === 'korea' || currentTrip?.mapProvider === 'naver';

        stops.forEach((stop, index) => {
            const stopName = typeof stop === 'object' ? stop.name : stop;
            const coords = resolveCoords(stop);
            if (!coords) return;

            latlngs.push(coords);

            const pinIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="route-pin" style="background-color: ${hex};">${index + 1}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14],
            });

            const marker = L.marker(coords, { icon: pinIcon });
            const krName = AtlasKoreaNames[stopName] || '';
            const searchUrl = isKorea
                ? naverDirections([stopName], 'car')
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stopName)}`;
            const providerName = isKorea ? 'Naver Map' : 'Google Maps';

            const popupHtml = `
                <div class="p-2 min-w-[170px]">
                    <div class="text-[10px] tracking-wider text-nordic-muted uppercase">第 ${index + 1} 站</div>
                    <div class="font-serif font-medium text-sm text-nordic-text mt-0.5">${esc(stopName)}</div>
                    ${krName ? `<div class="text-[11px] text-nordic-muted mt-0.5 font-sans">${esc(krName)}</div>` : ''}
                    <a href="${esc(searchUrl)}" target="_blank" rel="noopener noreferrer"
                       class="mt-2 text-xs text-nordic-accent1 font-medium hover:underline inline-flex items-center gap-1">
                        在 ${providerName} 開啟導航 <i class="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                    </a>
                </div>
            `;
            marker.bindPopup(popupHtml);
            mapLayers.markersLayer.addLayer(marker);
        });

        if (latlngs.length >= 2) {
            L.polyline(latlngs, {
                color: '#ffffff',
                weight: 8,
                opacity: 0.75,
                smoothFactor: 1,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(mapLayers.routeLayer);

            L.polyline(latlngs, {
                color: hex,
                weight: 4.5,
                opacity: 0.95,
                smoothFactor: 1,
                lineCap: 'round',
                lineJoin: 'round',
            }).addTo(mapLayers.routeLayer);
        }

        if (latlngs.length > 0) {
            const bounds = L.latLngBounds(latlngs);
            leafletMap.fitBounds(bounds, {
                padding: [45, 45],
                maxZoom: 15,
                animate: true,
                duration: 0.8,
            });
        }

        const btnOpenGmaps = document.getElementById('btn-open-gmaps');
        if (btnOpenGmaps) {
            const navUrl = isKorea
                ? (entry.naverUrl || naverDirections(entry.stops, 'car'))
                : (entry.navUrl || maps.nav(entry.stops.map((s) => (typeof s === 'object' ? s.name : s))));
            btnOpenGmaps.href = navUrl;
        }

        setTimeout(() => leafletMap?.invalidateSize(), 150);
    }

    function changeMap(key) {
        const entry = currentMapEntries[key];
        if (!entry) return;
        document.querySelectorAll('.map-card').forEach((el) => el.classList.toggle('is-active', el.dataset.map === key));

        const isEmbedMode = (currentTrip?.mapMode === 'google-embed') || (currentTrip?.region === 'taiwan' && currentTrip?.mapMode !== 'interactive');
        const isKorea = currentTrip?.region === 'korea' || currentTrip?.mapProvider === 'naver';
        const navUrl = isKorea
            ? (entry.naverUrl || naverDirections(entry.stops, 'car'))
            : (entry.navUrl || maps.nav(entry.stops));
        const embedUrl = entry.embedUrl || maps.embed(entry.stops);

        const btnOpenGmaps = document.getElementById('btn-open-gmaps');
        if (btnOpenGmaps) {
            btnOpenGmaps.href = navUrl;
        }

        if (isEmbedMode) {
            const frame = document.getElementById('gmaps-preview-frame');
            if (frame && frame.src !== embedUrl) {
                frame.src = embedUrl;
            }
        } else {
            renderRouteOnMap(key);
        }
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
