// 登录验证
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// XSS防护
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function checkLogin() {
  if (!currentUser) {
    // 使用replace防止后退访问
    window.location.replace('index.html');
    return false;
  }
  return true;
}

// 获取数据
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let applications = JSON.parse(localStorage.getItem('applications')) || [];

// 初始化页面
function initPage() {
  if (!checkLogin()) return;
  
  // 显示用户信息
  renderUserInfo();
  
  // 显示统计数据
  renderStats();
  
  // 显示申请记录
  renderMyApplications();
}

// 渲染用户信息
function renderUserInfo() {
  document.getElementById('profileName').textContent = escapeHtml(currentUser.name);
  document.getElementById('profileClass').textContent = escapeHtml(currentUser.className);
  document.getElementById('profileStudentId').textContent = escapeHtml(currentUser.studentId);
  document.getElementById('profileNameDetail').textContent = escapeHtml(currentUser.name);
  document.getElementById('profileMajor').textContent = escapeHtml(currentUser.major || '未填写');
  document.getElementById('profileClassDetail').textContent = escapeHtml(currentUser.className);
}

// 渲染统计数据
function renderStats() {
  const myPostsCount = posts.filter(p => p.author && p.author.studentId === currentUser.studentId).length;
  const myApplicationsCount = applications.filter(a => a.user && a.user.studentId === currentUser.studentId).length;
  const matchedCount = applications.filter(a => a.user && a.user.studentId === currentUser.studentId && a.status === 'approved').length;

  document.getElementById('myPostsCount').textContent = myPostsCount;
  document.getElementById('myApplicationsCount').textContent = myApplicationsCount;
  document.getElementById('matchedCount').textContent = matchedCount;
}

// 获取状态标签
function getStatusLabel(status) {
  switch(status) {
    case 'pending': return '待审核';
    case 'approved': return '已通过';
    case 'rejected': return '已拒绝';
    default: return status;
  }
}

// 获取状态样式类
function getStatusClass(status) {
  switch(status) {
    case 'pending': return 'status-pending';
    case 'approved': return 'status-approved';
    case 'rejected': return 'status-rejected';
    default: return '';
  }
}

// 获取分类颜色
function getCategoryColor(category) {
  switch(category){
    case '学习': return '#4A90E2';
    case '饭搭子': return '#F5A623';
    case '运动': return '#D0021B';
    default: return '#ccc';
  }
}

// 渲染我的申请记录
function renderMyApplications() {
  const appsList = document.getElementById('myApplications');
  const myApps = applications.filter(a => a.user && a.user.studentId === currentUser.studentId);
  
  if (myApps.length === 0) {
    appsList.innerHTML = '<p class="empty-tip">暂无申请记录</p>';
    return;
  }
  
  // 按申请时间倒序排列
  myApps.sort((a, b) => new Date(b.applyTime || 0) - new Date(a.applyTime || 0));
  
  appsList.innerHTML = myApps.map(app => {
    const post = posts.find(p => p.id === app.postId);
    const postTitle = post ? escapeHtml(post.title) : '活动已删除';
    const category = post ? post.category : '';
    const color = category ? getCategoryColor(category) : '#ccc';
    const statusClass = getStatusClass(app.status);
    const statusLabel = getStatusLabel(app.status);
    
    return `<div class="app-item">
      <div class="app-item-header">
        <strong>${postTitle}</strong>
        ${category ? `<span class="category-tag" style="background: ${color}">${escapeHtml(category)}</span>` : ''}
      </div>
      <div class="app-item-info">自我介绍: "${escapeHtml(app.intro)}"</div>
      <div class="app-item-footer">
        <span class="app-item-status ${statusClass}">${statusLabel}</span>
        ${app.applyTime ? `<span class="apply-time">申请时间: ${formatTime(app.applyTime)}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 退出登录
function logout() {
  if (confirm('确定要退出登录吗？')) {
    // 清除所有用户相关数据
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastMatch');
    
    // 使用replace防止后退访问
    window.location.replace('index.html');
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
