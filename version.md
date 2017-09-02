# 版本更新记录 - 2017年8月30日 星期三(Joshua Conero)

## 0.2.x


### 0.2.3 2017年9月2日 星期六

***$ build --build --cmake 命令实现***
    ```
        cmake.tpl.js 模式模块化动态引入模板编译
    ```
```javascript
    // cmake.tpl.js 模板实例化
    /**
    * 文本编译模板
    * 2017年9月2日 星期六
    */

    // 脚本开始
    $Script.Cmake = 'DczshzTpl.js'

    // 模板导入， 自动删除 模板中的 <apsjs> 标签， 且模板走位字符串返回.
    // cmake.tpl 还未定义时使用 apsjs 标签，自动生成 cmake.tpl.js 模板
    $Script.JsDlgView = require('./jsdlg.html')
    $Script.MainMxSrcView = require('./main_mx_src.html')

    $Script.Begin



    // 脚本模板

    var DczshzTpl = {
        JsDlgTpl: function(d){
            return $Script.TPL.JsDlgView;
        },
        MainSourceTpl: function(d){
            return $Script.TPL.MainMxSrcView;
        }
    };
```

### 0.2.2   2017年8月31日 星期四

***$ build --build --init 命令实现***
    ```
        新增 SuCompiler 编译器
        便实现 $ build --build --init  命名
    ```

***程序优化，增加帮助命令，以及命令完善***


### 0.2.1   2017年8月30日 星期三

***$ apsjs --fs --fs 命名的优化***
    ```
        采用 eval 函数生成 js 正则表达式对应，进行文件的正则匹配。
        以及显示命名运行后的简介报告
    ```