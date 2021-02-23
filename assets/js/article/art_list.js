$(function () {
  var layer = layui.layer;
  var form = layui.form;
  var laypage = layui.laypage;

  // 定义美化时间的过滤器
  template.defaults.imports.dataFormat = function (date) {
    const dt = new Date(date);

    var y = dt.getFullYear();
    var m = padZero(dt.getMonth() + 1);
    var d = padZero(dt.getDate());

    var hh = padZero(dt.getHours());
    var mm = padZero(dt.getMinutes());
    var ss = padZero(dt.getSeconds());

    return y + '-' + m + '-' + d + '  ' + hh + ':' + mm + ':' + ss;
  }

  // 定义补零的函数
  function padZero(n) {
    return n > 9 ? n : '0' + n;
  }

  // 定义一个查询的参数对象，将来请求数据的时候
  // 需要将亲贵参数对象提交到服务器
  var q = {
    pagenum: 1, // 页码值，默认请求第一页的数据
    pagesize: 2, // 每页显示几条数据，默认每页显示2条
    cate_id: '', // 文章分类的 Id
    state: '' // 文章的发布状态
  }

  initTable();
  initCate();

  // 获取文章列表数据的方法
  function initTable() {
    $.ajax({
      method: 'GET',
      url: '/my/article/list',
      data: q,
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('获取文章列表失败！')
        }
        // 使用模板引擎渲染页面的数据
        var htmlStr = template('tpl-table', res)
        $('tbody').html(htmlStr)
        // 调用渲染分页的方法
        renderPage(res.total);
      }
    })
  }

  // 初始化文章分类的方法
  function initCate() {
    $.ajax({
      method: 'GET',
      url: '/my/article/cates',
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('获取分类数据失败！')
        }

        // 调用模板引擎渲染分类的可选项
        var htmlStr = template('tpl-cate', res);
        $('[name=cate_id]').html(htmlStr);
        // 通知 layui 重新渲染表单区域的 UI 结构
        form.render();
      }
    })
  }

  // 为筛选表单绑定 submit 事件
  $('#form-search').on('submit', function (e) {
    e.preventDefault()
    // 获取表单中选中项的值
    var cate_id = $('[name=cate_id]').val()
    var state = $('[name=state]').val()
    // 为查询参数对象 q 中对应的属性赋值
    q.cate_id = cate_id
    q.state = state
    // 根据最新的筛选条件，重新渲染表格的数据
    initTable()
  })

  // 定义渲染分页的方法
  function renderPage(total) {
    // 调用 laypage.render() 方法来渲染分页的结构
    laypage.render({
      elem: 'pageBox', // 分页容器的Id 注意，这里的 test1 是 ID，不用加 # 号
      count: total, // 总数据总数，从服务端得到
      limit: q.pagesize, // 每页显示几条数据
      curr: q.pagenum, // 设置默认被选中的分页
      layout: [ 'count', 'limit', 'prev', 'page', 'next', 'skip' ],
      limits: [ 1, 2, 3, 5, 10 ],

      // 分页发生切换的时候，触发 jump 回调
      // 触发 jump 回调的方式有两种
      // 1. 点击页面的时候，会触发 jump 回调
      // 2. 只要调用了 laypage.render() 方法，就会触发 jump 回调
      jump: function (obj, first) {
        // 可以通过 first 的值，来判断是通过哪种方式，触发的 jump 回调
        // 如果 first 的值为 true，证明是方式2触发的
        // 否则就是方式1触发的

        // obj包含了当前分页的所有参数，比如：
        // console.log(obj.curr); //得到当前页，以便向服务端请求对应页的数据。
        // console.log(obj.limit); //得到每页显示的条数

        // 把最新的页码值，赋值到 q 这个查询参数对象中
        q.pagenum = obj.curr;
        // 把最新的条目数，赋值到 q 这个查询参数对象的 pagesize 属性中
        q.pagesize = obj.limit;
        // 首次不执行
        if (!first) {
          // 根据最新 q 获取对应的数据列表，并渲染表格
          initTable();
          //do something
        }
      }
    });
  }

  // 通过代理的形式，为删除按钮绑定点击事件处理函数
  $('tbody').on('click', '.btn-delete', function () {
    var len = $('.btn-delete').length;
    var id = $(this).attr('data-id');
    // 询问用户是否要删除数据
    layer.confirm('确认删除?', { icon: 3, title: '提示' }, function (index) {
      //do something
      $.ajax({
        method: 'GET',
        url: '/my/article/delete/' + id,
        success: function (res) {
          if (res.status !== 0) {
            return layer.msg("删除文章失败！")
          }
          layer.msg("删除文章成功！")
          // 当数据删除完成后，需要判断当前这一页中，是否还有剩余的数据
          // 如果没有剩余数据，则让页码值 -1 之后，
          // 再重新调用 initTable 方法
          if (len === 1) {
            // 如果 len 的值等于1，证明删除完毕之后，页面上就没有任何数据了

            // 页码值最小必须是 1
            q.pagenum = q.pagenum === 1 ? 1 : q.pagenum - 1;
          }
          initTable();
        }
      })
      layer.close(index);
    });
  })

  // 初始化富文本编辑器
  initEditor();

  // 1.1 初始化图片裁剪器
  var $image = $('#image')

  // 1.2 裁剪选项
  var options = {
    aspectRatio: 400 / 280,
    preview: '.img-preview'
  }

  // 1.3 初始化裁剪区域
  $image.cropper(options)

  // 通过代理的形式，为编辑按钮绑定点击事件处理函数
  $('tbody').on('click', '.btn-edit', function () {
    //$('#edit').css('display', 'block');
    $('#edit').show();
    $('#noEdit').hide();

    var id = $(this).attr('data-id');
    $.ajax({
      method: 'GET',
      url: '/my/article/' + id,
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('获取文章失败！')
        }
        form.val('form-pub', res.data);

        // 1.4 根据文件，创建对应的 URL 地址
        var newImgURL = 'http://ajax.frontend.itheima.net' + res.data.cover_img;

        // 1.5 为裁剪区域重新设置图片
        $image
          .cropper('destroy')      // 销毁旧的裁剪区域
          .attr('src', newImgURL)  // 重新设置图片路径
          .cropper(options);      // 重新初始化裁剪区域
      }
    })
  })

  // 2 更换裁剪的图片
  // 2.1 为选择封面的按钮，绑定点击事件处理函数
  $('#btnChooseImage').on('click', function () {
    $('#coverFile').click()
  })

  // 监听 coverFile 的 change 事件，获取用户选择的文件列表
  $('#coverFile').on('change', function (e) {
    // 2.2 获取到文件的列表数组
    var files = e.target.files;
    // 2.3 判断用户是否选择了文件
    if (files.length === 0) {
      return;
    }
    // 2.4 根据文件，创建对应的 URL 地址
    var newImgURL = URL.createObjectURL(files[0]);
    // 2.5 为裁剪区域重新设置图片
    $image
      .cropper('destroy')      // 销毁旧的裁剪区域
      .attr('src', newImgURL)  // 重新设置图片路径
      .cropper(options);      // 重新初始化裁剪区域
  })

  // 定义文章的发布状态
  var art_state = '已发布';

  // 为存为草稿按钮，绑定点击事件处理函数
  $('#btnSave2').on('click', function () {
    art_state = '草稿';
  })

  // 为表单绑定 submit 提交事件
  $('#form-pub').on('submit', function (e) {
    // 1. 阻止表单的默认提交行为
    e.preventDefault();
    // 2. 基于 form 表单，快速创建一个 FormDate 对象
    var fd = new FormData($(this)[0]);
    fd.forEach(function (k, v) {
      console.log(k, v)
    })
    // 3. 将文章的发布状态，存到 fd 中
    fd.append('state', art_state)

    // fd.forEach(function (v, k) {
    //   console.log(k, v)
    // })

    // 4. 将封面裁剪过后的图片，输出为一个文件对象
    $image
      .cropper('getCroppedCanvas', { // 创建一个 Canvas 画布
        width: 400,
        height: 280
      })
      .toBlob(function (blob) {
        // 将 Canvas 画布上的内容，转化为文件对象
        // 得到文件对象后，进行后续的操作

        // 5. 将文件对象，存储到 fd 中
        fd.append('cover_img', blob)
        // 6. 发起 ajax 数据请求
        publishArticle(fd)
      })
  })

  // 定义一个发布文章的方法
  function publishArticle(fd) {
    $.ajax({
      method: 'POST',
      url: '/my/article/edit',
      data: fd,
      // 注意: 如果向服务器提交的是 FormData 格式的数据，
      // 必须添加以下两个配置项
      contentType: false,
      processData: false,
      success: function (res) {
        if (res.status !== 0) {
          return layer.msg('修改文章失败！');
        }
        layer.msg('修改文章成功！');
        // 发表文章成功后 跳转到文章列表页面
        location.href = 'http://localhost:63342/04_%E5%89%8D%E5%90%8E%E7%AB%AF%E4%BA%A4%E4%BA%92%E9%98%B6%E6%AE%B5/%E5%A4%A7%E4%BA%8B%E4%BB%B6%E9%A1%B9%E7%9B%AE/article/art_list.html';
      }
    })
  }

})