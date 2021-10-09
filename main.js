const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs').promises
const {createReadStream} = require('fs')
const mime = require('mime')
const ejs = require('ejs')
const {promisify} = require('util')

function mergeConfig(config) {
    return {
        port: 3000,
        directory: process.cwd(),
        ...config
    }
}

class Server {
    constructor(config) {
        this.config = mergeConfig(config['_optionValues'])
    }

    start() {
        let server = http.createServer(this.serveHandle.bind(this))
        server.listen(this.config.port, () => {
            console.log('server is started')
        })
    }

    async serveHandle(req, res) {
        let {pathname} = url.parse(req.url)
        pathname = decodeURIComponent(pathname)
        let absPath = path.join(this.config.directory, pathname)

        try {
            let statObj = await fs.stat(absPath)
            if (statObj.isFile()) {
                // 文件
                this.fileHandle(req, res, absPath)
            } else {
                // 文件夹
                let dirs = await fs.readdir(absPath)
                dirs = dirs.map(item => ({
                    path: path.join(pathname, item),
                    dirs: Buffer.from(item, 'utf-8').toString(), // 中文转utf-8编码
                    ext: path.extname(item)
                }))
                const renderFile = promisify(ejs.renderFile)
                const parentPath = path.dirname(pathname)
                const ret = await renderFile(path.resolve(__dirname, 'template.html'), {
                    arr: dirs,
                    parent: pathname !== '/',
                    parentPath,
                    title: path.basename(absPath)
                })
                res.end(ret)
            }

        } catch (e) {
            this.errHandle(req, res, e)
        }
    }

    fileHandle(req, res, absPath) {
        res.statusCode = 200
        res.setHeader('Content-Type', `${mime.getType(absPath)}; charset=utf-8`)
        createReadStream(absPath).pipe(res)
    }

    errHandle(req, res, e) {
        console.log(e)
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end('Not found')
    }
}

module.exports = Server
