# 旅圖集 Travel Atlas

個人旅行規劃網站。首頁依地區（台灣／日本／韓國…）整理所有旅程，點進去即是完整行程頁（路線、每日行程、嚴選清單、Google Maps 導航、AI 嚮導）。

純靜態網站，不需要建置，直接開啟 `index.html` 或部署到 GitHub Pages 即可。

## 專案結構

```
index.html                 頁面外殼（導覽列、頁尾、AI 對話框）
assets/
  css/style.css            共用樣式
  js/catalog.js            ★ 地區清單 & 行程檔案清單（新增行程時修改這裡）
  js/app.js                路由與頁面渲染（一般不需修改）
  js/chat.js               AI 旅遊顧問
  images/                  本地圖片
trips/
  _template.js             ★ 行程範本（複製這份來新增）
  taiwan/yilan-hualien-3d2n.js
  korea/busan-family-5d4n.js
```

## 新增一段旅程

1. 複製 `trips/_template.js` → `trips/<地區>/<行程代號>.js`（例：`trips/japan/kyoto-autumn-5d.js`）
2. 填入內容，`id` 需唯一、`region` 對應 `catalog.js` 中的地區 id
3. 在 `assets/js/catalog.js` 的 `tripFiles` 加上檔案路徑
4. 重新整理頁面，首頁就會出現新卡片；行程網址為 `#/trip/<id>`

> 尚未完成的行程可設 `status: 'planning'`，卡片會顯示「規劃中」標籤。

## 新增國家／地區

在 `assets/js/catalog.js` 的 `regions` 新增一筆：

```js
{ id: 'thailand', name: '泰國', en: 'Thailand', icon: 'fa-umbrella-beach', blurb: '熱帶海島與夜市', cover: 'assets/images/region-thailand.jpg' }
```

沒有行程的地區會自動顯示「規劃中」的預留區塊。

## 網址

| 網址 | 頁面 |
| --- | --- |
| `index.html#/` | 首頁（全部地區） |
| `index.html#/region/korea` | 首頁，只看韓國 |
| `index.html#/trip/busan-family-5d4n` | 釜山五天四夜海港漫旅 |
| `index.html#/trip/yilan-hualien-3d2n` | 宜花三天兩夜鐵道漫遊 |
