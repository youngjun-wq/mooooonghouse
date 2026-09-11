// ============================================================
//  Code.gs  —  보드방정 Community Web App
// ============================================================

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('보드방정')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }

function getPageContent(pageName) {
  const allowedPages = ['Home', 'Calendar', 'Board', 'Rules'];
  if (!allowedPages.includes(pageName)) return '<p>페이지를 찾을 수 없습니다.</p>';
  return HtmlService.createHtmlOutputFromFile(pageName).getContent();
}

// ── 데이터베이스 ─────────────────────────────────────────────
function getAppData() {
  var props = PropertiesService.getScriptProperties();
  return {
    events: JSON.parse(props.getProperty('events') || '[]'),
    posts: JSON.parse(props.getProperty('posts') || '[]'),
    rules: JSON.parse(props.getProperty('rules') || '[]'),
    // 💡 새로운 배너 이미지 ID 반영 (Thumbnail 방식이 더 안정적입니다)
    bannerUrl: 'https://drive.google.com/thumbnail?id=1AJf91ga_ZFsPPDhQFmNGatcEZf18ZmuH&sz=w1200'
  };
}

// ── 캘린더 (마스터 비번 0226 적용) ──────────────────────────
function getEvents() { return getAppData().events; }

function addEvent(dateStr, title, content, password) {
  var props = PropertiesService.getScriptProperties();
  var events = JSON.parse(props.getProperty('events') || '[]');
  events.push({
    id: new Date().getTime(), date: dateStr, title: title, content: content, password: password, isEdited: false
  });
  events.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
  props.setProperty('events', JSON.stringify(events));
  return events;
}

function updateEvent(id, title, content, password) {
  var props = PropertiesService.getScriptProperties();
  var events = JSON.parse(props.getProperty('events') || '[]');
  for (var i = 0; i < events.length; i++) {
    if (events[i].id === id) {
      if (events[i].password !== password && password !== '0226') return { success: false, message: '비밀번호가 틀렸습니다.' };
      events[i].title = title; events[i].content = content; events[i].isEdited = true;
      props.setProperty('events', JSON.stringify(events));
      return { success: true, events: events };
    }
  }
  return { success: false, message: '일정을 찾을 수 없습니다.' };
}

function deleteEvent(id, password) {
  var props = PropertiesService.getScriptProperties();
  var events = JSON.parse(props.getProperty('events') || '[]');
  var initialLen = events.length;
  var filtered = events.filter(function(e) { return !(e.id === id && (e.password === password || password === '0226')); });
  if (filtered.length === initialLen) return { success: false, message: '비밀번호가 틀렸습니다.' };
  props.setProperty('events', JSON.stringify(filtered));
  return { success: true, events: filtered };
}

// ── 게시판 (마스터 비번 0226 적용) ──────────────────────────
function getPosts() { return getAppData().posts; }

function addPost(content, password) {
  if (!content) return { success: false, message: '내용을 입력해주세요.' };
  var props = PropertiesService.getScriptProperties();
  var posts = JSON.parse(props.getProperty('posts') || '[]');
  var newPost = { id: new Date().getTime(), content: content.trim(), timestamp: new Date().toISOString(), likes: 0, comments: [], password: password, isEdited: false };
  posts.unshift(newPost);
  props.setProperty('posts', JSON.stringify(posts));
  return { success: true, post: newPost };
}

function updatePost(id, content, password) {
  var props = PropertiesService.getScriptProperties();
  var posts = JSON.parse(props.getProperty('posts') || '[]');
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].id === id) {
      if (posts[i].password !== password && password !== '0226') return { success: false, message: '비밀번호가 틀렸습니다.' };
      posts[i].content = content.trim(); posts[i].isEdited = true;
      props.setProperty('posts', JSON.stringify(posts));
      return { success: true };
    }
  }
  return { success: false, message: '게시물을 찾을 수 없습니다.' };
}

function deletePost(id, password) {
  var props = PropertiesService.getScriptProperties();
  var posts = JSON.parse(props.getProperty('posts') || '[]');
  var initialLen = posts.length;
  var filtered = posts.filter(function(p) { return !(p.id === id && (p.password === password || password === '0226')); });
  if (filtered.length === initialLen) return { success: false, message: '비밀번호가 틀렸습니다.' };
  props.setProperty('posts', JSON.stringify(filtered));
  return { success: true };
}

function likePost(postId) {
  var props = PropertiesService.getScriptProperties();
  var posts = JSON.parse(props.getProperty('posts') || '[]');
  var post = posts.find(function(p) { return p.id === postId; });
  if (post) { post.likes++; props.setProperty('posts', JSON.stringify(posts)); return { success: true, likes: post.likes }; }
  return { success: false };
}

function addComment(postId, commentContent) {
  if (!commentContent) return { success: false };
  var props = PropertiesService.getScriptProperties();
  var posts = JSON.parse(props.getProperty('posts') || '[]');
  var post = posts.find(function(p) { return p.id === postId; });
  if (post) {
    if (!post.comments) post.comments = [];
    post.comments.push({ id: new Date().getTime(), content: commentContent.trim(), timestamp: new Date().toISOString() });
    props.setProperty('posts', JSON.stringify(posts));
    return { success: true };
  }
  return { success: false };
}

// ── 룰 편집 (비번 0226 고정) ────────────────────────────────
function getRules() { return getAppData().rules; }

function saveRules(password, text) {
  if (password !== '0226') return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  var props = PropertiesService.getScriptProperties();
  var rulesArray = text.split('\n\n').filter(function(r) { return r.trim() !== ''; }).map(function(r) { return { content: r, isEdited: false }; });
  props.setProperty('rules', JSON.stringify(rulesArray));
  return { success: true };
}

function updateRule(index, content, password) {
  if (password !== '0226') return { success: false, message: '비밀번호가 틀렸습니다.' };
  var props = PropertiesService.getScriptProperties();
  var rules = JSON.parse(props.getProperty('rules') || '[]');
  if (rules[index]) {
    if (typeof rules[index] === 'string') rules[index] = { content: content, isEdited: true };
    else { rules[index].content = content; rules[index].isEdited = true; }
    props.setProperty('rules', JSON.stringify(rules));
    return { success: true };
  }
  return { success: false, message: '룰을 찾을 수 없습니다.' };
}

function deleteRule(index, password) {
  if (password !== '0226') return { success: false, message: '비밀번호가 틀렸습니다.' };
  var props = PropertiesService.getScriptProperties();
  var rules = JSON.parse(props.getProperty('rules') || '[]');
  rules.splice(index, 1);
  props.setProperty('rules', JSON.stringify(rules));
  return { success: true };
}
