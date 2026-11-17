import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Thanh phân trang dùng chung cho các API list có `pagination`
 * props:
 *  - pagination: { page, limit, totalItems, totalPages }
 *  - onPageChange(page)
 *  - onLimitChange(limit)   (tuỳ chọn – hiện ô chọn số dòng/trang)
 *  - limitOptions           (mặc định [5, 10, 20, 50])
 *  - itemLabel              (vd "lớp học", "bài nộp")
 *  - compact                (giao diện gọn cho các section nhỏ)
 */
export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  itemLabel = "mục",
  compact = false,
}) {
  if (!pagination) return null;
  const { page = 1, limit = 10, totalItems = 0 } = pagination;
  const totalPages = Math.max(1, pagination.totalPages || 0);
  if (totalItems === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);
  const go = (p) => p >= 1 && p <= totalPages && p !== page && onPageChange(p);

  return (
    <div style={{ ...styles.bar, ...(compact ? styles.barCompact : {}) }}>
      <style>{css}</style>
      <div style={styles.info}>
        <span>
          <strong style={styles.strong}>{from}–{to}</strong> / {totalItems} {itemLabel}
        </span>
        {onLimitChange && (
          <label style={styles.limitLabel}>
            Hiển thị
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="pg-select"
              style={styles.select}
            >
              {[...new Set([...limitOptions, limit])].sort((a, b) => a - b).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            / trang
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div style={styles.pages}>
          {!compact && (
            <PageBtn onClick={() => go(1)} disabled={page === 1} title="Trang đầu"><ChevronsLeft size={15} /></PageBtn>
          )}
          <PageBtn onClick={() => go(page - 1)} disabled={page === 1} title="Trang trước"><ChevronLeft size={15} /></PageBtn>
          {pageList(page, totalPages, compact ? 1 : 2).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} style={styles.gap}>…</span>
            ) : (
              <PageBtn key={p} onClick={() => go(p)} active={p === page}>{p}</PageBtn>
            )
          )}
          <PageBtn onClick={() => go(page + 1)} disabled={page === totalPages} title="Trang sau"><ChevronRight size={15} /></PageBtn>
          {!compact && (
            <PageBtn onClick={() => go(totalPages)} disabled={page === totalPages} title="Trang cuối"><ChevronsRight size={15} /></PageBtn>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ô chọn kiểu sắp xếp. options: [{ value: "created_at:DESC", label: "Mới nhất" }, ...]
 * value / onChange dùng chuỗi "sortBy:sortOrder"
 */
export function SortSelect({ value, onChange, options, icon }) {
  return (
    <label style={styles.sortWrap}>
      {icon}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="pg-select" style={styles.sortSelect}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function PageBtn({ children, active, ...rest }) {
  return (
    <button
      type="button"
      className={`pg-btn ${active ? "pg-btn-active" : ""}`}
      style={{ ...styles.btn, ...(active ? styles.btnActive : {}) }}
      {...rest}
    >
      {children}
    </button>
  );
}

// [1, …, 4, 5, 6, …, 10]
function pageList(page, total, spread) {
  const pages = [];
  const start = Math.max(2, page - spread);
  const end = Math.min(total - 1, page + spread);
  pages.push(1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  if (total > 1) pages.push(total);
  return pages;
}

const css = `
  .pg-btn { transition: background-color .15s, border-color .15s, color .15s; }
  .pg-btn:hover:not(:disabled):not(.pg-btn-active) { background-color: #e2e8f0 !important; color: #0f172a !important; }
  .pg-btn:disabled { opacity: .35; cursor: not-allowed !important; }
  .pg-select:focus { border-color: #3b82f6 !important; outline: none; }
`;

const styles = {
  bar: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20, fontSize: 12, color: "#64748b" },
  barCompact: { marginTop: 4, paddingTop: 12, borderTop: "1px solid #e2e8f0" },
  info: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 },
  strong: { color: "#0f172a", fontWeight: 600 },
  limitLabel: { display: "inline-flex", alignItems: "center", gap: 6 },
  select: { padding: "4px 6px", borderRadius: 6, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", fontSize: 12, cursor: "pointer", colorScheme: "light" },
  pages: { display: "flex", alignItems: "center", gap: 4 },
  btn: { minWidth: 30, height: 30, padding: "0 8px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer" },
  btnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#fff", fontWeight: 600, cursor: "default" },
  gap: { padding: "0 4px", color: "#94a3b8" },
  sortWrap: { display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 4px 0 10px", borderRadius: 10, border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#94a3b8" },
  sortSelect: { height: "100%", border: "none", backgroundColor: "transparent", color: "#0f172a", fontSize: 13, cursor: "pointer", colorScheme: "light", outline: "none" },
};

