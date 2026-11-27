# Phase 1 ─ 觀察與設計

題目 B 要求分析真實 momo 商品卡、展示全部與單一商品卡、提供可持久化的編輯介面，以及交付可獨立使用的 HTML 範例。此設計紀錄整理正式 React 實作前的人機討論，以及實作後確認的技術邊界。原型歷史與後續修正保留在 Git。

## 2026-11-27 截圖觀察

| 官網情境 | 可辨識結構 | 實作決策 |
| --- | --- | --- |
| 圖 2 首頁精選好物榜 | 左上角名次、方形商品圖、活動橫幅、促銷文案、現價與刪除線原價、部分商品有評價與總銷量 | 以 `ranking` 提供名次和總銷量，共用價格與評價的渲染 |
| 圖 3 首頁限時搶購 | 活動橫幅、限搶價、獨立一行的原價、剩餘組數、購買 CTA。倒數出現在活動區標頭 | 以 `flash-sale` 提供庫存與限搶價提示。CTA 示範 host 事件 |
| 圖 4 搜尋方格 | 直式商品圖、廣告字樣、促銷、價格、評價、銷量、配送與活動標籤。圖片切換與 hover 操作見官網 | 以 `search` 提供搜尋業務欄位，直式由 `grid` 呈現 |
| 圖 5 搜尋橫列 | 同樣的商品資料改為水平排列，右側操作常駐 | 與搜尋方格共用商品 ID、設定與卡片元件。由 `list` 改變編排並呈現示意操作 |

圖 1 的首頁活動入口，以及圖 6–7 的商品詳情、規格和放大圖屬於其他介面。本次以截圖可核對的視覺規律為準。工作台採操作者提供的左導覽、中間預覽、右側設定結構。玫紅價格、紅色促銷文案和橫幅、粉色選取背景，以及中性的白灰底沿用公開畫面的色彩層級。

## 技術與資料流

```text
Catalog + Registry → Showroom React state → ProductCard → 共用結構 + Variant presentation
                           ↑  ↓
                    v1 localStorage

Hosted HTML → mountMerchantCard(container, props) → 同一個 ProductCard
```

- 選 React、TypeScript、Vite 與 CSS Modules。React 統一總覽、編輯器與預覽資料流。TypeScript 的 discriminated union 表達商品的業務差異。CSS Modules 讓宿主可載入卡片樣式。代價是嵌入 bundle 隨附 React runtime。
- `kind` 描述業務情境，`layout` 描述排列。typed preset registry 只列可用路由和版型。用多款商品驗證共用邊界後，仍可保持靜態註冊。
- 基礎資料是固定快照。有效的名稱、售價與促銷編輯存為 overrides。顯示開關獨立於商品資料。React state 是當前分頁的有效設定。未完成輸入由編輯器暫存，預覽保留最後有效值。
- 依商品 ID 儲存 `{ version, settings, overrides }`。讀取時驗證版本及欄位，舊版缺欄位會補預設，無效 JSON 或未知版本會回退預設。讀取本身保留原值，下一次明確編輯會寫入目前格式。失敗時保留分頁內狀態並提供可見提示。跨分頁同步留待後續。
- `sample.html` 以 JS module 和 CSS 載入同一 React 元件。宿主傳入資料快照，因此使用情境可重現。實際部署用靜態檔，沒有伺服器端狀態。

## 優先順序與演進

P0 先讓搜尋方格走完導覽、單卡調整、持久化、正式建置嵌入與提交。P1 用同商品的橫列檢查跨 layout 一致性，再用排行及限搶驗證業務欄位擴充。多出來的 UI 保留為商品卡範圍內的預覽寬度控制與示意 CTA。

輪播、hover 操作、登入、真實購物車、API、倒數、商品詳情與動態 plugin loader 放在交付範圍外。當新卡片需要新增業務資料時，先擴充 `Product` union 和 variant adapter。等到有外部資料供應商時，再加入 runtime product schema。等到有多分頁編輯需求時，再定義事件同步、衝突規則和舊資料遷移。
