// 注意: 每次调用 $.get() 或 $.post() 或 $.ajax() 的时候
// 会先调用 ajaxPrefilter 这个函数
// 在这个函数中， 可以拿到我们给Ajax提供的配置对象
$.ajaxPrefilter(function (options) {
  // 在发起真正的 Ajax 请求之前， 统一拼接请求的根路径
  options.url = 'http://ajax.frontend.itheima.net' + options.url;

  // 统一为有权限的接口，设置 headers 请求头
  if (options.url.indexOf('/my/') !== -1) {
    options.headers = {
      Authorization: localStorage.getItem('token') || ''
    }
  }

  // 全局统一挂载 complete 回调函数
  options.complete = function (res) {
    // 在 complete 回调函数中，可以使用 res.responseJSON 拿到服务器响应回来的数据
    if (res.responseJSON.status === 1 && res.responseJSON.message === "身份认证失败！") {
      // 1. 清空本地存储的 token
      localStorage.removeItem('token');
      // 2. 重新跳转到登录页面
      location.href = 'http://localhost:63342/04_%E5%89%8D%E5%90%8E%E7%AB%AF%E4%BA%A4%E4%BA%92%E9%98%B6%E6%AE%B5/%E5%A4%A7%E4%BA%8B%E4%BB%B6%E9%A1%B9%E7%9B%AE/login.html';
    }
  }
})
