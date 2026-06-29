import { makeReader, write, connectWallet, activeAccount, balanceOf, short, toGen, GEN, fmtErr }
  from "../shared/genlayer-lite.js";

const CONTRACT = "0x4Af79F8c3D52Cf884DF28B0Ec6Bc9f4336185F2B";
const { read } = makeReader(CONTRACT);
const W_ARMED = 0, W_FIRED = 1, W_DISARMED = 2;
const STLABEL = ["Armed", "Fired", "Disarmed"];
const WCLS = ["ws-armed", "ws-fired", "ws-disarmed"];
let account = null, watches = [];
const $ = (id) => document.getElementById(id);
const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("contractLink").textContent = "Contract " + short(CONTRACT) + " \u2197";

function toast(msg, kind = "", title = "vigil") {
  const el = document.createElement("div"); el.className = "toast " + kind;
  el.innerHTML = `<span class="tt">${title}</span>`; el.appendChild(document.createTextNode(msg));
  $("log").appendChild(el); setTimeout(() => el.remove(), kind === "err" ? 15000 : 5000);
}

async function refreshWallet() {
  account = await activeAccount();
  const slot = $("walletslot");
  if (account) { let bal = 0n; try { bal = await balanceOf(account); } catch (_) {} slot.innerHTML = `<span class="mono" style="font-size:12.5px;color:var(--txt2)">${short(account)} \u00b7 ${toGen(bal)} GEN</span>`; }
  else { slot.innerHTML = `<button class="btn ghost sm" id="connectBtn">Connect</button>`; $("connectBtn").onclick = doConnect; }
}
async function doConnect() { try { account = await connectWallet(); toast("Connected on studionet.", "ok"); await refreshWallet(); } catch (e) { toast(fmtErr(e), "err"); } }
async function ensureWallet() { if (!account) account = await connectWallet(); await refreshWallet(); }

async function load() {
  try {
    const count = Number(await read("get_watch_count"));
    const out = [];
    for (let i = 0; i < count; i++) out.push({ id: i, ...(await read("get_watch", [i])) });
    watches = out; renderList(); fillPalette();
    $("wCount").textContent = count + (count === 1 ? " watch" : " watches");
    $("stArmed").textContent = out.filter((w) => Number(w.status) === W_ARMED).length;
    $("stLocked").textContent = toGen(out.filter((w) => Number(w.status) === W_ARMED).reduce((s, w) => s + BigInt(w.amount), 0n).toString());
    $("stFired").textContent = out.filter((w) => Number(w.status) === W_FIRED).length;
  } catch (e) { $("watchList").innerHTML = `<div class="w-empty">Could not reach the chain. ${fmtErr(e)}</div>`; }
}

function fillPalette() {
  const w = watches.find((x) => Number(x.status) === W_ARMED) || watches[watches.length - 1];
  if (w && $("palCond")) $("palCond").textContent = w.condition.slice(0, 48);
}

function renderList() {
  const el = $("watchList");
  if (!watches.length) { el.innerHTML = `<div class="w-empty">No watches yet. Arm the first one.</div>`; return; }
  el.innerHTML = "";
  [...watches].reverse().forEach((w) => {
    const st = Number(w.status);
    const row = document.createElement("div"); row.className = "watch";
    row.innerHTML = `<span class="watch-ic"><i class="ph-bold ph-radar"></i></span>
      <div class="watch-m"><div class="watch-name">${esc(w.name)}</div><div class="watch-cond">when <b>${esc(w.condition)}</b></div></div>
      <div class="watch-r"><span class="watch-amt">${toGen(w.amount)} GEN</span><span class="wstatus ${WCLS[st]}">${STLABEL[st]} \u00b7 ${w.checks}\u00d7</span></div>`;
    row.onclick = () => openDetail(w.id);
    el.appendChild(row);
  });
}

function openDrawer() { $("scrim").classList.add("on"); $("drawer").classList.add("on"); }
function closeDrawer() { $("scrim").classList.remove("on"); $("drawer").classList.remove("on"); }

function openNew() {
  $("drawerTitle").textContent = "$ vigil new";
  $("drawerBody").innerHTML = `
    <div class="cmd">
      <div class="cl"><span class="cp">vigil&gt;</span> watch <input id="nUrl" class="ci" placeholder="https://status.url" autocomplete="off" /></div>
      <div class="cl"><span class="cp">&nbsp;&nbsp;--name</span> <input id="nName" class="ci" placeholder="refund-on-outage" autocomplete="off" /></div>
      <div class="cl"><span class="cp">&nbsp;&nbsp;--if</span> "<input id="nCond" class="ci wide" placeholder="the status page reports an outage" autocomplete="off" />"</div>
      <div class="cl"><span class="cp">&nbsp;&nbsp;--pay</span> <input id="nAmount" class="ci sm" type="number" min="0" step="0.5" value="3" /> GEN <span class="cp">--to</span> <input id="nRecip" class="ci" placeholder="0x..." autocomplete="off" /></div>
      <button class="btn primary block" id="createBtn">&#9656; ARM WATCH</button>
      <div class="hint">Anyone can poke the watch later. The first time the condition holds, it fires and pays out.</div>
    </div>`;
  $("createBtn").onclick = doCreate; openDrawer();
}

function openDetail(id) {
  const w = watches.find((x) => x.id === id); if (!w) return;
  const st = Number(w.status);
  const isOwner = account && account.toLowerCase() === w.owner.toLowerCase();
  $("drawerTitle").textContent = w.name;
  let box = "";
  if (st === W_FIRED) box = `<div class="verdict-box vb-ok"><b>Fired - action executed.</b> ${w.last_result ? esc(w.last_result) : "The condition was read as true."}</div>`;
  else if (st === W_ARMED && w.last_result) box = `<div class="verdict-box vb-wait"><b>Armed - not yet.</b> ${esc(w.last_result)}</div>`;
  let actions = "";
  if (st === W_ARMED) {
    actions = `<button class="btn primary block" id="checkBtn"><i class="ph-bold ph-magnifying-glass"></i> Check now</button><div class="hint" style="text-align:center;margin:8px 0">Validators read the page and agree if the condition is true. Calls a real LLM.</div>`;
    if (isOwner) actions += `<button class="btn ghost block" id="disarmBtn">Disarm & reclaim</button>`;
  }
  $("drawerBody").innerHTML = `
    <div class="d-amt">${toGen(w.amount)} GEN</div>
    ${box}
    <div class="kv"><span class="k">FIRES WHEN</span><span class="v">${esc(w.condition)}</span></div>
    <div class="kv"><span class="k">WATCHING</span><span class="v"><a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.url)} \u2197</a></span></div>
    <div class="kv"><span class="k">RECIPIENT</span><span class="v mono">${short(w.recipient)}</span></div>
    <div class="kv"><span class="k">OWNER</span><span class="v mono">${short(w.owner)}</span></div>
    <div class="kv"><span class="k">CHECKS</span><span class="v mono">${w.checks}</span></div>
    <div class="kv"><span class="k">STATUS</span><span class="v">${STLABEL[st]}</span></div>
    <div style="margin-top:16px">${actions}</div>`;
  openDrawer();
  if (st === W_ARMED) { if ($("checkBtn")) $("checkBtn").onclick = () => doCheck(id); if ($("disarmBtn")) $("disarmBtn").onclick = () => doDisarm(id); }
}

async function doCreate() {
  const name = $("nName").value.trim(), url = $("nUrl").value.trim(), cond = $("nCond").value.trim(), recip = $("nRecip").value.trim();
  const amount = parseFloat($("nAmount").value);
  if (!name) return toast("Name the watch.", "err");
  if (!url) return toast("Enter a URL to watch.", "err");
  if (!cond) return toast("State the fire condition.", "err");
  if (!/^0x[0-9a-fA-F]{40}$/.test(recip)) return toast("Enter a valid recipient address.", "err");
  if (!(amount > 0)) return toast("Escrow must be above zero.", "err");
  const btn = $("createBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> arming';
  try { await ensureWallet(); await write(CONTRACT, "create_watch", [name, url, cond, recip], GEN(amount)); toast("Watch armed.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.innerHTML = "Arm watch & escrow"; }
}
async function doCheck(id) {
  if (!confirm("Check now? Validators read the page and agree whether the condition is true. Calls a real LLM; if true, the watch fires.")) return;
  const btn = $("checkBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> reading the page';
  try { await ensureWallet(); toast("Validators reading the page\u2026", "", "check"); await write(CONTRACT, "check", [id]); toast("Checked on-chain.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); if (btn) { btn.disabled = false; btn.textContent = "Check now"; } }
}
async function doDisarm(id) {
  const btn = $("disarmBtn"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> disarming';
  try { await ensureWallet(); await write(CONTRACT, "disarm", [id]); toast("Watch disarmed, escrow reclaimed.", "ok"); closeDrawer(); await load(); }
  catch (e) { toast(fmtErr(e), "err"); btn.disabled = false; btn.textContent = "Disarm & reclaim"; }
}

$("heroPostBtn").onclick = openNew;
$("ctaPostBtn").onclick = openNew;
$("navPostBtn").onclick = openNew;
$("refreshBtn").onclick = load;
$("closeDrawer").onclick = closeDrawer;
$("scrim").onclick = closeDrawer;
const _cb = $("connectBtn"); if (_cb) _cb.onclick = doConnect;
if (window.ethereum) window.ethereum.on?.("accountsChanged", refreshWallet);

refreshWallet();
load();

// ====== radar sweep (Three.js, coral on dark) ======
(function radar() {
  const canvas = $("radarCanvas"); if (!canvas || !window.THREE) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 9, 0.2); camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight || 500; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  const CORAL = 0xff6363;
  const grp = new THREE.Group(); scene.add(grp);
  for (let i = 1; i <= 4; i++) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(i * 1.6 - 0.02, i * 1.6, 80),
      new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: .12, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; grp.add(ring);
  }
  // cross lines
  for (let a = 0; a < 4; a++) {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(Math.cos(a*Math.PI/2)*6.4,0,Math.sin(a*Math.PI/2)*6.4)]);
    grp.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: CORAL, transparent: true, opacity: .12 })));
  }
  // sweep (a triangle fan wedge)
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(6.4, 32, 0, Math.PI / 5),
    new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: .16, side: THREE.DoubleSide }));
  sweep.rotation.x = -Math.PI / 2; grp.add(sweep);
  // blips
  const blips = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: CORAL }));
    const a = Math.random() * 6.28, r = 1 + Math.random() * 5;
    b.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); b.userData = { a, base: 0 };
    grp.add(b); blips.push(b);
  }
  resize(); addEventListener("resize", resize);
  let t = 0, running = true;
  const vis = new IntersectionObserver((es) => { running = es[0].isIntersecting; if (running) loop(); }, { threshold: 0 });
  vis.observe(canvas);
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop); t += 0.02;
    sweep.rotation.z = -t;
    blips.forEach((b, i) => { b.material.opacity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i)); });
    renderer.render(scene, camera);
  }
  loop();
})();
