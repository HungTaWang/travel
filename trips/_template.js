/**
 * ============================================================
 *  行程範本 — 複製本檔案即可新增一段旅程
 * ============================================================
 *  步驟：
 *   1. 複製到 trips/<地區>/<行程代號>.js，例如 trips/japan/kyoto-autumn-5d.js
 *   2. 修改下方內容（id 不可重複，建議用英文小寫 + 連字號）
 *   3. 到 assets/js/catalog.js 的 tripFiles 加入檔案路徑
 *   4. 如果是新的國家/地區，也在 catalog.js 的 regions 加一筆
 *
 *  小提醒：
 *   - 標示「可用 HTML」的欄位可放 <br>、<strong> 等標籤
 *   - color 可用：'accent1'（鼠尾草綠）、'accent2'（霧藍）、'accent3'（奶茶色）
 *   - icon 使用 Font Awesome 6 免費圖示名稱，例如 'fa-train'、'fa-utensils'
 *     https://fontawesome.com/search?o=r&m=free
 *   - 不需要的區塊（route / curated / mapOverview / ai）整段刪除即可，頁面會自動隱藏
 * ============================================================
 */
TravelAtlas.registerTrip({
    id: 'example-trip',            // 網址會變成 #/trip/example-trip
    region: 'japan',               // 對應 catalog.js 的 regions[].id
    status: 'planning',            // 'published' 已完成 | 'planning' 規劃中（卡片會顯示標籤）

    title: '京都五日秋楓散策',       // 卡片標題
    pageTitle: '京都五日｜秋楓散策', // 瀏覽器分頁標題（可省略）
    brand: '京都散策',              // 行程頁導覽列名稱（可省略）
    area: '京都・奈良',
    duration: '5 天 4 夜',
    transport: 'JR・地鐵・巴士',
    tags: ['賞楓', '寺院', '甜點'],
    summary: '一句話介紹這段旅程，會顯示在首頁卡片上。',
    cover: 'assets/images/region-japan.jpg', // 封面圖（網址或本地路徑）

    hero: {
        tagline: 'Autumn in Kyoto',
        title: '京都五日<br>秋楓散策',         // 可用 HTML
        description: '行程頁大標下方的介紹文字。', // 可用 HTML
    },

    route: {
        title: '移動軌跡',
        subtitle: '副標題',
        stops: [
            { name: '關西機場', label: '抵達', color: 'accent2' },
            { name: '京都市區', label: 'Day 1', icon: 'fa-torii-gate', note: '寺院巡禮', color: 'accent1' },
        ],
    },

    days: [
        {
            id: 'day1',
            tab: '初見古都',               // 分頁按鈕文字（前面會自動加 Day N.）
            title: '當天主題標題',
            path: 'A ➔ B ➔ C',
            color: 'accent1',
            items: [
                {
                    time: '09:00 - 11:00',
                    title: '景點名稱',
                    desc: '景點描述（可用 HTML）。',
                    list: [                                   // 可省略
                        { label: '推薦', name: '店家名稱', url: 'https://maps.google.com/?q=...', note: '：補充說明。' },
                        '也可以直接寫一段文字（可用 HTML）',
                    ],
                    rainPlan: '雨天備案（可省略）',
                    stay: '住宿資訊（可省略）',
                },
            ],
            map: {                                            // 可省略，會出現在導航地圖區
                title: 'Day 1 古都巡禮',
                icon: 'fa-map-location-dot',
                desc: 'A ➔ B ➔ C',
                stops: ['京都車站', '清水寺', '八坂神社'],      // 依序填入 Google Maps 可搜尋的地點名稱
            },
        },
    ],

    curated: {
        title: '嚴選清單',
        subtitle: '住宿與美食推薦',
        groups: [
            {
                title: '住宿推薦',
                icon: 'fa-bed',
                color: 'accent1',
                items: [
                    { name: '旅館名稱', url: 'https://maps.google.com/?q=...', desc: '一句話介紹。' },
                ],
            },
        ],
    },

    mapOverview: {
        title: '總路線圖',
        icon: 'fa-map',
        desc: '全程路線簡述',
        stops: ['關西機場', '京都車站', '奈良公園'],
    },

    ai: {
        name: '京都散策嚮導 AI',
        greeting: '哈囉！有任何關於這趟京都行程的問題都可以問我喔！', // 可用 HTML
        suggestions: ['紅葉最佳觀賞時間？', '需要買哪種交通票券？'],
        context: '目前使用者正在瀏覽「京都五日秋楓散策」。行程重點：……請用繁體中文回答。',
    },
});
