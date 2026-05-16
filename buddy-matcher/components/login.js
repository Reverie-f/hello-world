// 用户数据存储
let users = JSON.parse(localStorage.getItem('users')) || [];

// 获取表单元素
const loginForm = document.getElementById('loginForm');
const studentIdInput = document.getElementById('studentId');
const nameInput = document.getElementById('name');
const classNameInput = document.getElementById('className');
const majorInput = document.getElementById('major');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const majorGroup = document.getElementById('majorGroup');
const nameGroup = document.getElementById('nameGroup');
const classNameGroup = document.getElementById('classNameGroup');

let isRegisterMode = false;

// 切换登录/注册模式
toggleModeBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  
  if (isRegisterMode) {
    formTitle.textContent = '注册账号';
    submitBtn.textContent = '注册';
    toggleModeBtn.textContent = '已有账号？去登录';
    confirmPasswordGroup.style.display = 'flex';
    majorGroup.style.display = 'flex';
    nameGroup.style.display = 'flex';
    classNameGroup.style.display = 'flex';
    passwordInput.placeholder = '设置密码（至少6位）';
  } else {
    formTitle.textContent = '搭子匹配墙';
    submitBtn.textContent = '登录';
    toggleModeBtn.textContent = '没有账号？去注册';
    confirmPasswordGroup.style.display = 'none';
    majorGroup.style.display = 'none';
    nameGroup.style.display = 'none';
    classNameGroup.style.display = 'none';
    passwordInput.placeholder = '请输入密码';
  }
});

// 表单提交
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (isRegisterMode) {
    handleRegister();
  } else {
    handleLogin();
  }
});

// 处理注册
function handleRegister() {
  const studentId = studentIdInput.value.trim();
  const name = nameInput.value.trim();
  const className = classNameInput.value.trim();
  const major = majorInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  
  // 验证学号
  if (!studentId) {
    alert('请输入学号');
    studentIdInput.focus();
    return;
  }
  
  if (!/^\d{10}$/.test(studentId)) {
    alert('学号必须是10位数字');
    studentIdInput.focus();
    return;
  }
  
  // 验证姓名
  if (!name) {
    alert('请输入姓名');
    nameInput.focus();
    return;
  }
  
  if (name.length > 20) {
    alert('姓名不能超过20个字符');
    nameInput.focus();
    return;
  }
  
  // 验证班级
  if (!className) {
    alert('请输入班级');
    classNameInput.focus();
    return;
  }
  
  if (className.length > 30) {
    alert('班级不能超过30个字符');
    classNameInput.focus();
    return;
  }
  
  // 验证专业
  if (!major) {
    alert('请输入专业');
    majorInput.focus();
    return;
  }
  
  if (major.length > 30) {
    alert('专业不能超过30个字符');
    majorInput.focus();
    return;
  }
  
  // 验证密码
  if (!password) {
    alert('请输入密码');
    passwordInput.focus();
    return;
  }
  
  if (password.length < 6) {
    alert('密码至少需要6位字符');
    passwordInput.focus();
    return;
  }
  
  if (password.length > 20) {
    alert('密码不能超过20个字符');
    passwordInput.focus();
    return;
  }
  
  // 验证确认密码
  if (password !== confirmPassword) {
    alert('两次输入的密码不一致');
    confirmPasswordInput.focus();
    return;
  }
  
  // 检查学号是否已注册
  const existingUser = users.find(u => u.studentId === studentId);
  if (existingUser) {
    alert('该学号已注册，请直接登录');
    switchToLoginMode();
    return;
  }
  
  // 创建新用户
  const newUser = {
    studentId,
    name,
    className,
    major,
    password,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // 自动登录
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  
  alert('注册成功！欢迎加入搭子匹配墙');
  window.location.href = 'home.html';
}

// 处理登录
function handleLogin() {
  const studentId = studentIdInput.value.trim();
  const password = passwordInput.value.trim();
  
  // 验证学号
  if (!studentId) {
    alert('请输入学号');
    studentIdInput.focus();
    return;
  }
  
  if (!/^\d{10}$/.test(studentId)) {
    alert('学号必须是10位数字');
    studentIdInput.focus();
    return;
  }
  
  // 验证密码
  if (!password) {
    alert('请输入密码');
    passwordInput.focus();
    return;
  }
  
  // 查找用户
  const user = users.find(u => u.studentId === studentId);
  
  if (!user) {
    alert('该学号未注册，请先注册');
    switchToRegisterMode();
    return;
  }
  
  // 验证密码
  if (user.password !== password) {
    alert('密码错误，请重新输入');
    passwordInput.focus();
    passwordInput.value = '';
    return;
  }
  
  // 登录成功
  localStorage.setItem('currentUser', JSON.stringify(user));
  alert('登录成功！');
  window.location.href = 'home.html';
}

// 切换到登录模式
function switchToLoginMode() {
  isRegisterMode = false;
  formTitle.textContent = '搭子匹配墙';
  submitBtn.textContent = '登录';
  toggleModeBtn.textContent = '没有账号？去注册';
  confirmPasswordGroup.style.display = 'none';
  majorGroup.style.display = 'none';
  nameGroup.style.display = 'none';
  classNameGroup.style.display = 'none';
  passwordInput.placeholder = '请输入密码';
  confirmPasswordInput.value = '';
  studentIdInput.focus();
}

// 切换到注册模式
function switchToRegisterMode() {
  isRegisterMode = true;
  formTitle.textContent = '注册账号';
  submitBtn.textContent = '注册';
  toggleModeBtn.textContent = '已有账号？去登录';
  confirmPasswordGroup.style.display = 'flex';
  majorGroup.style.display = 'flex';
  nameGroup.style.display = 'flex';
  classNameGroup.style.display = 'flex';
  passwordInput.placeholder = '设置密码（至少6位）';
  studentIdInput.focus();
}
