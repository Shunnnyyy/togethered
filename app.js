
const DB_KEY = 'togethered_demo_db_v1';

const defaultDB = {
  currentUser: null,
  users: [],
  posts: [
    {id:1,title:'What is the best way to improve speaking confidence in English class?',body:'I understand readings pretty well, but I get nervous when I have to speak in front of others. Any advice?',category:'ESL Support',author:'Maya',time:'2 hours ago'},
    {id:2,title:'ENG2D review: lots of writing, but manageable with a reading schedule',body:'What helped me most was making a weekly reading plan and writing down one key idea from each chapter.',category:'Course Advice',author:'Jordan',time:'1 day ago'}
  ],
  tutorRequests: [],
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
  try { return JSON.parse(raw); }
  catch(e){
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
    return structuredClone(defaultDB);
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function getDB(){ return loadDB(); }
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
        user = {name:'Demo Student', email, role:'I need support', grade:'Grade 10', school:'Ontario High School', interests:''};
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
        db.users.push({name,email,role,grade,school:school || 'Ontario High School',interests:''});
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
function bindCommunity(){
  const form = document.getElementById('post-form');
  const feed = document.getElementById('community-feed');
  if(!feed) return;

  renderPosts();

  if(form){
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = document.getElementById('post-title').value.trim();
      const body = document.getElementById('post-body').value.trim();
      const category = document.getElementById('post-category').value;
      const user = getCurrentUser();
      if(!title || !body) return alert('Please add a title and post.');
      const db = getDB();
      db.posts.unshift({
        id: Date.now(),
        title, body, category,
        author: user ? user.name : 'Demo Student',
        time: 'just now'
      });
      saveDB(db);
      form.reset();
      renderPosts();
    });
  }
}
function renderPosts(){
  const feed = document.getElementById('community-feed');
  if(!feed) return;
  const db = getDB();
  feed.innerHTML = '';
  db.posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <div class="top-row">
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <div class="small">Posted by ${escapeHtml(post.author)} · ${escapeHtml(post.time)}</div>
        </div>
        <span class="badge">${escapeHtml(post.category)}</span>
      </div>
      <p class="lead">${escapeHtml(post.body)}</p>
      <span class="tag">${escapeHtml(post.category)}</span>
    `;
    feed.appendChild(div);
  });
}
function bindTutorRequests(){
  document.querySelectorAll('[data-request-tutor]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const tutor = btn.dataset.requestTutor;
      const user = getCurrentUser();
      if(!user) return alert('Please log in first.');
      const db = getDB();
      db.tutorRequests.push({
        id: Date.now(), tutor, student: user.name, status:'Requested'
      });
      saveDB(db);
      alert('Tutor request saved in the demo dashboard.');
    });
  });
}
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
    db.courseReviews.push({id:Date.now(), course, difficulty, workload, tip});
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
function renderDashboard(){
  const userName = document.getElementById('user-name');
  const userMeta = document.getElementById('user-meta');
  const requestsList = document.getElementById('request-list');
  const messageList = document.getElementById('message-list');
  const stats1 = document.getElementById('stat-posts');
  const stats2 = document.getElementById('stat-requests');
  const stats3 = document.getElementById('stat-reviews');
  const user = getCurrentUser();
  const db = getDB();
  if(userName) userName.textContent = user ? user.name : 'Student';
  if(userMeta) userMeta.textContent = user ? `${user.role} · ${user.grade} · ${user.school}` : '';
  if(stats1) stats1.textContent = db.posts.length;
  if(stats2) stats2.textContent = db.tutorRequests.length;
  if(stats3) stats3.textContent = db.courseReviews.length;
  if(requestsList){
    requestsList.innerHTML = '';
    if(db.tutorRequests.length === 0){
      requestsList.innerHTML = '<div class="empty">No tutor requests yet.</div>';
    } else {
      db.tutorRequests.slice().reverse().forEach(r => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<div><strong>${escapeHtml(r.tutor)}</strong><div class="small">Requested by ${escapeHtml(r.student)}</div></div><span class="badge">${escapeHtml(r.status)}</span>`;
        requestsList.appendChild(item);
      });
    }
  }
  if(messageList){
    messageList.innerHTML = '';
    db.messages.forEach(m => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `<div><strong>${escapeHtml(m.subject)}</strong><div class="small">From ${escapeHtml(m.from)}</div></div><span class="badge">Inbox</span>`;
      messageList.appendChild(item);
    });
  }
}
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
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  requireAuth();
  bindAuth();
  bindCommunity();
  bindTutorRequests();
  bindCourseReviews();
  renderDashboard();
  bindContact();
});
