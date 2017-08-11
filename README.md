# apsjs - (A NodeJs Learning and Trying)
>
    2017年8月9日 星期三
    无外部依赖 nodeJs 程序开发

> [about the Joshua_Conero](https://www.conero.cn)
## install
```
    $ npm install apsjs
```
## 实现的功能
```
    $ apsjs --set                           内置的命令，自动获取配置项
    $ apsjs --build/b   file                编译file为js
            --build/b   .或--all/-all/      编译所有已经缓存的文件
            --build/b   --list/l            显示或有已经缓存的编译文件
            --build/b   --remove/rm=file    清除缓存中的文件
            --build/b   --remove=all        清除缓存中所有的文件
            --build/b   --add/a=file        新增缓存中的文件
```

### Html2js 模板编译器 (20170810)

    简单化nodejs 模板编译的实现


***模板语法格式***

    ```javascript    
    //1.
    <a href="{{ value }}">   =>  '<a href="'+ value +'">'
    {{ value }}

    //2.
    {{ data.key }} // => data['key']

    ```
### Cli-router Cli路由器的实现 (20170810)
[cli-router](./node_modules/cli-router)

## 版本信息
***v0.1.x***

    html2js     的实现

## npm - cli 程序开发指导

1.自定义一个npm脚本
 - 1.新建一个项目(在任何路径都可以);
 - 2.使用`npm init -y`初始化项目
 - 3.新建一个index.js文件,在文件的第一行添加 `#!/usr/bin/env node`
 - 4.在package文件中添加一个bin字段,bin字段是一个键值对,键名是生成的.cmd文件的名字,值是执行这个命名所要执行的脚本.
`"bin":{"lcopy":"./index.js"}`
 - 5.打开终端进入当前目录的根路径,执行`npm link`node会自动去全局路径创建cmd文   