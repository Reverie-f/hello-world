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

// 初始化页面
function initPage() {
  if (!checkLogin()) return;
  
  const lastMatch = JSON.parse(localStorage.getItem('lastMatch'));
  
  if (!lastMatch) {
    document.getElementById('matchPostTitle').textContent = '暂无匹配信息';
    return;
  }
  
  // 显示匹配信息
  document.getElementById('matchPostTitle').textContent = escapeHtml(lastMatch.post.title);
  document.getElementById('matchPostCategory').textContent = escapeHtml(lastMatch.post.category);
  document.getElementById('matchPostLocation').textContent = escapeHtml(lastMatch.post.location);
  document.getElementById('matchPostTime').textContent = escapeHtml(lastMatch.post.time);
  
  // 判断当前用户是申请者还是发布者
  if (currentUser.studentId === lastMatch.matchedUser.studentId) {
    // 当前用户是申请者
    document.getElementById('matchUserName').textContent = escapeHtml(lastMatch.author.name);
    document.getElementById('matchUserClass').textContent = escapeHtml(lastMatch.author.className);
    document.getElementById('matchUserMajor').textContent = escapeHtml(lastMatch.author.major || '未填写');
    document.getElementById('matchUserStudentId').textContent = escapeHtml(lastMatch.author.studentId);
  } else {
    // 当前用户是发布者
    document.getElementById('matchUserName').textContent = escapeHtml(lastMatch.matchedUser.name);
    document.getElementById('matchUserClass').textContent = escapeHtml(lastMatch.matchedUser.className);
    document.getElementById('matchUserMajor').textContent = escapeHtml(lastMatch.matchedUser.major || '未填写');
    document.getElementById('matchUserStudentId').textContent = escapeHtml(lastMatch.matchedUser.studentId);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);
