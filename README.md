# apsjs - aps600rc - js-npm for
>
    2017年8月9日 星期三
    Joshua Conero

## 实现的功能

### Html2js 模板编译器 (20170810)

***模板语法格式***

    ```javascript    
    //1.
    <a href="{{ value }}">   =>  '<a href="'+ value +'">'
    {{ value }}

    //2.
    {{ data.key }} // => data['key']

    ```


## npm - cli 程序开发指导

1.自定义一个npm脚本
 - 1.新建一个项目(在任何路径都可以);
 - 2.使用`npm init -y`初始化项目
 - 3.新建一个index.js文件,在文件的第一行添加 `#!/usr/bin/env node`
 - 4.在package文件中添加一个bin字段,bin字段是一个键值对,键名是生成的.cmd文件的名字,值是执行这个命名所要执行的脚本.
`"bin":{"lcopy":"./index.js"}`
 - 5.打开终端进入当前目录的根路径,执行`npm link`node会自动去全局路径创建cmd文   