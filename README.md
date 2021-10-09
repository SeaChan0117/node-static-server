# node-static-server

> 一个基于 node 开发的简易静态文件服务，可用于浏览器浏览指定文件夹下的文件

## 使用
* `git clone https://github.com/SeaChan0117/node-static-server.git` 拉取代码
* `cd node-static-server` 进入项目
* `npm i` 安装依赖
* `npm link` 将 cli 命令 link 到全局，后续可使用 `cs-serve` 命令启动服务
* `cs-serve --help` 查看帮助
* 直接运行 `cs-serve` 程序默认读取了该项目的的根目录，启动服务 3000
    eg: 参考帮助，执行 `cs-serve -p 4000 -d c:` 则为启动服务 4000 端口，打开 C 盘下的文件目录

