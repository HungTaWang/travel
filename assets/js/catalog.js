/**
 * 旅圖集 Travel Atlas — 全站目錄設定
 * ------------------------------------------------------------
 * 1. regions   ：地區分類（首頁會依此分組顯示）。要新增國家/地區，在這裡加一筆即可。
 * 2. tripFiles ：要載入的行程檔案清單（依序載入、依序顯示）。
 *                新增行程時：複製 trips/_template.js → 填寫內容 → 把路徑加到這裡。
 */
window.TravelAtlas = {
    site: {
        name: '旅圖集',
        en: 'Travel Atlas',
        tagline: '我的旅行規劃總覽',
        description: '把每一段旅程收進同一本旅圖集：台灣山海、日本四季、韓國古今，一頁掌握所有行程。',
    },

    regions: [
        {
            id: 'taiwan',
            name: '台灣',
            en: 'Taiwan',
            icon: 'fa-mountain-sun',
            blurb: '山海鐵道與島嶼人情',
            cover: 'assets/images/taiwan-east-coast.jpg',
        },
        {
            id: 'japan',
            name: '日本',
            en: 'Japan',
            icon: 'fa-torii-gate',
            blurb: '四季更迭的細膩風景',
            cover: 'assets/images/region-japan.jpg',
        },
        {
            id: 'korea',
            name: '韓國',
            en: 'Korea',
            icon: 'fa-yin-yang',
            blurb: '海港慢調、膠囊列車與溫補美饌',
            cover: 'assets/images/busan-skycapsule.jpg',
        },
    ],

    tripFiles: [
        'trips/taiwan/yilan-hualien-3d2n.js',
        'trips/korea/busan-family-5d4n.js',
        // 'trips/taiwan/tainan-2d1n.js',
        // 'trips/japan/kyoto-autumn-5d.js',
        // 'trips/korea/seoul-4d3n.js',
    ],

    /* ---------- 以下為系統使用，一般不需修改 ---------- */
    trips: {},

    registerTrip(trip) {
        if (!trip || !trip.id) {
            console.warn('[TravelAtlas] 行程缺少 id，已略過：', trip);
            return;
        }
        this.trips[trip.id] = trip;
    },

    listTrips() {
        return Object.values(this.trips);
    },

    getRegion(id) {
        return this.regions.find((r) => r.id === id);
    },
};
