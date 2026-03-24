import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://iazzrjqbpvcrxhsdjzub.supabase.co',
  'sb_publishable_TZhNDvRK1c8mChCFAloWgg_w06EXEst'
)

const DB_KEY = 'togethered_demo_db_v1';

const defaultDB = {
  currentUser: null,
  users: [],
  tutors: [
    {id:1,name:'Maya L.',grade:'Grade 11',subjects:['English','ESL'],bio:'Helps with speaking confidence, essay planning, and class participation.'},
    {id:2,name:'Daniel P.',grade:'Grade 12',subjects:['Math','Science'],bio:'Supports algebra, functions, and science note organization.'},
    {id:3,name:'Amina S.',grade:'Grade 10',subjects:['Newcomer','School Life'],bio:'Helps students adjust to school routines, expectations, and communication.'}
  ],
  courseReviews: [
    {id:1,course:'ENG2D',difficulty:'Medium',workload:'Reading + essay writing',tip:'Build a weekly reading schedule.'},
    {id:2,course:'MPM2D',difficulty:'Medium-High',workload:'Practice-heavy',tip:'Do short daily problem sets instead of cramming.'},
    {id:3,course:'SNC2D',difficulty:'Medium',workload:'Labs + review',tip:'Keep one-page summaries for each unit.'},
    {id:4,course:'ESLDO',difficulty:'Supportive',workload:'Steady practice',tip:'Focus on speaking and class vocabulary each week.'}
  ],
  messages: [
    {id:1,from:'TogetherEd',subject:'Welcome to the demo',body:'This is a front-end MVP prototype with local data only.'}
  ]
};

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if(!raw){
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
    return structuredClone(defaultDB);
  }
  try {
    return JSON.parse(raw);
  } catch(e){
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
    return structuredClone(defaultDB);
  }
}

function saveDB(db){
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getDB(){
  return loadDB();
}

function setYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

function getCurrentUser(){
  const db = getDB();
  return db.users.find(u => u.email === db.currentUser) || null;
}

function requireAuth(){
  const publicPages = ['index.html','login.html','signup.html'];
  const page = location.pathname.split('/').pop() || 'index.html';
  if(publicPages.includes(page)) return;
  if(!getCurrentUser()) location.href = 'login.html';
}

function bindAuth(){
  const loginBtn = document.getElementById('login-btn');
  if(loginBtn){
    loginBtn.addEventListener('click', e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      if(!email) return alert('Enter an email.');

      const db = getDB();
      let user = db.users.find(u => u.email === email);

      if(!user){
        user = {
          name:'Demo Student',
          email,
          role:'I need support',
          grade:'Grade 10',
          school:'Ontario High School',
          interests:''
        };
        db.users.push(user);
      }

      db.currentUser = email;
      saveDB(db);
      location.href = 'dashboard.html';
    });
  }

  const signupBtn = document.getElementById('signup-btn');
  if(signupBtn){
    signupBtn.addEventListener('click', e => {
      e.preventDefault();

      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const role = document.getElementById('signup-role').value;
      const grade = document.getElementById('signup-grade').value;
      const school = document.getElementById('signup-school').value.trim();

      if(!name || !email) return alert('Enter at least name and email.');

      const db = getDB();
      const exists = db.users.find(u => u.email === email);

      if(!exists){
        db.users.push({
          name,
          email,
          role,
          grade,
          school: school || 'Ontario High School',
          interests:''
        });
      }

      db.currentUser = email;
      saveDB(db);
      location.href = 'dashboard.html';
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      const db = getDB();
      db.currentUser = null;
      saveDB(db);
      location.href = 'index.html';
    });
  }
}

/* =========================
   SUPABASE: POSTS
========================= */

async function loadPostsFromSupabase() {
  const feed = document.getElementById('community-feed');
  if (!feed) return;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load posts failed:', error);
    feed.innerHTML = `<div class="empty">Failed to load posts.</div>`;
    return;
  }

  feed.innerHTML = '';

  if (!data || data.length === 0) {
    feed.innerHTML = `<div class="empty">No posts yet. Be the first to post.</div>`;
    return;
  }

  data.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <div class="top-row">
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <div class="small">Posted by ${escapeHtml(post.author || 'Student')}</div>
        </div>
        <span class="badge">${escapeHtml(post.category || 'General')}</span>
      </div>
      <p class="lead">${escapeHtml(post.content)}</p>
      <span class="tag">${escapeHtml(post.category || 'General')}</span>
    `;
    feed.appendChild(div);
  });
}

async function addPostToSupabase(title, content, category, author) {
  const { error } = await supabase
    .from('posts')
    .insert([
      {
        title,
        content,
        category,
        author
      }
    ]);

  if (error) {
    console.error('Add post failed:', error);
    alert('Failed to add post');
    return false;
  }

  return true;
}

function bindCommunity(){
  const form = document.getElementById('post-form');
  const feed = document.getElementById('community-feed');
  if(!feed) return;

  loadPostsFromSupabase();

  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = document.getElementById('post-title').value.trim();
      const content = document.getElementById('post-body').value.trim();
      const category = document.getElementById('post-category').value;
      const user = getCurrentUser();

      if(!title || !content) {
        alert('Please add a title and post.');
        return;
      }

      const author = user ? user.name : 'Demo Student';
      const success = await addPostToSupabase(title, content, category, author);

      if (success) {
        form.reset();
        await loadPostsFromSupabase();
      }
    });
  }
}

/* =========================
   SUPABASE: TUTOR REQUESTS
========================= */

async function saveTutorRequestToSupabase(tutorName, studentName) {
  const { error } = await supabase
    .from('tutor_requests')
    .insert([
      {
        tutor_name: tutorName,
        student_name: studentName,
        status: 'Requested'
      }
    ]);

  if (error) {
    console.error('Tutor request failed:', error);
    alert('Failed to save tutor request');
    return false;
  }

  return true;
}

async function loadTutorRequestsFromSupabase() {
  const { data, error } = await supabase
    .from('tutor_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load tutor requests failed:', error);
    return [];
  }

  return data || [];
}

function bindTutorRequests(){
  document.querySelectorAll('[data-request-tutor]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();

      const tutor = btn.dataset.requestTutor;
      const user = getCurrentUser();
      if(!user) return alert('Please log in first.');

      const ok = await saveTutorRequestToSupabase(tutor, user.name);
      if (ok) {
        alert('Tutor request saved.');
      }
    });
  });
}

/* =========================
   DEMO COURSE REVIEWS
========================= */

function bindCourseReviews(){
  const form = document.getElementById('course-review-form');
  if(!form) return;

  renderCourseReviews();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const course = document.getElementById('review-course').value.trim();
    const difficulty = document.getElementById('review-difficulty').value;
    const workload = document.getElementById('review-workload').value.trim();
    const tip = document.getElementById('review-tip').value.trim();

    if(!course || !tip) return alert('Please add course and tip.');

    const db = getDB();
    db.courseReviews.push({
      id: Date.now(),
      course,
      difficulty,
      workload,
      tip
    });

    saveDB(db);
    form.reset();
    renderCourseReviews();
  });
}

function renderCourseReviews(){
  const tbody = document.getElementById('course-review-body');
  if(!tbody) return;

  const db = getDB();
  tbody.innerHTML = '';

  db.courseReviews.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(row.course)}</td>
      <td>${escapeHtml(row.difficulty)}</td>
      <td>${escapeHtml(row.workload)}</td>
      <td>${escapeHtml(row.tip)}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   DASHBOARD
========================= */

async function renderDashboard(){
  const userName = document.getElementById('user-name');
  const userMeta = document.getElementById('user-meta');
  const requestsList = document.getElementById('request-list');
  const messageList = document.getElementById('message-list');
  const stats1 = document.getElementById('stat-posts');
  const stats2 = document.getElementById('stat-requests');
  const stats3 = document.getElementById('stat-reviews');

  if(!userName && !userMeta && !requestsList && !messageList && !stats1 && !stats2 && !stats3) return;

  const user = getCurrentUser();
  const db = getDB();

  if(userName) userName.textContent = user ? user.name : 'Student';
  if(userMeta) userMeta.textContent = user ? `${user.role} · ${user.grade} · ${user.school}` : '';

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  const { count: requestCount } = await supabase
    .from('tutor_requests')
    .select('*', { count: 'exact', head: true });

  if(stats1) stats1.textContent = postCount ?? 0;
  if(stats2) stats2.textContent = requestCount ?? 0;
  if(stats3) stats3.textContent = db.courseReviews.length;

  if(requestsList){
    requestsList.innerHTML = '';
    const requests = await loadTutorRequestsFromSupabase();

    if(requests.length === 0){
      requestsList.innerHTML = '<div class="empty">No tutor requests yet.</div>';
    } else {
      requests.forEach(r => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div>
            <strong>${escapeHtml(r.tutor_name)}</strong>
            <div class="small">Requested by ${escapeHtml(r.student_name)}</div>
          </div>
          <span class="badge">${escapeHtml(r.status || 'Requested')}</span>
        `;
        requestsList.appendChild(item);
      });
    }
  }

  if(messageList){
    messageList.innerHTML = '';
    db.messages.forEach(m => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(m.subject)}</strong>
          <div class="small">From ${escapeHtml(m.from)}</div>
        </div>
        <span class="badge">Inbox</span>
      `;
      messageList.appendChild(item);
    });
  }
}

/* =========================
   CONTACT
========================= */

function bindContact(){
  const form = document.getElementById('contact-form');
  if(!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    alert('Thanks! This static MVP does not send real emails yet.');
    form.reset();
  });
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

document.addEventListener('DOMContentLoaded', async () => {
  setYear();
  requireAuth();
  bindAuth();
  bindCommunity();
  bindTutorRequests();
  bindCourseReviews();
  await renderDashboard();
  bindContact();
});
