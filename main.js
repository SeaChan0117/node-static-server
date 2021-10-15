const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs').promises
const {createReadStream} = require('fs')
const mime = require('mime')
const ejs = require('ejs')
const {promisify} = require('util')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItTocDoneRight = require('markdown-it-toc-done-right')

const mdOption = {
    html: false,
    xhtmlOut: true,
    typographer: true
}

const markdownItAnchorOption = {permalink: true, permalinkBefore: true, permalinkSymbol: '§'}
const markdownItTocDoneRightOption = {
    containerClass: 'toc',
    containerId: 'toc',
    listType: 'ul',
    listClass: 'listClass',
    itemClass: 'itemClass',
    linkClass: 'linkClass'
}
const md = require("markdown-it")(mdOption)

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
                await this.fileHandle(req, res, absPath)
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

                this.beforePath = pathname

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

    async fileHandle(req, res, absPath) {
        res.statusCode = 200
        if (absPath.endsWith('.md')) {
            await this.readMdFile(req, res, absPath)
        } else {
            res.setHeader('Content-Type', `${mime.getType(absPath)}; charset=utf-8`)
            createReadStream(absPath).pipe(res)
        }
    }

    async readMdFile (req, res, absPath) {
        const data = await fs.readFile(absPath)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        markdownItTocDoneRightOption.callback = (html, ast) => {
            // 缓存 md 解析出的左侧导航栏
            this.mdMenu = html
        }
        // 保证只加载一次插件
        if (!this.mdPlugins) {
            md.use(markdownItAnchor, markdownItAnchorOption)
                .use(markdownItTocDoneRight, markdownItTocDoneRightOption)
            this.mdPlugins = true
        }
        const htmlForMd = md.render(data.toString('utf-8'))
        const styles = await fs.readFile(path.join(__dirname, '/assets/github-markdown.css'))
        const renderFile = promisify(ejs.renderFile)
        console.log('---', this.beforePath)
        const ret = await renderFile(path.resolve(__dirname, 'md-render.html'), {
            mdMenu: this.mdMenu,
            mdData: htmlForMd,
            beforePath: this.beforePath || '',
            stylesStr: styles.toString('utf-8')
        })

        res.end(ret)
    }

    errHandle(req, res, e) {
        console.log(e)
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end('Not found')
    }
}

module.exports = Server
