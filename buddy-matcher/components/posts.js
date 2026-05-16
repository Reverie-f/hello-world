// 全局变量
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let applications = JSON.parse(localStorage.getItem('applications')) || [];

// XSS防护
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 检查帖子是否过期
function isPostExpired(post) {
  if (!post.time) return true;
  const postTime = new Date(post.time);
  const now = new Date();
  return postTime < now;
}

// 获取帖子状态
function getPostStatus(post) {
  if (isPostExpired(post)) return 'expired';
  return post.status || 'waiting';
}

// 登录验证
function checkLogin() {
  if (!currentUser) {
    // 使用replace防止后退访问
    window.location.replace('index.html');
    return false;
  }
  return true;
}

// 初始化页面
function initPage() {
  if (!checkLogin()) return;
  
  if (document.getElementById('welcomeMsg')) {
    document.getElementById('welcomeMsg').textContent = `欢迎，${escapeHtml(currentUser.name)} (${escapeHtml(currentUser.className)})`;
  }
  
  // 标记过期帖子
  markExpiredPosts();
  
  renderAvailablePosts();
  renderMyPosts();
  
  bindEvents();
}

// 标记过期帖子
function markExpiredPosts() {
  let updated = false;
  posts.forEach(post => {
    const status = getPostStatus(post);
    if (status === 'expired' && post.status !== 'expired') {
      post.status = 'expired';
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem('posts', JSON.stringify(posts));
  }
}

// 绑定事件
function bindEvents() {
  const newPostBtn = document.getElementById('newPostBtn');
  if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
      window.location.href = 'post.html';
    });
  }

  const postForm = document.getElementById('postForm');
  if (postForm) {
    postForm.addEventListener('submit', handlePostSubmit);
  }
  
  // 使用事件委托处理动态生成的按钮
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // 申请参与按钮
    if (target.classList.contains('apply-btn')) {
      const postId = parseInt(target.dataset.postId);
      openApplyModal(postId);
    }
    
    // 同意按钮
    if (target.classList.contains('approve-btn')) {
      const postId = parseInt(target.dataset.postId);
      const studentId = target.dataset.studentId;
      handleApplication(postId, studentId, 'approve');
    }
    
    // 拒绝按钮
    if (target.classList.contains('reject-btn')) {
      const postId = parseInt(target.dataset.postId);
      const studentId = target.dataset.studentId;
      handleApplication(postId, studentId, 'reject');
    }
    
    // 关闭弹窗
    if (target.classList.contains('modal-overlay') || target.classList.contains('close-modal')) {
      closeModal();
    }

    // 取消帖子按钮
    if (target.classList.contains('cancel-post-btn')) {
      const postId = parseInt(target.dataset.postId);
      openCancelConfirm(postId);
    }
    
    // 提交申请
    if (target.classList.contains('submit-application')) {
      const postId = parseInt(target.dataset.postId);
      submitApplication(postId);
    }
  });
}

// 获取分类颜色
function getCategoryColor(category){
  switch(category){
    case '学习': return '#4A90E2';
    case '饭搭子': return '#F5A623';
    case '运动': return '#D0021B';
    default: return '#ccc';
  }
}

// 获取状态标签
function getStatusLabel(status) {
  switch(status) {
    case 'pending': return '待审核';
    case 'approved': return '已通过';
    case 'rejected': return '已拒绝';
    case 'waiting': return '等待申请';
    case 'matched': return '已匹配';
    case 'expired': return '已结束';
    default: return status;
  }
}

// 获取状态样式类
function getStatusClass(status) {
  switch(status) {
    case 'pending': return 'status-pending';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    case 'expired': return 'status-expired';
    default: return '';
  }
}

// 判断是否是帖子作者
function isPostAuthor(post) {
  return post.author && post.author.studentId === currentUser.studentId;
}

// 判断用户是否已申请该帖子
function hasApplied(postId) {
  return applications.some(a => a.postId === postId && a.user.studentId === currentUser.studentId);
}

// 获取用户对某帖子的申请
function getUserApplication(postId) {
  return applications.find(a => a.postId === postId && a.user.studentId === currentUser.studentId);
}

// 渲染可申请的帖子
function renderAvailablePosts(){
  const availableDiv = document.getElementById('availablePosts');
  if (!availableDiv) return;
  
  const otherPosts = posts.filter(p => !isPostAuthor(p));
  
  if (otherPosts.length === 0) {
    availableDiv.innerHTML = '<p class="empty-tip">暂无可申请的活动</p>';
    return;
  }
  
  availableDiv.innerHTML = otherPosts.map(post => {
    const color = getCategoryColor(post.category);
    const status = getPostStatus(post);
    const applied = hasApplied(post.id);
    const application = getUserApplication(post.id);
    const isExpired = status === 'expired';
    const isMatched = status === 'matched';
    const isDisabled = isExpired || isMatched || applied;
    
    let buttonHtml = '';
    if (isExpired) {
      buttonHtml = '<button disabled class="disabled-btn">已结束</button>';
    } else if (isMatched) {
      buttonHtml = '<button disabled class="disabled-btn">已匹配</button>';
    } else if (applied) {
      const appStatus = application?.status || 'pending';
      buttonHtml = `<button disabled class="disabled-btn">${getStatusLabel(appStatus)}</button>`;
    } else {
      buttonHtml = `<button class="apply-btn" data-post-id="${post.id}">申请参与</button>`;
    }
    
    return `<article class="card" style="border-left: 4px solid ${color}">
      <strong>${escapeHtml(post.title)}</strong>
      <div class="post-meta">
        <span class="category-tag" style="background: ${color}">${escapeHtml(post.category)}</span>
        <span class="status-tag ${getStatusClass(status === 'matched' ? 'approved' : status === 'expired' ? 'expired' : '')}">${getStatusLabel(status === 'matched' ? 'matched' : status === 'expired' ? 'expired' : 'waiting')}</span>
      </div>
      <div class="post-info">
        <p><strong>📍 地点：</strong>${escapeHtml(post.location)}</p>
        <p><strong>📅 时间：</strong>${escapeHtml(post.time)}</p>
        ${post.description ? `<p><strong>💬 描述：</strong>${escapeHtml(post.description)}</p>` : ''}
        <p><strong>👤 发布者：</strong>${escapeHtml(post.author?.name || '未知')} (${escapeHtml(post.author?.className || '未知')})</p>
      </div>
      ${buttonHtml}
    </article>`;
  }).join('');
}

// 渲染我发布的帖子
function renderMyPosts(){
  const myDiv = document.getElementById('myPosts');
  if (!myDiv) return;
  
  const myPosts = posts.filter(p => isPostAuthor(p));
  
  if (myPosts.length === 0) {
    myDiv.innerHTML = '<p class="empty-tip">暂无发布的活动</p>';
    return;
  }
  
  myDiv.innerHTML = myPosts.map(post => {
    const color = getCategoryColor(post.category);
    const status = getPostStatus(post);
    const relatedApps = applications.filter(a => a.postId === post.id);
    
    let appHtml = '';
    if (relatedApps.length > 0) {
      appHtml = `<div class="applications-section">
        <h4>申请列表 (${relatedApps.length})</h4>
        ${relatedApps.map(app => {
          const isPending = app.status === 'pending';
          return `<div class="application-item">
            <div class="applicant-info">
              <strong>${escapeHtml(app.user.name)}</strong> (${escapeHtml(app.user.className)})
            </div>
            <p class="applicant-intro">"${escapeHtml(app.intro)}"</p>
            <div class="applicant-status">
              <span class="status-tag ${getStatusClass(app.status)}">${getStatusLabel(app.status)}</span>
              ${isPending && status !== 'matched' && status !== 'expired' ? `
              <button class="action-btn approve-btn" data-post-id="${post.id}" data-student-id="${app.user.studentId}">✅ 同意</button>
              <button class="action-btn reject-btn" data-post-id="${post.id}" data-student-id="${app.user.studentId}">❌ 拒绝</button>
              ` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    } else {
      appHtml = '<p class="no-applications">暂无申请</p>';
    }

    const isCancellable = status !== 'matched' && status !== 'expired';
    const cancelBtn = isCancellable ? `<button class="action-btn cancel-post-btn" data-post-id="${post.id}">🗑️ 取消帖子</button>` : '';

    return `<article class="card" style="border-left: 4px solid ${color}">
      <div class="card-header">
        <strong>${escapeHtml(post.title)}</strong>
        <span class="status-tag ${getStatusClass(status === 'matched' ? 'approved' : status === 'expired' ? 'expired' : '')}">${getStatusLabel(status === 'matched' ? 'matched' : status === 'expired' ? 'expired' : 'waiting')}</span>
      </div>
      <div class="post-info">
        <p><strong>📍 地点：</strong>${escapeHtml(post.location)}</p>
        <p><strong>📅 时间：</strong>${escapeHtml(post.time)}</p>
        ${post.description ? `<p><strong>💬 描述：</strong>${escapeHtml(post.description)}</p>` : ''}
      </div>
      ${cancelBtn}
      ${appHtml}
    </article>`;
  }).join('');
}

// 处理申请操作
function handleApplication(postId, studentId, action){
  const app = applications.find(a => a.postId === postId && a.user.studentId === studentId);
  const post = posts.find(p => p.id === postId);
  
  if (!app || !post) {
    alert('操作失败：数据不存在');
    return;
  }
  
  // 权限检查：只能处理自己帖子的申请
  if (!isPostAuthor(post)) {
    alert('操作失败：您没有权限处理此申请');
    return;
  }
  
  // 状态检查：已匹配或已过期的帖子不能再处理申请
  const status = getPostStatus(post);
  if (status === 'matched' || status === 'expired') {
    alert('操作失败：该帖子已结束');
    return;
  }
  
  // 状态检查：申请已处理过
  if (app.status !== 'pending') {
    alert(`操作失败：该申请已${app.status === 'approved' ? '通过' : '拒绝'}`);
    return;
  }
  
  if (action === 'approve') {
    // 确认操作
    if (!confirm(`确定同意 ${escapeHtml(app.user.name)} 的申请吗？`)) {
      return;
    }
    
    app.status = 'approved';
    post.status = 'matched';
    
    // 拒绝其他所有申请人
    applications.forEach(a => {
      if (a.postId === postId && a.user.studentId !== studentId && a.status === 'pending') {
        a.status = 'rejected';
      }
    });
    
    // 保存匹配信息（为申请者和发布者都保存）
    saveMatchRecord(app.user, currentUser, post);
    
    // 保存数据
    saveData();
    
    alert(`成功匹配！\n\n搭子：${escapeHtml(app.user.name)}\n班级：${escapeHtml(app.user.className)}\n专业：${escapeHtml(app.user.major || '未填写')}\n\n请尽快联系对方！`);
    
    // 延迟跳转，让用户看到提示
    setTimeout(() => {
      window.location.href = 'match-success.html';
    }, 1000);
    
  } else if (action === 'reject') {
    // 确认操作
    if (!confirm(`确定拒绝 ${escapeHtml(app.user.name)} 的申请吗？`)) {
      return;
    }
    
    app.status = 'rejected';
    saveData();
    alert(`已拒绝 ${escapeHtml(app.user.name)} 的申请`);
    renderMyPosts();
  }
}

// 保存匹配记录
function saveMatchRecord(matchedUser, author, post) {
  const matchRecord = {
    id: Date.now(),
    matchedUser: matchedUser,
    author: author,
    post: post,
    matchTime: new Date().toISOString()
  };
  
  // 为申请者保存
  const applicantMatches = JSON.parse(localStorage.getItem('applicantMatches') || '[]');
  applicantMatches.push(matchRecord);
  localStorage.setItem('applicantMatches', JSON.stringify(applicantMatches));
  
  // 为发布者保存
  const authorMatches = JSON.parse(localStorage.getItem('authorMatches') || '[]');
  authorMatches.push(matchRecord);
  localStorage.setItem('authorMatches', JSON.stringify(authorMatches));
  
  // 保存最近匹配（用于成功页面）
  localStorage.setItem('lastMatch', JSON.stringify(matchRecord));
}

// 打开申请弹窗
function openApplyModal(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) {
    alert('帖子不存在');
    return;
  }
  
  // 权限检查：不能申请自己的帖子
  if (isPostAuthor(post)) {
    alert('不能申请自己发布的帖子');
    return;
  }
  
  // 状态检查：已匹配或已过期不能申请
  const status = getPostStatus(post);
  if (status === 'matched' || status === 'expired') {
    alert(status === 'expired' ? '该帖子已结束' : '该帖子已匹配成功');
    return;
  }
  
  // 检查是否已申请
  if (hasApplied(postId)) {
    const app = getUserApplication(postId);
    alert(`您已申请该帖子，状态：${getStatusLabel(app.status)}`);
    return;
  }
  
  // 创建弹窗
  const modal = document.createElement('div');
  modal.className = 'apply-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <h3>申请参与「${escapeHtml(post.title)}」</h3>
      <p class="modal-desc">请简单介绍一下自己，让对方了解你</p>
      <textarea id="applyIntro" placeholder="例如：我也是XX专业的，想找个学习搭子一起进步！" rows="4"></textarea>
      <div class="modal-actions">
        <button class="btn cancel-btn close-modal">取消</button>
        <button class="btn submit-btn submit-application" data-post-id="${postId}">提交申请</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 关闭弹窗
function closeModal() {
  const modal = document.querySelector('.apply-modal');
  if (modal) {
    modal.remove();
  }
}

// 提交申请
function submitApplication(postId) {
  const intro = document.getElementById('applyIntro')?.value.trim();
  
  if (!intro) {
    alert('请填写自我介绍');
    return;
  }
  
  if (intro.length < 5) {
    alert('自我介绍至少需要5个字符');
    return;
  }
  
  // 创建申请
  const newApplication = {
    id: Date.now(),
    postId: postId,
    user: currentUser,
    intro: intro,
    status: 'pending',
    applyTime: new Date().toISOString()
  };
  
  applications.push(newApplication);
  saveData();
  
  closeModal();
  alert('申请提交成功！等待对方审核');
  renderAvailablePosts();
  renderMyPosts();
}

// 处理发布表单提交
function handlePostSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('postTitle').value.trim();
  const category = document.getElementById('postCategory').value;
  const location = document.getElementById('postLocation').value.trim();
  const time = document.getElementById('postDate').value;
  const description = document.getElementById('postDesc').value.trim();
  
  // 验证
  if (!title) {
    alert('请输入活动标题');
    document.getElementById('postTitle').focus();
    return;
  }
  
  if (title.length > 50) {
    alert('标题不能超过50个字符');
    document.getElementById('postTitle').focus();
    return;
  }
  
  if (!category) {
    alert('请选择活动类型');
    document.getElementById('postCategory').focus();
    return;
  }
  
  if (!location) {
    alert('请输入活动地点');
    document.getElementById('postLocation').focus();
    return;
  }
  
  if (location.length > 50) {
    alert('地点不能超过50个字符');
    document.getElementById('postLocation').focus();
    return;
  }
  
  if (!time) {
    alert('请选择活动时间');
    document.getElementById('postDate').focus();
    return;
  }
  
  // 检查时间是否早于当前时间
  if (new Date(time) < new Date()) {
    alert('活动时间不能早于当前时间');
    document.getElementById('postDate').focus();
    return;
  }
  
  // 创建帖子
  const newPost = {
    id: Date.now(),
    author: currentUser,
    title: title,
    category: category,
    location: location,
    time: time,
    description: description,
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  posts.push(newPost);
  saveData();
  
  alert('发布成功！');
  window.location.href = 'home.html';
}

// 取消帖子
function cancelPost(postId) {
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    alert('帖子不存在');
    return;
  }
  
  if (!isPostAuthor(post)) {
    alert('操作失败：您没有权限取消此帖子');
    return;
  }
  
  const status = getPostStatus(post);
  if (status === 'matched' || status === 'expired') {
    alert('操作失败：该帖子已结束，无法取消');
    return;
  }
  
  if (!confirm('确定要取消该帖子吗？取消后将无法恢复。')) {
    return;
  }
  
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex > -1) {
    posts.splice(postIndex, 1);
  }
  
  const relatedApps = applications.filter(a => a.postId === postId);
  relatedApps.forEach(app => {
    const appIndex = applications.findIndex(a => a.id === app.id);
    if (appIndex > -1) {
      applications.splice(appIndex, 1);
    }
  });
  
  saveData();
  alert('帖子已取消');
  renderMyPosts();
  renderAvailablePosts();
}

// 打开取消帖子弹窗确认
function openCancelConfirm(postId) {
  cancelPost(postId);
}

// 保存数据
function saveData() {
  localStorage.setItem('posts', JSON.stringify(posts));
  localStorage.setItem('applications', JSON.stringify(applications));
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
