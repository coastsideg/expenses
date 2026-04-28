/* =========================================================
   ICACPLS shared site logic
   ========================================================= */

const fmt = {
  money: (n) => "$" + (Number(n) || 0).toLocaleString("en-AU", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }),
  moneyShort: (n) => {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(2) + "m";
    if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "k";
    return "$" + n.toFixed(0);
  },
  num: (n) => (Number(n) || 0).toLocaleString("en-AU"),
};

function chip(party) {
  const cls = (party || "ind").toLowerCase();
  return `<span class="chip ${cls}">${party || "IND"}</span>`;
}

async function loadJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error("Failed to load " + path);
  return r.json();
}

/* Sortable + paginated table ----------------------------------
   container: DOM element
   columns: [{key, label, render?, type?: 'num'|'text', class?}]
   rows: array of objects
   pageSize: rows per page
*/
function renderTable(container, columns, rows, opts = {}) {
  const pageSize = opts.pageSize || 50;
  let state = {
    rows: rows.slice(),
    sortKey: opts.sortKey || null,
    sortDir: opts.sortDir || "desc",
    page: 0,
  };

  function sort() {
    if (!state.sortKey) return;
    const col = columns.find((c) => c.key === state.sortKey);
    const isNum = col && col.type === "num";
    const dir = state.sortDir === "asc" ? 1 : -1;
    state.rows.sort((a, b) => {
      let av = a[state.sortKey];
      let bv = b[state.sortKey];
      if (isNum) { av = Number(av) || 0; bv = Number(bv) || 0; }
      else { av = (av || "").toString().toLowerCase(); bv = (bv || "").toString().toLowerCase(); }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }

  function render() {
    sort();
    const total = state.rows.length;
    const start = state.page * pageSize;
    const visible = state.rows.slice(start, start + pageSize);

    const thead = columns.map((c) => {
      let cls = "";
      if (c.key === state.sortKey) cls = state.sortDir === "asc" ? "sorted-asc" : "sorted-desc";
      return `<th data-key="${c.key}" class="${cls} ${c.class || ""}">${c.label}</th>`;
    }).join("");

    const tbody = visible.map((row) => {
      return "<tr>" + columns.map((c) => {
        const val = c.render ? c.render(row) : row[c.key];
        const cls = c.type === "num" ? "num" : (c.class || "");
        return `<td class="${cls}">${val == null ? "" : val}</td>`;
      }).join("") + "</tr>";
    }).join("");

    const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
    const pageInfo = total === 0
      ? "No matching records"
      : `${start + 1}–${Math.min(start + pageSize, total)} of ${fmt.num(total)}`;

    container.innerHTML = `
      <table class="data">
        <thead><tr>${thead}</tr></thead>
        <tbody>${tbody || `<tr><td colspan="${columns.length}" class="muted" style="padding:30px;text-align:center">No matching records</td></tr>`}</tbody>
      </table>
      <div class="pagination">
        <span>${pageInfo}</span>
        <span>
          <button data-act="first" ${state.page === 0 ? "disabled" : ""}>« First</button>
          <button data-act="prev"  ${state.page === 0 ? "disabled" : ""}>‹ Prev</button>
          <button data-act="next"  ${state.page >= lastPage ? "disabled" : ""}>Next ›</button>
          <button data-act="last"  ${state.page >= lastPage ? "disabled" : ""}>Last »</button>
        </span>
      </div>`;

    container.querySelectorAll("th").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = "desc";
        }
        state.page = 0;
        render();
      });
    });

    container.querySelectorAll(".pagination button").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.act === "first") state.page = 0;
        if (b.dataset.act === "prev")  state.page = Math.max(0, state.page - 1);
        if (b.dataset.act === "next")  state.page = Math.min(lastPage, state.page + 1);
        if (b.dataset.act === "last")  state.page = lastPage;
        render();
      });
    });
  }

  render();

  return {
    setRows(newRows) { state.rows = newRows.slice(); state.page = 0; render(); },
  };
}

/* Bar chart -- horizontal CSS bars --------------------------- */
function renderBars(container, items, opts = {}) {
  const max = Math.max(...items.map((i) => i.value || 0), 1);
  container.innerHTML = items.map((i) => {
    const pct = ((i.value / max) * 100).toFixed(1);
    return `
      <div class="bar-row">
        <div class="label">${i.labelHtml || i.label}</div>
        <div class="track"><div class="fill" style="width:${pct}%; background:${i.color || "var(--accent)"}"></div></div>
        <div class="num">${i.formatted || fmt.money(i.value)}</div>
      </div>`;
  }).join("");
}

/* Get URL query parameter */
function qparam(name) {
  return new URLSearchParams(location.search).get(name);
}
