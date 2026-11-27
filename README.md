# Merchant Card Showroom

以 2026-11-27 的 momo 官網截圖為依據，整理搜尋方格、搜尋橫列、精選排行與限時搶購四種卡片呈現。Showroom 使用玫紅主色與粉色選取背景。卡片保留各情境的價格、促銷、名次、庫存與配送層級。

## 執行

需要 Node.js 18.18 以上與 npm。

```sh
npm ci
npm test
npm run build
npm start
```

- [所有卡片](http://127.0.0.1:4173/)
- [單卡編輯器](http://127.0.0.1:4173/?card=search-toothpaste)
- [搜尋橫列](http://127.0.0.1:4173/?card=search-toothpaste&layout=list)
- [獨立 HTML 嵌入](http://127.0.0.1:4173/sample.html)

用 `npm run dev` 開發 Showroom。嵌入頁使用固定檔名的正式 bundle，請從 `npm run build` 的產物驗證。

## 操作與架構

1. 在總覽看四種呈現，或用左側導覽開啟一張代表卡。
2. 修改品名、售價、促銷文案或顯示選項。所有有效變更即時預覽，並按商品 ID 自動儲存。搜尋方格與橫列沿用同一筆編輯。
3. 重整或返回總覽檢查一致性。編輯器的「重設設定」會恢復該商品的預設值。
4. 開啟 `sample.html` 驗證獨立嵌入。它載入相同 React 卡片的 JS 與 CSS，並由 HTML 宿主傳入設定。

| 檔案 | 責任 |
| --- | --- |
| `src/model.ts`、`src/catalog.ts`、`src/registry.ts` | 商品型別、示例和可導覽的卡片預設 |
| `src/ProductCard.tsx`、`src/card-variants.ts` | 共用商品卡與情境專屬資訊 |
| `src/main.tsx`、`src/settings.ts` | Showroom 路由、編輯狀態、儲存驗證 |
| `src/embed.tsx`、`public/sample.html` | 獨立 HTML 入口與公開嵌入 API |

卡片中的商品照片為原創示意。部分價格、活動文案和庫存數字取自截圖快照。橫列的追蹤與購物車、限搶的購買按鈕會觸發示意事件。

## 部署與提交

`vercel.json` 指定 `npm ci`、`npm run build` 與 `dist`。正式產物同時包含 Showroom、`sample.html` 與固定名稱的獨立嵌入檔案。

- [Phase 1 設計、官網觀察與架構取捨](docs/design.md)
- [Phase 2 驗收與 AI 共作紀錄](docs/implementation.md)

用 `git log --format=fuller` 查閱原始實作時間與共作紀錄。從提交 ZIP 解壓後，在含有 `.git` 的專案目錄執行上述指令。
