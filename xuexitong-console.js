(function xuexitongMain() {
const PAGE = window;
// 反反调试：学习通 enc_js 用 Function('debugger') 反复触发断点冻结页面，需绕过
try {
if (PAGE.Function !== PAGE.__xuexitongWrappedFunction) {
const NativeFunction = PAGE.Function;
const WrappedFunction = function () {
const body = arguments.length ? arguments[arguments.length - 1] : '';
if (typeof body === 'string' && /debugger/.test(body)) {
return function () {};
}
return NativeFunction.apply(this, arguments);
};
WrappedFunction.prototype = NativeFunction.prototype;
PAGE.Function = WrappedFunction;
PAGE.__xuexitongWrappedFunction = WrappedFunction;
}
} catch (e) {}
const $ = (...args) => PAGE.jQuery(...args);
// 公共工具：整个脚本（含测验自动化与播放器）共用，避免在局部作用域重复定义
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const visible = (el) => Boolean(el && el.isConnected && el.getClientRects().length &&
el.ownerDocument.defaultView.getComputedStyle(el).visibility !== 'hidden');
const kindPattern = /[\[【](单选题|多选题|判断题)[\]】]/;
const documentKindLabel = (kind) => (kind === 'pdf' ? 'PDF' : (kind === 'ppt' ? 'PPT' : '文档'));
const muteMedia = (el) => {
if (!el) return;
el.muted = true;
el.defaultMuted = true;
el.volume = 0;
};
const APP_KEY = '__xuexitongConsoleDeepSeek';
const BOOT_TIMER_KEY = '__xuexitongConsoleDeepSeekBootTimer';
const LOCAL_URL = 'http://127.0.0.1:37841';
const LOCAL_TOKEN = '2bc95d55630e07c873dde45279ef44bff7115beadd112ce7';
const startedByKeeper = PAGE.__xuexitongAutoInjected === true;
delete PAGE.__xuexitongAutoInjected;
if (!/^https:\/\/([a-z0-9-]+\.)*chaoxing\.com$/i.test(location.origin) ||
!location.pathname.includes('/mycourse/studentstudy')) {
console.error('请在学习通课程播放页的控制台执行本脚本');
return;
}
if (LOCAL_TOKEN === '__LOCAL_TOKEN__') {
console.error('请先启动 DeepSeek 本地服务，再复制更新后的 xuexitong-console.js');
return;
}

const previousApp = PAGE[APP_KEY];
if (previousApp && typeof previousApp.destroy === 'function') {
previousApp.destroy();
}
if (PAGE.__xuexitongPlayerV3 && typeof PAGE.__xuexitongPlayerV3.destroy === 'function') {
PAGE.__xuexitongPlayerV3.destroy();
}
if (PAGE.__xuexitongPlayerV4DeepSeek && typeof PAGE.__xuexitongPlayerV4DeepSeek.destroy === 'function') {
PAGE.__xuexitongPlayerV4DeepSeek.destroy();
}
if (PAGE[BOOT_TIMER_KEY]) {
clearInterval(PAGE[BOOT_TIMER_KEY]);
PAGE[BOOT_TIMER_KEY] = null;
}
if (!startedByKeeper) installNavigationKeeper();
fetch(`${LOCAL_URL}/health`, {
headers: { 'X-Xuexitong-Token': LOCAL_TOKEN },
signal: AbortSignal.timeout(5000),
}).then((response) => {
if (!response.ok) throw new Error(`HTTP ${response.status}`);
console.log('DeepSeek 本地服务已连接');
if (typeof PAGE.jQuery === 'undefined') {
const script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
script.type = 'text/javascript';
script.onload = function () {
console.log('jQuery loaded.');
waitForCoursePage();
};
script.onerror = () => console.error('jQuery 加载失败，脚本无法启动');
document.head.appendChild(script);
} else {
waitForCoursePage();
}
}).catch((error) => console.error('DeepSeek 本地服务不可用，请先启动服务并检查 Edge 本地网络权限:', error));

function installNavigationKeeper() {
let keeper;
try {
keeper = PAGE.open('', 'xuexitongConsoleKeeper', 'width=360,height=150');
if (!keeper) throw new Error('浏览器阻止了辅助窗口');
keeper.document.title = '学习通自动任务辅助窗口';
keeper.document.body.innerHTML = '<p style="font:16px sans-serif;padding:12px">学习通自动任务正在运行。请保持此窗口打开；课程页整页跳转后，它会重新启动脚本。</p>';
keeper.__xuexitongSource = `(${xuexitongMain.toString()})();`;
keeper.__xuexitongLastUrl = location.href;
keeper.__xuexitongLastInjectionAt = Date.now();
if (!keeper.__xuexitongKeeperTimer) {
keeper.eval(`window.__xuexitongKeeperTimer = setInterval(function () {
                    try {
                        var page = window.opener;
                        if (!page || page.closed) { clearInterval(window.__xuexitongKeeperTimer); window.close(); return; }
                        if (!/^https:\\/\\/([a-z0-9-]+\\.)*chaoxing\\.com\\/mycourse\\/studentstudy/i.test(page.location.href)) return;
                        if (page.location.href !== window.__xuexitongLastUrl) {
                            window.__xuexitongLastUrl = page.location.href;
                            window.__xuexitongLastInjectionAt = Date.now() - 30000;
                        }
                        if (page.document.readyState !== 'complete' || !page.document.querySelector('#coursetree')) return;
                        if (page.__xuexitongConsoleDeepSeek || page.__xuexitongConsoleDeepSeekBootTimer) return;
                        if (Date.now() - window.__xuexitongLastInjectionAt < 30000) return;
                        window.__xuexitongLastInjectionAt = Date.now();
                        page.__xuexitongAutoInjected = true;
                        page.eval(window.__xuexitongSource);
                    } catch (error) {
                        if (Date.now() - (window.__xuexitongLastErrorAt || 0) > 30000) {
                            window.__xuexitongLastErrorAt = Date.now();
                            window.document.body.textContent = '整页跳转后的自动恢复遇到错误：' + error.message;
                            console.warn('学习通整页跳转后的自动恢复暂不可用:', error);
                        }
                    }
                }, 1000);`);
}
keeper.blur();
PAGE.focus();
console.log('整页跳转辅助窗口已启动；请保持它打开');
} catch (error) {
console.warn('整页跳转后无法自动重新启动脚本；请允许此站点打开弹出窗口，或在新页面重新粘贴脚本。', error);
}
}
function waitForCoursePage() {
let attempts = 0;
const maxAttempts = 20;
PAGE[BOOT_TIMER_KEY] = setInterval(() => {
if ($('#coursetree').length > 0) {
clearInterval(PAGE[BOOT_TIMER_KEY]);
PAGE[BOOT_TIMER_KEY] = null;
initializePlayer();
return;
}
attempts++;
if (attempts >= maxAttempts) {
clearInterval(PAGE[BOOT_TIMER_KEY]);
PAGE[BOOT_TIMER_KEY] = null;
console.error('%c脚本启动超时：未检测到课程目录（#coursetree）。请确认当前处于课程播放页。', 'color:#F44336;font-weight:bold');
}
}, 1000);
}
function attachQuizAutomation(app) {
const attemptedQuizzes = new Set();
let quizBusy = false;
let stopped = false;
const originalDestroy = app.destroy.bind(app);
app.destroy = function () {
stopped = true;
originalDestroy();
};

function courseDocuments() {
return app._collectDocuments();
}

function quizCompleted() {
const docs = courseDocuments();
const scoreShown = docs.some((doc) => {
const text = clean(doc.body?.innerText);
const hasGrade = /本次成绩\s*\d+(?:\.\d+)?\s*分/.test(text);
return hasGrade && (/章节测验\s*已完成/.test(text) || /我的答案\s*[:：]/.test(text));
});
if (scoreShown) return true;
// 作业弹窗已关闭且当前目录节点出现完成标记（新版弹窗不走 cards 框架）
const popupVisible = docs.some((doc) => {
const q = doc.querySelector('.singleQuesId');
return Boolean(q && q.getClientRects().length);
});
if (!popupVisible && document.querySelector('.posCatalog_active .icon_Completed')) return true;
const cardsFrame = Array.from(document.querySelectorAll('iframe[src*="/knowledge/cards"]'))
.find((frame) => frame.getClientRects().length > 0);
const isQuizStep = cardsFrame && new URL(cardsFrame.getAttribute('src'), location.href).searchParams.get('num') === '1';
return Boolean(isQuizStep && document.querySelector('.posCatalog_active .icon_Completed'));
}

function extractQuestions() {
const questions = [];
for (const doc of courseDocuments()) {
const cards = Array.from(doc.querySelectorAll('.singleQuesId'));
for (const card of cards) {
if (!visible(card)) continue;
let kind = '';
const kindEl = card.querySelector('.newZy_TItle');
if (kindEl) {
kind = clean(kindEl.textContent).replace(/[\[【\]】]/g, '');
}
if (!/^(单选题|多选题|判断题)$/.test(kind)) {
const m = clean(card.innerText).match(kindPattern);
kind = m ? m[1] : '';
}
if (!kind) continue;
let title = '';
const titleBox = card.querySelector('.Zy_TItle .fontLabel');
if (titleBox) {
const clone = titleBox.cloneNode(true);
clone.querySelector('.newZy_TItle')?.remove();
title = clean(clone.innerText);
}
const optionLis = Array.from(card.querySelectorAll('li.before-after-checkbox, li.before-after'));
const options = [];
for (const li of optionLis) {
const letterSpan = li.querySelector('.num_option_dx, .num_option');
const letterFromText = clean(letterSpan && letterSpan.textContent).toUpperCase();
const letter = /^[A-H]$/.test(letterFromText) ? letterFromText :
clean(letterSpan && letterSpan.getAttribute('data')).toUpperCase();
const textEl = li.querySelector('a.after');
const text = clean(textEl && (textEl.innerText || textEl.textContent));
if (/^[A-H]$/.test(letter) && text) options.push({ letter, text, element: li });
}
if (!title || title.length > 500 || options.length < 2 || options.length > 8 ||
options.some((o) => !o.text || o.text.length > 500)) continue;
questions.push({ kind, title, options, card, doc });
}
}
return questions;
}

function findButton(doc, label) {
const isLabel = (el) => visible(el) && clean(el.value || el.innerText) === label;
// 先查按钮类元素；仅在找不到时才扫描 div/span，避免轮询时反复遍历整页节点
const native = Array.from(doc.querySelectorAll('button,a,input[type="button"],input[type="submit"]')).find(isLabel);
if (native) return native;
return Array.from(doc.querySelectorAll('[role="button"],div,span')).filter(isLabel)
.find((el) => !Array.from(el.children).some((child) => clean(child.innerText) === label)) || null;
}

function findNextButton() {
for (const doc of courseDocuments()) {
const known = doc.querySelector('#prevNextFocusNext, #right1, .nextChapter');
if (visible(known) && clean(known.innerText || known.title).includes('下一节')) return known;
const generic = findButton(doc, '下一节');
if (generic) return generic;
}
return null;
}

async function revealQuizQuestions() {
const docs = courseDocuments();
const submit = docs.map((doc) => findButton(doc, '提交')).find(Boolean);
if (!submit) return;
let scroller = submit.parentElement;
while (scroller && scroller !== submit.ownerDocument.body) {
const style = scroller.ownerDocument.defaultView.getComputedStyle(scroller);
if (/(auto|scroll)/.test(style.overflowY) && scroller.scrollHeight > scroller.clientHeight + 100) break;
scroller = scroller.parentElement;
}
if (!scroller || scroller === submit.ownerDocument.body) {
scroller = submit.ownerDocument.scrollingElement;
}
if (!scroller || scroller.scrollHeight <= scroller.clientHeight + 100) return;
scroller.scrollTop = 0;
await sleep(150);
for (let step = 0; step < 50; step++) {
const bottom = scroller.scrollHeight - scroller.clientHeight;
if (scroller.scrollTop >= bottom - 2) break;
scroller.scrollTop = Math.min(bottom, scroller.scrollTop + Math.max(300, scroller.clientHeight * 0.75));
await sleep(120);
}
}

async function waitForQuizQuestions() {
let submitDoc = null;
for (let attempt = 0; attempt < 240; attempt++) {
if (stopped) throw new Error('脚本已停止');
if (quizCompleted()) return null;
submitDoc = courseDocuments().find((doc) => findButton(doc, '提交'));
if (submitDoc) break;
if (attempt > 0 && attempt % 30 === 0) console.log(`测验提交按钮仍在加载，已等待 ${attempt / 2} 秒`);
await sleep(500);
}
if (!submitDoc) throw new Error('进入章节测验后等待 120 秒，仍未找到“提交”按钮。请检查题目框架是否正常加载');

await revealQuizQuestions();
let previousSignature = '';
let stableCount = 0;
for (let attempt = 0; attempt < 240; attempt++) {
if (stopped) throw new Error('脚本已停止');
if (quizCompleted()) return null;
const questions = extractQuestions();
const countText = clean(submitDoc.body.innerText).match(/题量\s*[:：]\s*(\d+)/);
const expected = countText ? Number(countText[1]) : null;
if (questions.length && (!expected || questions.length === expected)) {
const signature = questions.map((q) => `${q.kind}:${q.title}:${q.options.length}`).join('|');
stableCount = signature === previousSignature ? stableCount + 1 : 0;
previousSignature = signature;
if (stableCount >= 3) return questions;
} else {
stableCount = 0;
previousSignature = '';
}
if (attempt > 0 && attempt % 30 === 0) console.log(`测验题目仍在加载，已等待 ${attempt / 2} 秒；当前识别 ${questions.length} 道`);
await sleep(500);
}
throw new Error('测验框架已打开，但等待 120 秒仍未识别完整题目。可运行 app.inspectQuiz() 查看当前识别结果');
}

async function askDeepSeek(questions) {
const payload = questions.map((q, i) => ({
id: i + 1,
type: q.kind,
question: q.title,
options: q.options.map((o) => ({ letter: o.letter, text: o.text })),
}));
console.log('以下是本次发送给 DeepSeek 的题干和选项：', payload);
let response;
try {
response = await fetch(`${LOCAL_URL}/answer`, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'X-Xuexitong-Token': LOCAL_TOKEN },
body: JSON.stringify({ questions: payload }),
signal: AbortSignal.timeout(900000),
});
} catch (error) {
throw new Error(`无法连接本地 DeepSeek 服务。请确认启动窗口仍在运行，且 Edge 允许本地网络访问。详情：${error.message}`);
}
const data = await response.json().catch(() => null);
if (!response.ok) throw new Error(data?.error || `本地 DeepSeek 服务返回 HTTP ${response.status}`);
return data.answers;
}

function validateAnswers(questions, answers) {
if (!Array.isArray(answers) || answers.length !== questions.length) throw new Error('AI 返回的题目数量不匹配');
const result = new Map();
for (const item of answers) {
if (!Number.isInteger(item.id) || result.has(item.id) || !Array.isArray(item.letters))
throw new Error('AI 答案格式错误');
const q = questions[item.id - 1];
if (!q) throw new Error('AI 返回未知题号');
const letters = item.letters.map((letter) => clean(letter).toUpperCase());
if (!letters.length) throw new Error(`第 ${item.id} 题 AI 未给出选项，已停止提交`);
if (new Set(letters).size !== letters.length) throw new Error(`第 ${item.id} 题答案包含重复选项，已停止提交`);
if (q.kind !== '多选题' && letters.length !== 1)
throw new Error(`第 ${item.id} 题是${q.kind}，但 AI 返回了 ${letters.length} 个选项，已停止提交`);
const invalidLetters = letters.filter((letter) => !q.options.some((option) => option.letter === letter));
if (invalidLetters.length)
throw new Error(`第 ${item.id} 题 AI 返回了页面中不存在的选项：${invalidLetters.join('、')}，已停止提交`);
result.set(item.id, letters);
}
return result;
}

async function selectAnswers(questions, answers) {
for (let i = 0; i < questions.length; i++) {
const q = questions[i];
for (const letter of answers.get(i + 1)) {
if (stopped) throw new Error('脚本已停止');
const option = q.options.find((item) => item.letter === letter);
if (!option?.element?.isConnected) throw new Error(`第 ${i + 1} 题选项已变化`);
if (option.element.getAttribute('aria-checked') === 'true') {
await sleep(40);
continue;
}
option.element.scrollIntoView({ block: 'center' });
option.element.click();
await sleep(150);
const checked = option.element.getAttribute('aria-checked') === 'true';
if (!checked) throw new Error(`第 ${i + 1} 题 ${letter} 选项未确认选中，已停止提交`);
}
}
}

async function confirmSubmitDialog() {
for (let i = 0; i < 20; i++) {
if (stopped) throw new Error('脚本已停止');
const dialogs = courseDocuments().flatMap((doc) =>
Array.from(doc.querySelectorAll('#popok,[role="dialog"],[role="alertdialog"],.layui-layer-dialog,.el-message-box,.modal')));
const platformButton = dialogs.find((el) => el.id === 'popok' && visible(el));
if (platformButton) {
const message = clean(platformButton.ownerDocument.querySelector('#popcontent')?.innerText);
if (/未作答|请选择|请作答|答完/.test(message) && !/确定提交|确认提交/.test(message))
throw new Error(`平台拒绝提交：${message}`);
console.log(`确认平台提交窗口：${message || '提交'}`);
platformButton.click();
return;
}
const dialog = dialogs.find((el) => el.id !== 'popok' && visible(el) && /提交|交卷/.test(clean(el.innerText)));
if (dialog) {
const confirm = findButton(dialog, '确定') || findButton(dialog, '确认') || findButton(dialog, '提交');
if (!confirm) throw new Error('提交确认窗口未找到确认按钮');
confirm.click();
return;
}
await sleep(250);
}
}

async function submitQuiz(doc) {
if (stopped) throw new Error('脚本已停止');
const submit = findButton(doc, '提交');
if (!submit) throw new Error('未找到测验提交按钮');
submit.scrollIntoView({ block: 'center' });
console.log('选项已选择，点击章节测验的提交按钮');
submit.click();
await confirmSubmitDialog();
console.log('提交已确认，等待学习通生成成绩或任务完成标记；确认后再点击“下一节”');
let elapsedHalfSeconds = 0;
while (!stopped) {
await sleep(500);
elapsedHalfSeconds++;
if (quizCompleted()) return;
if (elapsedHalfSeconds % 30 === 0) console.log(`成绩页仍在加载，已等待 ${elapsedHalfSeconds / 2} 秒`);
}
throw new Error('脚本已停止');
}

async function goToNextStep() {
if (stopped) throw new Error('脚本已停止');
const next = findNextButton();
if (!next) throw new Error('未找到页面下方的“下一节”按钮');
app._nextUnitPending = true;
const previousStep = app._currentStepTitle();
const previousVideo = app._getVideoEl();
const previousChapter = new URLSearchParams(location.search).get('chapterId');
app._clearCheckInterval();
app._stopSlides();
app._cancelDocumentRead();
app._videoEl = null;
app._isPlaying = false;
next.scrollIntoView({ block: 'center' });
console.log(`${previousStep || '当前学习步骤'}完成，点击页面“下一节”，等待新内容加载`);
next.click();
let currentStep = '';
let stepReady = false;
for (let attempt = 0; attempt < 240; attempt++) {
if (stopped) throw new Error('脚本已停止');
await sleep(500);
currentStep = app._currentStepTitle();
if (currentStep === '章节测验') {
stepReady = true;
break;
}
if (currentStep === '视频') {
app._videoEl = null;
const freshVideo = app._getVideoEl();
if (freshVideo && freshVideo !== previousVideo && freshVideo.isConnected &&
Number.isFinite(freshVideo.duration) && freshVideo.duration > 0) {
stepReady = true;
break;
}
}
const currentChapter = new URLSearchParams(location.search).get('chapterId');
if (currentChapter !== previousChapter && document.querySelector('#coursetree') &&
(currentStep === '视频' || currentStep === '章节测验')) {
stepReady = true;
break;
}
if (attempt > 0 && attempt % 30 === 0) console.log(`下一学习步骤仍在加载，已等待 ${attempt / 2} 秒；当前页签：${currentStep || '未显示'}`);
}
if (!stepReady) {
throw new Error(`点击“下一节”后等待 120 秒，新学习步骤仍未加载完成；当前页签：${currentStep || '未显示'}`);
}
app._nextUnitPending = false;
app._videoEl = null;
app._initCellData();
app.play();
}

async function advanceWithFallback() {
try {
await goToNextStep();
} catch (error) {
if (stopped) throw error;
console.warn('页面“下一节”不可用，改走左侧课程目录：', error.message);
app._nextUnitPending = false;
if (typeof app._nextUnitViaTree === 'function') {
app._nextUnitViaTree();
return;
}
throw error;
}
}
app.nextUnit = function () {
if (stopped || this._nextUnitPending) return;
this._nextUnitPending = true;
advanceWithFallback().catch((error) => {
this._nextUnitPending = false;
console.error('切换下一学习步骤失败:', error);
});
};
// 测验/当前标签完成后：先切同小节下一个标签，没有才进入下一小节
app.advanceAfterTabOrUnit = async function () {
const tabs = this._getSectionTabs();
const activeIdx = tabs.findIndex((t) => t.active);
if (activeIdx >= 0 && activeIdx < tabs.length - 1) {
const nextTab = tabs[activeIdx + 1];
await this._switchToTab(nextTab.index);
this.play();
return;
}
await advanceWithFallback();
};

app.inspectQuiz = function () {
return extractQuestions().map((q, i) => ({
id: i + 1, type: q.kind, question: q.title,
options: q.options.map((o) => `${o.letter}. ${o.text}`),
}));
};

app._advanceChapterTest = function () {
if (stopped || quizBusy) return;
quizBusy = true;
(async () => {
if (quizCompleted()) {
console.log('检测到当前章节测验已完成，切换下一标签或下一小节');
await app.advanceAfterTabOrUnit();
return;
}
console.log('已进入章节测验，等待题目和提交按钮加载');
const questions = await waitForQuizQuestions();
if (questions === null) {
console.log('检测到当前章节测验已完成，切换下一标签或下一小节');
await app.advanceAfterTabOrUnit();
return;
}
if (questions.length > 30) throw new Error('题目数量超过 30，已停止自动提交');
const docs = new Set(questions.map((q) => q.doc));
if (docs.size !== 1) throw new Error('题目跨多个框架，已停止自动提交');
const countText = clean(questions[0].doc.body.innerText).match(/题量\s*[:：]\s*(\d+)/);
if (countText && Number(countText[1]) !== questions.length)
throw new Error(`页面显示 ${countText[1]} 道题，脚本只识别 ${questions.length} 道，已停止提交`);
const signature = questions.map((q) => `${q.kind}:${q.title}`).join('|');
if (attemptedQuizzes.has(signature)) throw new Error('本次测验已尝试过，已停止重复提交');
console.log(`识别到 ${questions.length} 道题，正在调用 DeepSeek`);
const answers = validateAnswers(questions, await askDeepSeek(questions));
console.table(questions.map((q, i) => ({ 题号: i + 1, 题型: q.kind, 选择: answers.get(i + 1).join('') })));
await selectAnswers(questions, answers);
attemptedQuizzes.add(signature);
await submitQuiz(questions[0].doc);
console.log('章节测验提交已确认，点击“下一节”进入新视频');
// quizBusy 交给 finally 释放：切换标签/小节期间看门狗不应再次接管测验
await app.advanceAfterTabOrUnit();
})().catch((error) => {
app._nextUnitPending = false;
console.error('章节测验自动作答停止:', error);
})
.finally(() => { quizBusy = false; });
};

// 看门狗：页面被反调试冻结后解冻，若测验未被接管则自动重新触发
const watchdogTimer = setInterval(() => {
if (stopped) { clearInterval(watchdogTimer); return; }
try {
if (typeof app._isChapterTest === 'function' && app._isChapterTest() &&
!quizBusy && !quizCompleted()) {
console.log('%c看门狗：检测到测验未接管，重新触发自动答题', 'color:#FF9800');
app._advanceChapterTest();
}
} catch (_) {}
}, 2000);

}
function initializePlayer() {
const app = {
configs: {
autoplay: true,
retryInterval: 2000,
maxRetries: 10,
videoCheckInterval: 1000,
guardNoProgressMs: 7000,
guardResumeCooldownMs: 1500,
autoAdvanceNoVideo: false,
docCacheMs: 500,
docReadTimeoutMs: 90000,
},
_videoEl: null,
_treeContainerEl: null,
_isPlaying: false,
_stopped: false,
_checkInterval: null,
_eventVideoEl: null,
_boundVideoHandlers: null,
_nextUnitPending: false,
_slidesTimer: null,
_slidesDoc: null,
_slidesFailedDoc: null,
_docReadPending: false,
_docReadToken: 0,
_unreadableDocPoints: new Set(),
_handledEnded: new Set(),
_cellData: {
cells: 0,
nCells: 0,
currentCellIndex: 0,
currentNCellIndex: 0,
currentVideoTitle: "",
},
get cellData() {
return this._cellData;
},
run() {
console.log("%c=== 学习通视频与章节测验助手 V4 启动 ===", "color:#4CAF50;font-size:16px;font-weight:bold");
this._stopped = false;
this._nextUnitPending = false;
this._stopSlides();
this._getTreeContainer();
this._initCellData();
console.log(`当前学习步骤：${this._currentStepTitle() || '等待页面加载'}`);
this._videoEl = null;
this._getVideoEl();
this._clearCheckInterval();
this._bindStepNavigation();
this._bindPageGuards();
this._startCompletionWatchdog();
this.play();
},
_nextUnitViaTree() {
if (this._nextUnitPending) {
console.warn('%c已有小节切换正在进行，忽略重复请求', 'color:#FF9800');
return;
}
this._nextUnitPending = true;
this._clearCheckInterval();
console.log("%c=== 准备切换到下一小节 ===", "color:#2196F3;font-size:14px");
try {
const el = this._getTreeContainer();
const cells = el.children("ul").children("li");
const nCells = $(cells.get(this._cellData.currentCellIndex)).find('.posCatalog_select:not(.firstLayer)');
if (nCells.length > this._cellData.currentNCellIndex + 1) {
const nextNIndex = this._cellData.currentNCellIndex + 1;
console.log(`%c切换到同章节下一个视频: ${nextNIndex + 1}/${nCells.length}`, "color:#FF9800");
this.playCurrentIndex(nCells.get(nextNIndex));
} else {
const nextIndex = this._cellData.currentCellIndex + 1;
if (nextIndex >= cells.length) {
console.log("%c=====================================", "color:#4CAF50;font-size:16px");
console.log("%c==============本课程学习完成了==============", "color:#4CAF50;font-size:16px;font-weight:bold");
console.log("%c=====================================", "color:#4CAF50;font-size:16px");
return;
}
console.log(`%c切换到下一个章节: ${nextIndex + 1}/${cells.length}`, "color:#FF9800");
this._cellData.currentCellIndex = nextIndex;
this._cellData.currentNCellIndex = 0;
this.playCurrentIndex();
}
} catch (error) {
this._nextUnitPending = false;
console.error('切换下一小节失败:', error);
}
},
_clearCheckInterval() {
if (this._checkInterval) {
clearInterval(this._checkInterval);
this._checkInterval = null;
}
},
_stopSlides() {
if (this._slidesTimer) {
clearInterval(this._slidesTimer);
this._slidesTimer = null;
}
this._slidesDoc = null;
this._slidesBottomSince = 0;
},
_cancelDocumentRead() {
this._docReadPending = false;
this._docReadToken++;
},
_startVideoMonitoring() {
this._clearCheckInterval();
this._guardLastTime = 0;
this._guardLastWallTs = 0;
this._guardLastResumeTs = 0;
this._checkInterval = setInterval(() => {
this._checkVideoStatus();
}, this.configs.videoCheckInterval);
},
_tryResumePlayback(reason) {
const now = Date.now();
if (now - this._guardLastResumeTs < this.configs.guardResumeCooldownMs) {
return;
}
this._guardLastResumeTs = now;
const video = this._getVideoEl();
if (!video || !this._isPlaying) return;
muteMedia(video);
console.log(`%c触发视频保活恢复(${reason})`, "color:#607D8B");
video.play().catch((e) => {
console.warn("直接恢复播放失败，尝试静音恢复:", e);
muteMedia(video);
video.play().catch((err) => {
console.error("静音恢复播放失败:", err);
});
});
},
_checkVideoStatus() {
try {
const video = this._getVideoEl();
if (!video) return;
muteMedia(video);
if (video.paused && this._isPlaying) {
console.log("%c检测到视频暂停，尝试恢复播放...", "color:#FF5722");
this._tryResumePlayback("paused");
} else if (this._isPlaying && !video.ended) {
const now = Date.now();
const current = Number(video.currentTime || 0);
if (this._guardLastWallTs === 0) {
this._guardLastWallTs = now;
this._guardLastTime = current;
} else {
const stalled = Math.abs(current - this._guardLastTime) < 0.01;
const stalledMs = now - this._guardLastWallTs;
if (stalled && stalledMs >= this.configs.guardNoProgressMs) {
this._tryResumePlayback("no-progress");
this._guardLastWallTs = now;
this._guardLastTime = Number(video.currentTime || 0);
} else if (!stalled) {
this._guardLastWallTs = now;
this._guardLastTime = current;
}
}
}
if (video.ended && this._isPlaying) {
console.log("%c检测到视频结束，准备切换下一个...", "color:#9C27B0");
this._isPlaying = false;
setTimeout(() => this._advanceAfterVideoEnded(video), 1000);
}
} catch (e) {
console.error("视频状态检查失败:", e);
}
},
_tryTimes: 0,
_stepSwitchAt: 0,
_stepSwitchPending: false,
_delayedNextUnitTimer: null,
_guardLastTime: 0,
_guardLastWallTs: 0,
_guardLastResumeTs: 0,
async play() {
if (this._stopped) return;
try {
if (this._isChapterTest()) {
this._videoEl = null;
this._isPlaying = false;
this._clearCheckInterval();
this._advanceChapterTest();
return;
}
const el = this._getVideoEl();
if (el == null) {
// 0) 弹出“任务点未完成”提示 → 点击“去学习”继续完成，绝不点“下一节”
if (this._dismissUnfinishedWarning()) return;
// 1) 当前是“视频”标签
if (this._currentStepTitle() === '视频') {
// 1a) 视频任务点都已完成
if (!this._hasUnfinishedVideoTask()) {
// 还有 PDF/PPT/文档任务点 → 翻完（含并发保护与失败去重）
if (this._readNextDocumentTask()) return;
// 文档也完成 → 切下一个标签（最后一个标签由看门狗下一节）
const tabs = this._getSectionTabs();
const activeIdx = tabs.findIndex((t) => t.active);
if (activeIdx >= 0 && activeIdx < tabs.length - 1) {
const nextTab = tabs[activeIdx + 1];
console.log(`%c本小节视频与文档已完成，切换到标签：${nextTab.title}`, 'color:#9C27B0;font-weight:bold');
this._switchToTab(nextTab.index).then(() => this.play());
return;
}
// 单标签：如果还有不可见的文档任务点，停止空转，等用户手动展开/切换
if (this._getDocumentTaskPoints().some((p) => !p.finished)) {
console.warn('%c当前可见区域没有可自动翻页的文档任务点，已暂停；请手动展开或切换到对应附件后重试', 'color:#FF9800');
return;
}
// 全部完成：等看门狗跳，这里稍等再试
setTimeout(() => this.play(), 1000);
return;
}
// 1b) 视频任务点未完成或状态不明：等待视频就绪，绝不读文档/跳节
this._tryTimes = (this._tryTimes || 0) + 1;
if (this._tryTimes <= 60) {
if (this._tryTimes === 1 || this._tryTimes % 10 === 0) {
console.log(`%c视频任务点处理中，等待视频就绪…（${this._tryTimes}）`, 'color:#2196F3');
}
setTimeout(() => this.play(), 1000);
return;
}
this._tryTimes = 0;
setTimeout(() => this.play(), 1000);
return;
}
// 2) 非视频标签：才处理 PPT/文档
if (this._findDocumentReader()) {
this._videoEl = null;
this._isPlaying = false;
this._clearCheckInterval();
this._readSlides();
return;
}
if (this._advanceLearningStep()) {
console.log("%c当前不在视频页，已尝试切到下一学习步骤，2秒后重试", "color:#607D8B");
setTimeout(() => {
this.play();
}, 2000);
return;
}
this._isPlaying = false;
this._clearCheckInterval();
if (this.configs.autoAdvanceNoVideo) {
console.warn('%c当前小节未发现视频，按配置切换到下一小节', 'color:#FF9800');
this.nextUnit();
} else {
console.warn('%c当前小节未发现视频或可识别的学习步骤，已安全停止。确认无需完成课件后，可执行 app.nextUnit()。', 'color:#FF9800');
}
return;
}
this._isPlaying = true;
this._videoEventHandle();
try {
muteMedia(el);
await el.play();
this._tryTimes = 0;
console.log('%c视频开始播放，保持页面默认播放速度', 'color:#4CAF50');
this._startVideoMonitoring();
} catch (playError) {
console.error("视频播放失败:", playError);
this._handlePlayError(playError);
}
} catch (e) {
if (this._tryTimes >= this.configs.maxRetries) {
console.error("%c视频播放失败，已达到最大重试次数", "color:#F44336;font-weight:bold", e);
this._clearCheckInterval();
return;
}
this._tryTimes++;
console.log(`%c播放失败，${this.configs.retryInterval/1000}秒后重试 (${this._tryTimes}/${this.configs.maxRetries})`, "color:#FF9800");
setTimeout(() => {
this.play();
}, this.configs.retryInterval);
}
},
_advanceLearningStep() {
if (this._stepSwitchPending && Date.now() - this._stepSwitchAt < 4000) {
return true;
}
const currentStepTitle = this._currentStepTitle();

if (currentStepTitle === "章节测验" || currentStepTitle === "视频") {
return false;
}
const clickElement = (el, label) => {
if (!el) return false;
this._stepSwitchPending = true;
this._stepSwitchAt = Date.now();
console.log(`%c尝试点击${label}`, "color:#2196F3");
el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
return true;
};
const videoTab = $(".prev_white:visible").filter((_, el) => {
const text = ($(el).text() || "").replace(/\s+/g, "");
return text === "2视频" || text === "视频";
}).get(0);
if (clickElement(videoTab, "“视频”页签")) {
return true;
}
return false;
},
_currentStepTitle() {
const cardsFrame = Array.from(document.querySelectorAll('iframe[src*="/knowledge/cards"]'))
.find((frame) => frame.getClientRects().length > 0);
if (cardsFrame) {
const num = new URL(cardsFrame.getAttribute('src'), location.href).searchParams.get('num');
if (num === '0') return '视频';
if (num === '1') return '章节测验';
}
const prevTitle = document.getElementsByClassName('prev_title')[0];
const text = prevTitle ? (prevTitle.title || prevTitle.textContent || '').trim() : '';
return text === '视频' || text === '章节测验' ? text : '';
},
_invalidateDocCache() {
this._docCache = null;
this._docCacheAt = 0;
},
_collectDocuments() {
const now = Date.now();
if (this._docCache && now - this._docCacheAt < this.configs.docCacheMs) {
return this._docCache;
}
const result = [];
const visit = (doc, depth) => {
if (!doc || depth > 6 || result.includes(doc)) return;
result.push(doc);
doc.querySelectorAll('iframe').forEach((f) => {
try { visit(f.contentDocument, depth + 1); } catch (e) {}
});
};
visit(document, 0);
this._docCache = result;
this._docCacheAt = now;
return result;
},
_getSectionTabs() {
const lis = Array.from(document.querySelectorAll('ul.prev_ul > li'));
return lis.map((li, i) => {
const spanText = li.querySelector('.spanText');
const title = (li.getAttribute('title') || spanText?.textContent || '').trim();
return {
li,
index: i,
title,
type: title === '视频' ? 'video' : (title === '章节测验' ? 'quiz' : 'doc'),
active: li.classList.contains('active'),
cardid: li.getAttribute('cardid'),
};
}).filter((t) => t.title);
},
async _switchToTab(index) {
const tabs = this._getSectionTabs();
const tab = tabs.find((t) => t.index === index);
if (!tab) return false;
if (tab.active) return true;
const frame = document.querySelector('iframe[src*="/knowledge/cards"]');
const oldSrc = frame?.getAttribute('src');
this._invalidateDocCache();
this._tabSwitchPending = true;
this._clearCheckInterval();
this._stopSlides();
this._cancelDocumentRead();
this._detachVideoEvents();
this._eventVideoEl = null;
this._isPlaying = false;
try {
try { tab.li.scrollIntoView({ block: 'center' }); } catch (e) {}
tab.li.click();
for (let i = 0; i < 75; i++) {
const fr = document.querySelector('iframe[src*="/knowledge/cards"]');
const src = fr?.getAttribute('src');
if (src && src !== oldSrc) {
this._invalidateDocCache();
await sleep(700);
break;
}
await sleep(200);
}
} catch (error) {
console.error(`切换到标签“${tab.title}”失败:`, error);
return false;
} finally {
this._tabSwitchPending = false;
}
this._videoEl = null;
try {
this._initCellData();
} catch (e) {
console.warn('刷新课程目录信息失败:', e);
}
console.log(`%c已切换到本小节标签：${tab.title}`, 'color:#2196F3;font-weight:bold');
return true;
},
_findUnfinishedWarning() {
const marker = '任务点未完成';
for (const doc of this._collectDocuments()) {
// 先用整页文本快速排除（绝大多数字段/框架都没有该提示），避免逐个 div 读取 innerText
if (!doc.body || !doc.body.textContent.includes(marker)) continue;
// 优先查弹窗类容器；未命中再退回遍历 div，保持原有兜底能力
for (const selector of ['.layui-layer, [class*="dialog"], [class*="popup"], [class*="modal"]', 'div']) {
for (const box of doc.querySelectorAll(selector)) {
if (box.getClientRects().length === 0) continue;
const t = clean(box.innerText);
if (t && t.includes(marker) && t.length < 120) {
return { doc, box };
}
}
}
}
return null;
},
_dismissUnfinishedWarning() {
const w = this._findUnfinishedWarning();
if (!w) return false;
const btns = Array.from(w.box.querySelectorAll('button,a,div,span'));
const goStudy = btns.find((b) => b.getClientRects().length && clean(b.innerText) === '去学习');
if (goStudy) {
console.log('%c检测到“任务点未完成”提示，点击“去学习”继续完成', 'color:#F44336;font-weight:bold');
goStudy.click();
this._nextUnitPending = false;
this._invalidateDocCache();
this._videoEl = null;
setTimeout(() => this.play(), 1200);
} else {
// 兜底：关闭弹窗并回到播放
const close = w.box.querySelector('.close, [class*="close"]');
try { close && close.click(); } catch (e) {}
setTimeout(() => this.play(), 800);
}
return true;
},
_isChapterTest() {
if (this._currentStepTitle() === '章节测验') return true;
return this._collectDocuments().some((doc) => {
const wf = doc.querySelector('form[action*="addStudentWorkNewWeb"], .singleQuesId');
return Boolean(wf && wf.getClientRects().length > 0);
});
},
_bindStepNavigation() {
if (this._stepNavigationBound) {
return;
}
this._stepNavigationBound = true;
const reenterVideoMode = () => {
this._nextUnitPending = false;
this._videoEl = null;
this._isPlaying = false;
this._clearCheckInterval();
this._stopSlides();
this._cancelDocumentRead();
this._detachVideoEvents();
this._stepSwitchPending = true;
this._stepSwitchAt = Date.now();
setTimeout(() => {
try {
this._initCellData();
} catch (e) {}
this.play();
}, 1800);
};
$(document).off('click.xuexitongPlayerV4', '.prev_white').on('click.xuexitongPlayerV4', '.prev_white', (e) => {
const text = ($(e.currentTarget).text() || "").replace(/\s+/g, "");
if (text.includes("视频") || text.includes("章节测验")) {
console.log(`%c检测到步骤切换点击：${text}，准备重新识别页面`, "color:#607D8B");
reenterVideoMode();
}
});
$(document).off('click.xuexitongTree', '.posCatalog_select, .posCatalog_name')
.on('click.xuexitongTree', '.posCatalog_select, .posCatalog_name', () => {
if (this._suppressTreeClick || this._treeReenterTimer) return;
this._treeReenterTimer = setTimeout(() => { this._treeReenterTimer = null; }, 4000);
console.log('%c检测到手动切换小节，1.8秒后重新接管', 'color:#607D8B');
reenterVideoMode();
});
},
_handlePlayError(error) {
console.error("播放错误详情:", error);
const video = this._getVideoEl();
if (video) {
muteMedia(video);
video.play().then(() => {
console.log("%c静音播放成功", "color:#4CAF50");
this._tryTimes = 0;
this._startVideoMonitoring();
if (this._delayedNextUnitTimer) {
clearTimeout(this._delayedNextUnitTimer);
this._delayedNextUnitTimer = null;
}
}).catch(e => {
console.error("静音播放也失败:", e);
if (this._delayedNextUnitTimer) {
clearTimeout(this._delayedNextUnitTimer);
this._delayedNextUnitTimer = null;
}
this._isPlaying = false;
if (this._tryTimes >= this.configs.maxRetries) {
console.error('%c静音播放失败，已达到最大重试次数', 'color:#F44336;font-weight:bold', e);
return;
}
this._tryTimes++;
this._delayedNextUnitTimer = setTimeout(() => {
this._delayedNextUnitTimer = null;
this.play();
}, this.configs.retryInterval);
});
}
},
playCurrentIndex(nCell) {
this._nextUnitPending = false;
this._stopSlides();
this._cancelDocumentRead();
if (!nCell) {
const el = this._getTreeContainer();
const cells = el.children("ul").children("li");
const nCells = $(cells.get(this._cellData.currentCellIndex)).find('.posCatalog_select:not(.firstLayer)');
nCell = nCells.get(this._cellData.currentNCellIndex);
}
const $nCell = $(nCell);
const clickableSpan = $nCell.find(".posCatalog_name")[0];
if (!clickableSpan) {
console.error("%c===========找不到可点击的课程节点，播放下一个视频失败==============", "color:#F44336");
return;
}
console.log(`%c点击切换到: ${$(clickableSpan).attr('title') || '未知标题'}`, "color:#2196F3");
this._suppressTreeClick = true;
$(clickableSpan).click();
this._suppressTreeClick = false;
this._videoEl = null;
this._isPlaying = false;
console.log("%c等待视频加载...", "color:#FF9800");
setTimeout(() => {
this._initCellData();
if (this.configs.autoplay) {
this.play();
}
}, 3000);
},
_initCellData() {
const el = this._getTreeContainer();
const cells = el.children("ul").children("li");
this._cellData.cells = cells.length;
// 进入新的学习步骤后重置“已处理结束”去重表，允许同一 video 元素被复用时再次推进
this._handledEnded.clear();
this._cancelDocumentRead();
this._unreadableDocPoints.clear();
this._slidesFailedDoc = null;
let nCellCounts = 0;
let foundCurrent = false;
cells.each((i, v) => {
const nCells = $(v).find('.posCatalog_select:not(.firstLayer)');
nCellCounts += nCells.length;
nCells.each((j, e) => {
const _el = $(e);
if (_el.hasClass("posCatalog_active")) {
this._cellData.currentCellIndex = i;
this._cellData.currentNCellIndex = j;
foundCurrent = true;
const titleSpan = _el.find('.posCatalog_name')[0];
if (titleSpan) {
this._cellData.currentVideoTitle = $(titleSpan).attr('title');
}
}
});
});
this._cellData.nCells = nCellCounts;

if (!foundCurrent && nCellCounts > 0) {
console.warn("%c未找到当前激活的视频节点，可能需要手动选择", "color:#FF9800");
}
console.log(`%c课程信息: ${this._cellData.cells}章, ${this._cellData.nCells}节, 当前: 第${this._cellData.currentCellIndex + 1}章第${this._cellData.currentNCellIndex + 1}节`, "color:#607D8B");
},
_getTreeContainer() {
if (!this._treeContainerEl) {
const el = $('#coursetree');
if (el.length <= 0) {
throw new Error("找不到视频列表");
}
this._treeContainerEl = el;
}
return this._treeContainerEl;
},
_findDocumentReader() {
let result = null;
const visit = (doc, depth) => {
if (!doc || depth > 5 || result) return;
doc.querySelectorAll('iframe').forEach((f) => {
const src = f.src || '';
if (/\/screen\/file[?&]/i.test(src) && f.getClientRects().length > 0) {
const fd = f.contentDocument;
if (fd && fd.querySelectorAll('img').length > 0) {
result = { frame: f, doc: fd };
}
}
try { visit(f.contentDocument, depth + 1); } catch (e) {}
});
};
visit(document, 0);
return result;
},
_startCompletionWatchdog() {
if (this._completionWatchdog) return;
this._completionWatchdog = setInterval(() => {
try {
// 最高优先：弹出“任务点未完成”提示 → 点“去学习”
if (this._dismissUnfinishedWarning()) return;
// 正在切换 / 播放 / PPT滚动 / 测验弹窗未完成 → 不干预
if (this._nextUnitPending || this._isPlaying || this._slidesTimer || this._tabSwitchPending) return;
if (this._isChapterTest()) return;
// 当前小节所有任务点已完成（节点打勾）→ 才自动跳到下一小节
if (this._currentNodeCompleted()) {
console.log('%c✓ 当前小节已完成，自动跳到下一小节', 'color:#4CAF50;font-weight:bold');
this.nextUnit();
}
} catch (e) {}
}, 2000);
},
_currentNodeCompleted() {
return Boolean(document.querySelector('.posCatalog_active .icon_Completed'));
},
_findScrollContainer(doc) {
if (!doc) return null;
const root = doc.scrollingElement || doc.documentElement;
if (root && root.scrollHeight > root.clientHeight + 100) return root;
const win = doc.defaultView;
if (!win) return null;
// 没有可滚动的根节点时，选滚动范围最大的可见容器，避免误选侧栏/缩略图列表
let best = null;
let bestRange = 100;
const all = doc.querySelectorAll('*');
for (let i = 0; i < all.length; i++) {
const el = all[i];
const range = el.scrollHeight - el.clientHeight;
if (range <= bestRange || el.getClientRects().length === 0) continue;
const style = win.getComputedStyle(el);
if (style.visibility === 'hidden' || !/(auto|scroll|overlay)/.test(style.overflowY)) continue;
best = el;
bestRange = range;
}
return best;
},
_findScrollableAncestor(el) {
// 只沿任务点自身的祖先链找滚动容器，绝不滚动目录/侧栏等无关面板
let node = el;
for (let guard = 0; node && guard < 30; guard++) {
const doc = node.ownerDocument;
if (!doc) break;
if (node.nodeType === 1) {
const win = doc.defaultView;
const range = node.scrollHeight - node.clientHeight;
if (range > 50 && node.getClientRects().length > 0 && win &&
/(auto|scroll|overlay)/.test(win.getComputedStyle(node).overflowY)) {
return node;
}
}
if (node === doc.body) {
node = doc.documentElement;
continue;
}
if (node === doc.documentElement) {
let frameEl = null;
try { frameEl = doc.defaultView?.frameElement || null; } catch (e) {}
if (frameEl && frameEl !== node) {
node = frameEl;
continue;
}
break;
}
node = node.parentElement;
}
return null;
},
_readSlides() {
const reader = this._findDocumentReader();
if (!reader) { this.play(); return; }
// 同一份文档的翻页任务已在执行时直接复用，避免 play() 反复调用叠加多个定时器
if (this._slidesTimer && this._slidesDoc === reader.doc) return;
// 该文档已自动翻页失败过，等用户手动完成或切换到新步骤后再试，避免无限重试
if (this._slidesFailedDoc === reader.doc) return;
this._stopSlides();
this._slidesDoc = reader.doc;
const doc = reader.doc;
// 先滚 iframe 内部；整页 iframe 自身不滚动时，沿 iframe 的祖先链滚真正的内容区
let container = this._findScrollContainer(doc);
if (!container) container = this._findScrollableAncestor(reader.frame);
container = container || doc.scrollingElement;
container.scrollTop = 0;
console.log('%c检测到PPT/文档，开始快速翻页', 'color:#9C27B0;font-weight:bold');
this._slidesTimer = setInterval(() => {
if (this._currentNodeCompleted()) {
this._stopSlides();
console.log('%cPPT/文档已完成，进入下一节', 'color:#4CAF50;font-weight:bold');
this.nextUnit();
return;
}
const bottom = container.scrollHeight - container.clientHeight;
if (container.scrollTop >= bottom - 2) {
if (!this._slidesBottomSince) {
this._slidesBottomSince = Date.now();
console.log('已到PPT底部，等待完成标记');
}
if (Date.now() - this._slidesBottomSince > 20000) {
this._stopSlides();
if (this._currentNodeCompleted()) {
console.log('%cPPT/文档已完成，进入下一节', 'color:#4CAF50;font-weight:bold');
this.nextUnit();
} else {
this._slidesFailedDoc = doc;
console.warn('%c滚到底后仍未检测到完成标记，已停止自动翻页；请手动滑到文档末尾，检测到完成标记后会自动继续', 'color:#FF9800');
}
}
return;
}
container.scrollTop = Math.min(bottom, container.scrollTop + Math.max(container.clientHeight * 0.95, 300));
}, 80);
},
_getVideoTaskPoints() {
const points = [];
for (const doc of this._collectDocuments()) {
doc.querySelectorAll('.ans-attach-ct.videoContainer').forEach((ct) => {
const icon = ct.querySelector('.ans-job-icon');
const finished = ct.classList.contains('ans-job-finished') ||
icon?.getAttribute('aria-label') === '任务点已完成';
const iframe = ct.querySelector('iframe.ans-insertvideo-online');
let video = null;
try {
const fd = iframe?.contentDocument;
video = fd?.querySelector('video#video_html5_api, video[id*="video_html5"]');
} catch (e) {}
points.push({ ct, icon, iframe, video, finished });
});
}
return points;
},
_hasUnfinishedVideoTask() {
return this._getVideoTaskPoints().some((p) => !p.finished);
},
_getDocumentTaskPoints() {
const points = [];
for (const doc of this._collectDocuments()) {
doc.querySelectorAll('.ans-attach-ct').forEach((ct) => {
if (ct.classList.contains('videoContainer')) return;
const icon = ct.querySelector('.ans-job-icon');
if (!icon) return; // 非任务点（参考资料）
const finished = ct.classList.contains('ans-job-finished') ||
icon.getAttribute('aria-label') === '任务点已完成';
const iframe = ct.querySelector('iframe');
const src = iframe?.src || '';
let kind = 'doc';
if (/modules\/pdf|insertdoc-online-pdf/.test(src)) kind = 'pdf';
else if (/screen\/file/.test(src)) kind = 'screen';
else if (/modules\/ppt|insertdoc-online/.test(src)) kind = 'ppt';
points.push({ ct, icon, iframe, finished, kind, doc });
});
}
return points;
},
_readDocumentTaskPoint(p) {
return new Promise((resolve) => {
try { p.ct.scrollIntoView({ block: 'center' }); } catch (e) {}
const iframe = p.iframe;
let inner = null;
try { inner = iframe?.contentDocument || null; } catch (e) {}
const startedAt = Date.now();
const timeoutMs = this.configs.docReadTimeoutMs;
let target = null;
let targetAt = 0;
let nextClickAt = 0;

const isFinished = () => p.ct.classList.contains('ans-job-finished') ||
p.icon?.getAttribute('aria-label') === '任务点已完成';

// 优先滚动 iframe 内部的滚动容器；整页 iframe 没有内部滚动时退回外层页面滚动
const findInFrames = (doc, depth) => {
if (!doc || depth > 3) return null;
const own = this._findScrollContainer(doc);
if (own) return { doc, el: own };
for (const frame of doc.querySelectorAll('iframe')) {
try {
const found = findInFrames(frame.contentDocument, depth + 1);
if (found) return found;
} catch (e) {}
}
return null;
};
const pickTarget = () => {
if (inner) {
const nested = findInFrames(inner, 0);
if (nested) return nested;
}
// 任务点可能在多级 iframe 中：只沿它自身的祖先链找可滚动容器
const ancestor = this._findScrollableAncestor(p.ct);
if (ancestor) return { doc: ancestor.ownerDocument, el: ancestor };
return null;
};

const clickNext = (doc) => {
if (!doc || Date.now() < nextClickAt) return;
nextClickAt = Date.now() + 1500;
const isNext = (b) => {
if (!b.getClientRects().length) return false;
const t = (b.innerText || b.title || b.id || '').trim();
const cls = (b.className || '').toString();
return /^(下一页|next|›|»)$/i.test(t) || /\bnext\b/i.test(cls);
};
const btn = Array.from(doc.querySelectorAll('button,a')).find(isNext) ||
Array.from(doc.querySelectorAll('[class*="next" i]')).find(isNext);
if (btn) {
try { btn.click(); } catch (e) {}
}
};

const act = () => {
// 任务点已完成
if (isFinished()) {
console.log('%c文档/PDF 任务点已完成', 'color:#4CAF50;font-weight:bold');
resolve(true);
return;
}
// 超时兜底
if (Date.now() - startedAt > timeoutMs) {
console.warn(`文档/PDF 任务点翻页等待 ${Math.round(timeoutMs / 1000)} 秒仍未完成，停止自动翻页`);
resolve(false);
return;
}
if (!target || !target.el.isConnected || Date.now() - targetAt > 5000) {
target = pickTarget();
targetAt = Date.now();
}
if (target) {
const { doc, el } = target;
const bottom = el.scrollHeight - el.clientHeight;
const step = Math.max(el.clientHeight * 0.85, 240);
if (el.scrollTop < bottom - 2) {
el.scrollTop = Math.min(bottom, el.scrollTop + step);
}
try {
const win = doc.defaultView || window;
// 选中的是内部容器时，同时推进文档视口，避免阅读器把滚动绑在 window 上
if (el !== (doc.scrollingElement || doc.documentElement)) {
win.scrollBy(0, step);
}
el.dispatchEvent(new win.Event('scroll'));
win.dispatchEvent(new win.Event('scroll'));
el.dispatchEvent(new win.WheelEvent('wheel', { deltaY: 600, bubbles: true, cancelable: true }));
} catch (e) {}
}
// 分页式阅读器需要点击“下一页”
clickNext(inner);
setTimeout(act, 350);
};
setTimeout(act, 400);
});
},
_readNextDocumentTask() {
const points = this._getDocumentTaskPoints().filter((p) => !p.finished);
if (!points.length) return false;
if (this._docReadPending) return true;
// 只处理当前可见的任务点；隐藏的任务点交给标签切换逻辑，避免滚动不可见的 iframe
const visiblePoint = points.find((p) => {
try { return visible(p.ct); } catch (e) { return false; }
});
if (!visiblePoint) return false;
const point = visiblePoint;
if (this._unreadableDocPoints.has(point.ct)) return true;
const label = documentKindLabel(point.kind);
console.log(`%c视频已完成，本小节还有${label}任务点，开始翻页`, 'color:#FF9800;font-weight:bold');
this._docReadPending = true;
const token = ++this._docReadToken;
this._readDocumentTaskPoint(point).then((ok) => {
if (token !== this._docReadToken || this._stopped) return;
this._docReadPending = false;
if (ok) {
this.play();
return;
}
this._unreadableDocPoints.add(point.ct);
console.warn(`%c该文档任务点自动翻页 ${Math.round(this.configs.docReadTimeoutMs / 1000)} 秒仍未完成，已停止重试；若它在其它标签页，请切过去并滑到末尾。检测到完成标记后会自动继续`, 'color:#F44336;font-weight:bold');
});
return true;
},
_getVideoEl() {
if (this._videoEl && this._videoEl.isConnected) return this._videoEl;
this._videoEl = null;
try {
const points = this._getVideoTaskPoints();
let picked = points.find((p) => !p.finished && p.video);
if (!picked) {
// 第一个未完成任务点的视频还没加载（懒加载）：先滚动到它，等下次重试
const firstUnfinished = points.find((p) => !p.finished);
if (firstUnfinished) {
try { firstUnfinished.ct.scrollIntoView({ block: 'center' }); } catch (e) {}
}
return null;
}
try { picked.ct.scrollIntoView({ block: 'center' }); } catch (e) {}
this._videoEl = picked.video;
muteMedia(picked.video);
return this._videoEl;
} catch (e) {
console.error("获取视频元素失败:", e);
return null;
}
},
_videoEventHandle() {
const el = this._videoEl;
if (!el) {
console.log("videoEl未加载");
return;
}
if (this._eventVideoEl === el) return;
this._detachVideoEvents();
this._eventVideoEl = el;
this._boundVideoHandlers = {
ended: this._handleVideoEnded.bind(this),
loadedmetadata: this._handleVideoLoaded.bind(this),
play: this._handleVideoPlay.bind(this),
pause: this._handleVideoPause.bind(this),
};
el.addEventListener('ended', this._boundVideoHandlers.ended);
el.addEventListener('loadedmetadata', this._boundVideoHandlers.loadedmetadata);
el.addEventListener('play', this._boundVideoHandlers.play);
el.addEventListener('pause', this._boundVideoHandlers.pause);
},
_detachVideoEvents() {
if (!this._eventVideoEl || !this._boundVideoHandlers) return;
this._eventVideoEl.removeEventListener('ended', this._boundVideoHandlers.ended);
this._eventVideoEl.removeEventListener('loadedmetadata', this._boundVideoHandlers.loadedmetadata);
this._eventVideoEl.removeEventListener('play', this._boundVideoHandlers.play);
this._eventVideoEl.removeEventListener('pause', this._boundVideoHandlers.pause);
this._eventVideoEl = null;
this._boundVideoHandlers = null;
},
_playVideoTaskPoint(p) {
const video = p.video;
this._videoEl = video;
try {
p.ct.scrollIntoView({ block: 'center' });
muteMedia(video);
} catch (e) {}
this._isPlaying = true;
this._videoEventHandle();
setTimeout(() => {
video.play().then(() => {
console.log('%c视频开始播放', 'color:#4CAF50');
this._startVideoMonitoring();
}).catch((err) => {
console.warn('直接播放失败，静音重试:', err);
muteMedia(video);
video.play().then(() => {
this._startVideoMonitoring();
}).catch((e2) => console.error('视频播放失败:', e2));
});
}, 300);
},
_advanceAfterVideoEnded(videoEl) {
const key = videoEl || this._eventVideoEl || this._videoEl;
if (key) {
if (this._handledEnded.has(key)) return; // 防 ended 事件与轮询竞态
this._handledEnded.add(key);
}
this._resolveAfterVideoEnded();
},
_resolveAfterVideoEnded() {
this._videoEl = null;
const points = this._getVideoTaskPoints();
const unfinished = points.filter((p) => !p.finished);
// 1) 优先播放一个“未结束”的视频（真正的下一个视频）
const playNext = unfinished.find((p) => p.video && !p.video.ended);
if (playNext) {
console.log(`%c本小节还有 ${unfinished.length} 个视频未完成，播放下一个`, "color:#9C27B0;font-weight:bold");
this._playVideoTaskPoint(playNext);
return;
}
// 2) 未完成视频已 ended（等待学习通标记 ans-job-finished）：等待，不重播
if (unfinished.some((p) => p.video && p.video.ended)) {
setTimeout(() => this._resolveAfterVideoEnded(), 1500);
return;
}
// 3) 未完成视频还没加载（懒加载）：滚动到它并等待
if (unfinished.some((p) => !p.video)) {
const noVideo = unfinished.find((p) => !p.video);
try { noVideo.ct.scrollIntoView({ block: 'center' }); } catch (e) {}
setTimeout(() => this._resolveAfterVideoEnded(), 1500);
return;
}
// 3.5) 视频任务点已完成，但同小节还有 PDF/PPT/文档任务点：翻完它们再继续
if (this._readNextDocumentTask()) return;
// 4) 所有任务点完成：切下一个标签，否则下一节
const tabs = this._getSectionTabs();
const activeIdx = tabs.findIndex((t) => t.active);
if (activeIdx >= 0 && activeIdx < tabs.length - 1) {
const nextTab = tabs[activeIdx + 1];
console.log(`%c本小节视频已完成，切换到标签：${nextTab.title}`, 'color:#9C27B0;font-weight:bold');
this._switchToTab(nextTab.index).then(() => this.play());
return;
}
// 已无后续标签，但仍有不可见的文档任务点：不能直接跳节
if (this._getDocumentTaskPoints().some((p) => !p.finished)) {
console.warn('%c当前可见区域没有可自动翻页的文档任务点，已暂停；请手动展开或切换到对应附件后重试', 'color:#FF9800');
return;
}
this.nextUnit();
},
_handleVideoEnded(e) {
const title = this._cellData.currentVideoTitle;
console.warn(`%c============'${title}' 播放完成=============`, "color:#4CAF50;font-weight:bold");
this._isPlaying = false;
this._clearCheckInterval();
setTimeout(() => this._advanceAfterVideoEnded(e.target), 1000);
},
_handleVideoLoaded(e) {
console.log(`%c============视频加载完成=============`, "color:#2196F3");
if (this.configs.autoplay && !this._isPlaying) {
this.play();
}
},
_handleVideoPlay(e) {
const title = this._cellData.currentVideoTitle;
console.info(`%c============'${title}' 开始播放=============`, "color:#4CAF50");
this._isPlaying = true;
this._stepSwitchPending = false;
const video = this._getVideoEl();
this._guardLastTime = Number(video?.currentTime || 0);
this._guardLastWallTs = Date.now();
if (this._delayedNextUnitTimer) {
clearTimeout(this._delayedNextUnitTimer);
this._delayedNextUnitTimer = null;
}
},
_handleVideoPause(e) {
console.log(`%c============视频暂停=============`, "color:#FF9800");
},
_bindPageGuards() {
if (this._pageGuards) {
const old = this._pageGuards;
document.removeEventListener('mouseleave', old.preventPause);
window.removeEventListener('mouseleave', old.preventPause);
document.removeEventListener('mouseout', old.preventPause);
window.removeEventListener('mouseout', old.preventPause);
window.removeEventListener('blur', old.resumePlaybackNow);
document.removeEventListener('visibilitychange', old.resumePlaybackNow);
}
const preventPause = (e) => {
if (!this._isPlaying) return;
e.stopPropagation();
e.preventDefault();
};
const resumePlaybackNow = () => this._tryResumePlayback('page-event');
this._pageGuards = { preventPause, resumePlaybackNow };
document.addEventListener('mouseleave', preventPause);
window.addEventListener('mouseleave', preventPause);
document.addEventListener('mouseout', preventPause);
window.addEventListener('mouseout', preventPause);
window.addEventListener('blur', resumePlaybackNow);
document.addEventListener('visibilitychange', resumePlaybackNow);
},
destroy() {
this._stopped = true;
this._isPlaying = false;
this._nextUnitPending = false;
this._clearCheckInterval();
this._stopSlides();
this._cancelDocumentRead();
this._unreadableDocPoints.clear();
this._slidesFailedDoc = null;
this._detachVideoEvents();
this._handledEnded.clear();
this._docCache = null;
this._docCacheAt = 0;
if (this._completionWatchdog) { clearInterval(this._completionWatchdog); this._completionWatchdog = null; }
if (this._delayedNextUnitTimer) { clearTimeout(this._delayedNextUnitTimer); this._delayedNextUnitTimer = null; }
if (this._treeReenterTimer) { clearTimeout(this._treeReenterTimer); this._treeReenterTimer = null; }
$(document).off('.xuexitongPlayerV4');
$(document).off('.xuexitongTree');
if (this._pageGuards) {
const { preventPause, resumePlaybackNow } = this._pageGuards;
document.removeEventListener('mouseleave', preventPause);
window.removeEventListener('mouseleave', preventPause);
document.removeEventListener('mouseout', preventPause);
window.removeEventListener('mouseout', preventPause);
window.removeEventListener('blur', resumePlaybackNow);
document.removeEventListener('visibilitychange', resumePlaybackNow);
this._pageGuards = null;
}
},
};
attachQuizAutomation(app);
PAGE.app = app;
PAGE[APP_KEY] = app;

try {
app.run();
} catch (error) {
console.error("%c脚本运行失败: ", "color:#F44336;font-weight:bold", error.message);
console.log("请检查是否在正确的课程播放页面，或者页面结构是否再次发生改变。");
}
}
})();
