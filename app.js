/* ============================================================
 * 双色球选号助手
 * 规则：红球 1-33 选 6，蓝球 1-16 选 1
 * 纯前端本地运行，不联网、不购票
 * ============================================================ */

const RED_MIN = 1, RED_MAX = 33, RED_COUNT = 6;
const BLUE_MIN = 1, BLUE_MAX = 16;

let redPicked = [];   // 已选红球（升序）
let bluePicked = null;

/* ---------- 基础工具 ---------- */

function pad(n) { return String(n).padStart(2, '0'); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uniqueSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a - b);
}

/* ---------- 参数计算（针对 6 个红球） ---------- */

/** 奇偶比：奇数:偶数 */
function oddEvenRatio(reds) {
  const odd = reds.filter(n => n % 2 === 1).length;
  return { odd, even: reds.length - odd, text: `${odd}:${reds.length - odd}` };
}

/** 大小比：17 及以上为大，16 及以下为小 */
function bigSmallRatio(reds) {
  const big = reds.filter(n => n >= 17).length;
  return { big, small: reds.length - big, text: `${big}:${reds.length - big}` };
}

/** 三区分布：1-11 / 12-22 / 23-33 */
function zoneSplit(reds) {
  const z = [0, 0, 0];
  reds.forEach(n => {
    if (n <= 11) z[0]++;
    else if (n <= 22) z[1]++;
    else z[2]++;
  });
  return { zones: z, text: z.join(':') };
}

/** 和值 */
function sumValue(reds) {
  return reds.reduce((a, b) => a + b, 0);
}

/** 跨度 = 最大 - 最小 */
function spanValue(reds) {
  return Math.max(...reds) - Math.min(...reds);
}

/** 连号对数：相邻号码相差 1 的对数 */
function consecutivePairs(reds) {
  let pairs = 0;
  for (let i = 1; i < reds.length; i++) {
    if (reds[i] - reds[i - 1] === 1) pairs++;
  }
  return pairs;
}

/** 重号（与上一期重复个数）：传入上一期红球，返回交集个数 */
function repeatCount(reds, prevReds) {
  if (!prevReds || prevReds.length === 0) return null;
  return reds.filter(n => prevReds.includes(n)).length;
}

/**
 * AC 值：6 个号码两两差值去重后的个数 - (6-1)
 * 公式：AC = 不同差值个数 - (r - 1)，r = 6
 * 范围通常 0 – 10，数值越大号码越分散。
 */
function acValue(reds) {
  const diffs = new Set();
  for (let i = 0; i < reds.length; i++) {
    for (let j = i + 1; j < reds.length; j++) {
      diffs.add(Math.abs(reds[i] - reds[j]));
    }
  }
  return diffs.size - (reds.length - 1);
}

/** 全部参数打包 */
function analyze(reds, blue, prevReds) {
  if (reds.length !== RED_COUNT) return null;
  const oe = oddEvenRatio(reds);
  const bs = bigSmallRatio(reds);
  const z = zoneSplit(reds);
  const rep = repeatCount(reds, prevReds);
  return {
    reds: [...reds],
    blue,
    oddEven: oe.text,
    odd: oe.odd, even: oe.even,
    bigSmall: bs.text,
    big: bs.big, small: bs.small,
    zones: z.zones,
    zoneText: z.text,
    sum: sumValue(reds),
    span: spanValue(reds),
    consec: consecutivePairs(reds),
    repeat: rep,
    ac: acValue(reds),
  };
}

/* ---------- 随机选号 ---------- */

function randomRed() {
  const pool = shuffle(Array.from({ length: RED_MAX }, (_, i) => i + 1));
  return pool.slice(0, RED_COUNT).sort((a, b) => a - b);
}
function randomBlue() {
  return Math.floor(Math.random() * BLUE_MAX) + 1;
}

/* ---------- 渲染：选号网格 ---------- */

function renderGrid() {
  const redGrid = document.getElementById('redGrid');
  const blueGrid = document.getElementById('blueGrid');
  redGrid.innerHTML = '';
  blueGrid.innerHTML = '';

  for (let n = RED_MIN; n <= RED_MAX; n++) {
    const b = document.createElement('div');
    b.className = 'ball' + (redPicked.includes(n) ? ' selected' : '');
    b.textContent = pad(n);
    b.onclick = () => toggleRed(n);
    redGrid.appendChild(b);
  }
  for (let n = BLUE_MIN; n <= BLUE_MAX; n++) {
    const b = document.createElement('div');
    b.className = 'ball' + (bluePicked === n ? ' selected' : '');
    b.textContent = pad(n);
    b.onclick = () => { bluePicked = n; renderAll(); };
    blueGrid.appendChild(b);
  }
}

function toggleRed(n) {
  if (redPicked.includes(n)) {
    redPicked = redPicked.filter(x => x !== n);
  } else {
    if (redPicked.length >= RED_COUNT) {
      alert(`红球最多选 ${RED_COUNT} 个`);
      return;
    }
    redPicked.push(n);
  }
  redPicked.sort((a, b) => a - b);
  renderAll();
}

function renderCurrentPick() {
  const box = document.getElementById('currentPick');
  if (redPicked.length === 0 && bluePicked == null) {
    box.innerHTML = '<span style="color:#aaa;font-size:13px">点击上面的号码球进行选择</span>';
    return;
  }
  let html = '';
  redPicked.forEach(n => html += `<span class="ball-sm r">${pad(n)}</span>`);
  if (bluePicked != null) {
    html += '<span class="sep">|</span>';
    html += `<span class="ball-sm b">${pad(bluePicked)}</span>`;
  }
  box.innerHTML = html;
}

function renderStats() {
  const panel = document.getElementById('statsPanel');
  const prev = historyData.length ? historyData[0].reds : null;
  const a = analyze(redPicked, bluePicked, prev);
  if (!a) {
    panel.className = 'stats empty';
    panel.textContent = `请选满 ${RED_COUNT} 个红球（当前 ${redPicked.length}/6）${bluePicked == null ? '，再选 1 个蓝球' : ''}`;
    return;
  }
  panel.className = 'stats';
  panel.innerHTML = `
    <div class="stats-grid">
      <div class="stat-item"><div class="k">奇偶比</div><div class="v">${a.oddEven}（奇 ${a.odd} / 偶 ${a.even}）</div></div>
      <div class="stat-item"><div class="k">大小比（≥17 为大）</div><div class="v">${a.bigSmall}（大 ${a.big} / 小 ${a.small}）</div></div>
      <div class="stat-item"><div class="k">三区比 1-11 / 12-22 / 23-33</div><div class="v">${a.zoneText}</div></div>
      <div class="stat-item"><div class="k">和值</div><div class="v">${a.sum}</div></div>
      <div class="stat-item"><div class="k">跨度</div><div class="v">${a.span}</div></div>
      <div class="stat-item"><div class="k">AC 值（分散度）</div><div class="v">${a.ac}</div></div>
      <div class="stat-item"><div class="k">连号对数</div><div class="v">${a.consec}</div></div>
      <div class="stat-item">
        <div class="k">与上期重号个数</div>
        <div class="v">${a.repeat == null ? '无历史数据' : a.repeat + ' 个'}</div>
      </div>
    </div>`;
}

function renderAll() {
  renderGrid();
  renderCurrentPick();
  renderStats();
}

/* ---------- 条件筛选机选 ---------- */

function parseRange(str) {
  if (!str) return null;
  const [lo, hi] = str.split('-').map(Number);
  return [lo, hi];
}

function ticketMatch(a) {
  const odd = document.getElementById('fOdd').value;
  const big = document.getElementById('fBig').value;
  const sumR = parseRange(document.getElementById('fSum').value);
  const spanR = parseRange(document.getElementById('fSpan').value);
  const consec = document.getElementById('fConsec').value;
  const zoneStr = document.getElementById('fZone').value.trim();
  const acMin = document.getElementById('fAC').value;

  if (odd !== '' && a.odd !== Number(odd)) return false;
  if (big !== '' && a.big !== Number(big)) return false;
  if (sumR && (a.sum < sumR[0] || a.sum > sumR[1])) return false;
  if (spanR && (a.span < spanR[0] || a.span > spanR[1])) return false;
  if (consec !== '' && a.consec !== Number(consec)) return false;
  if (zoneStr) {
    const z = zoneStr.split(':').map(Number);
    if (z.length === 3 && !z.some(isNaN)) {
      if (!z.every((v, i) => a.zones[i] === v)) return false;
    }
  }
  if (acMin !== '' && a.ac < Number(acMin)) return false;
  return true;
}

function generateFiltered() {
  const count = Number(document.getElementById('fCount').value);
  const list = [];
  const maxTries = count * 500;
  let tries = 0;
  while (list.length < count && tries < maxTries) {
    tries++;
    const reds = randomRed();
    const blue = randomBlue();
    const a = analyze(reds, blue);
    if (ticketMatch(a)) list.push(a);
  }

  const box = document.getElementById('resultList');
  if (list.length === 0) {
    box.innerHTML = '<div class="hint" style="padding:10px">当前条件太严格，未生成满足号码，请放宽条件重试。</div>';
    return;
  }
  box.innerHTML = list.map((a, idx) => `
    <div class="ticket">
      ${a.reds.map(n => `<span class="ball-sm r">${pad(n)}</span>`).join('')}
      <span class="ball-sm b">${pad(a.blue)}</span>
      <div class="meta">第 ${idx + 1} 注 ｜ 奇偶 ${a.oddEven} 大小 ${a.bigSmall} 三区 ${a.zoneText} 和值 ${a.sum} 跨度 ${a.span} AC ${a.ac} 连号 ${a.consec}</div>
    </div>`).join('');
}

/* ---------- 历史数据与冷热统计 ---------- */

// 官方公开开奖公告接口（中国福彩网 cwl.gov.cn），仅读取开奖号码，不涉及购票
const CWL_API = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq';
// 浏览器 H5 直连可能被跨域(CORS)拦截：打包成 APK 原生 WebView 时留空即可直连；
// 若在普通浏览器里需要走代理，把代理前缀填到这里（代理会把后面的完整 URL 作为参数转发）。
const CORS_PROXY = '';

// 内置示例历史（仅用于无网络时演示统计逻辑，非真实近期开奖）
const SAMPLE_HISTORY = [
  { code: '2026123', date: '2026-10-27', reds: [4, 5, 20, 21, 26, 30], blue: 12 },
  { code: '2026122', date: '2026-10-25', reds: [1, 2, 4, 17, 19, 30], blue: 9 },
  { code: '2026121', date: '2026-10-22', reds: [2, 7, 20, 24, 26, 30], blue: 2 },
  { code: '2026120', date: '2026-10-20', reds: [6, 11, 15, 22, 28, 31], blue: 8 },
  { code: '2026119', date: '2026-10-18', reds: [3, 9, 14, 19, 25, 33], blue: 6 },
  { code: '2026118', date: '2026-10-15', reds: [5, 10, 16, 21, 27, 30], blue: 14 },
  { code: '2026117', date: '2026-10-13', reds: [1, 8, 13, 18, 24, 29], blue: 3 },
  { code: '2026116', date: '2026-10-11', reds: [7, 12, 17, 23, 26, 32], blue: 11 },
  { code: '2026115', date: '2026-10-08', reds: [2, 9, 14, 20, 22, 31], blue: 5 },
  { code: '2026114', date: '2026-10-06', reds: [4, 10, 15, 19, 28, 33], blue: 7 },
];

let historyData = SAMPLE_HISTORY.map(x => ({ ...x }));

/** 解析官方接口返回的单条记录 */
function parseCwlRow(r) {
  const reds = r.red.split(',').map(Number).sort((a, b) => a - b);
  return {
    code: r.code,
    date: (r.date || '').split('(')[0],
    reds,
    blue: Number(r.blue),
  };
}

/** 在线拉取历史开奖：优先按期数，填了日期区间则按日期 */
async function fetchHistoryOnline() {
  const status = document.getElementById('onlineStatus');
  const btn = document.getElementById('btnOnlineFetch');
  const start = document.getElementById('onlineStart').value;
  const end = document.getElementById('onlineEnd').value;
  const count = document.getElementById('onlineCount').value;

  let url;
  if (start && end) {
    url = `${CWL_API}&dayStart=${start}&dayEnd=${end}`;
  } else {
    url = `${CWL_API}&issueCount=${count}`;
  }
  if (CORS_PROXY) url = CORS_PROXY + encodeURIComponent(url);

  btn.disabled = true;
  status.className = 'online-status loading';
  status.textContent = '正在从福彩官网拉取数据…';

  try {
    const resp = await fetch(url, { headers: { 'Referer': 'https://www.cwl.gov.cn/' } });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data.result || !data.result.length) throw new Error('接口未返回开奖记录');
    historyData = data.result.map(parseCwlRow);
    renderHistoryList();
    renderHistoryStats();
    status.className = 'online-status ok';
    status.textContent = `成功拉取 ${historyData.length} 期，最新一期 ${historyData[0].code}（${historyData[0].date}）`;
  } catch (err) {
    status.className = 'online-status err';
    status.textContent = `在线拉取失败：${err.message}。浏览器跨域限制时，请打包为 APK 原生运行，或使用下方手动粘贴。`;
  } finally {
    btn.disabled = false;
  }
}

/** 历史明细列表（最新在前） */
function renderHistoryList() {
  const box = document.getElementById('historyList');
  if (!historyData.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="hist-block"><h3>开奖明细（近 ${historyData.length} 期，最新在前）</h3>` +
    historyData.map(h => `
      <div class="hist-row">
        <span class="hist-code">${h.code}</span>
        <span class="hist-date">${h.date}</span>
        <span class="hist-balls">
          ${h.reds.map(n => `<span class="ball-sm r">${pad(n)}</span>`).join('')}
          <span class="ball-sm b">${pad(h.blue)}</span>
        </span>
      </div>`).join('') + `</div>`;
}

function renderHistoryStats() {
  const panel = document.getElementById('historyStats');
  if (!historyData.length) { panel.innerHTML = ''; renderHistoryList(); return; }

  const redCount = {}, blueCount = {};
  historyData.forEach(h => {
    h.reds.forEach(n => redCount[n] = (redCount[n] || 0) + 1);
    blueCount[h.blue] = (blueCount[h.blue] || 0) + 1;
  });

  const redArr = Array.from({ length: RED_MAX }, (_, i) => i + 1)
    .map(n => ({ n, c: redCount[n] || 0 }))
    .sort((a, b) => b.c - a.c);
  const blueArr = Array.from({ length: BLUE_MAX }, (_, i) => i + 1)
    .map(n => ({ n, c: blueCount[n] || 0 }))
    .sort((a, b) => b.c - a.c);

  const redHot = new Set(redArr.slice(0, 8).map(x => x.n));
  const redCold = new Set(redArr.slice(-8).map(x => x.n));
  const blueHot = new Set(blueArr.slice(0, 4).map(x => x.n));
  const blueCold = new Set(blueArr.slice(-4).map(x => x.n));

  const redHtml = Array.from({ length: RED_MAX }, (_, i) => i + 1).map(n => {
    let cls = 'hb';
    if (redHot.has(n)) cls += ' hot';
    else if (redCold.has(n)) cls += ' cold';
    return `<span class="${cls}">${pad(n)}<span class="cnt">${redCount[n] || 0}</span></span>`;
  }).join('');

  const blueHtml = Array.from({ length: BLUE_MAX }, (_, i) => i + 1).map(n => {
    let cls = 'hb';
    if (blueHot.has(n)) cls += ' hot';
    else if (blueCold.has(n)) cls += ' cold';
    return `<span class="${cls}">${pad(n)}<span class="cnt">${blueCount[n] || 0}</span></span>`;
  }).join('');

  panel.innerHTML = `
    <div class="hist-block">
      <h3>红球冷热（近 ${historyData.length} 期，红底热号 / 蓝底冷号）</h3>
      <div class="hist-balls">${redHtml}</div>
    </div>
    <div class="hist-block">
      <h3>蓝球冷热</h3>
      <div class="hist-balls">${blueHtml}</div>
    </div>
    <div class="hint" style="margin-top:6px">提示：冷热号只是历史出现频率，不代表未来趋势。</div>
  `;
  renderHistoryList();
  renderStats(); // 重算"与上期重号"
}

function loadPastedHistory() {
  const text = document.getElementById('historyInput').value.trim();
  if (!text) return alert('请先粘贴历史数据');
  const rows = text.split('\n').filter(l => l.trim());
  const parsed = [];
  rows.forEach(line => {
    const nums = line.match(/\d+/g).map(Number);
    if (nums && nums.length >= 7) {
      let arr = nums.filter(n => n <= 33);
      if (arr.length < 7) return;
      const blue = arr.pop();
      const reds = arr.slice(0, 6).sort((a, b) => a - b);
      if (reds.length === 6 && blue >= 1 && blue <= 16) {
        parsed.push({ code: nums[0] > 33 ? String(nums[0]) : '—', date: '', reds, blue });
      }
    }
  });
  if (!parsed.length) return alert('格式未识别，请每行包含 6 个红球 + 1 个蓝球');
  historyData = parsed;
  renderHistoryStats();
  alert(`成功载入 ${parsed.length} 期数据`);
}

/* ---------- 事件绑定 ---------- */

document.getElementById('btnRandom').onclick = () => {
  redPicked = randomRed();
  bluePicked = randomBlue();
  renderAll();
};
document.getElementById('btnClear').onclick = () => {
  redPicked = []; bluePicked = null;
  renderAll();
};
document.getElementById('btnFilterRandom').onclick = generateFiltered;
document.getElementById('btnLoadHistory').onclick = loadPastedHistory;
document.getElementById('btnOnlineFetch').onclick = fetchHistoryOnline;
document.getElementById('btnResetHistory').onclick = () => {
  historyData = SAMPLE_HISTORY.map(x => ({ ...x }));
  document.getElementById('historyInput').value = '';
  document.getElementById('onlineStart').value = '';
  document.getElementById('onlineEnd').value = '';
  document.getElementById('onlineStatus').textContent = '';
  renderHistoryStats();
};
document.getElementById('btnReloadHistory').onclick = renderHistoryStats;

/* ---------- 启动 ---------- */
renderAll();
renderHistoryStats();
