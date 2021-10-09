const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const mimie = require('mime')

const server = http.createServer((req, res) => {
    let {pathname, query} = url.parse(req.url)
    pathname = decodeURIComponent(pathname)
    let absPath = path.join(__dirname, pathname)
    fs.stat(absPath, (err, statObj) => {
        if (err) {
            res.statusCode = 404
            res.end('Not Found')
            return
        }
        if (statObj.isFile()) {
            fs.readFile(absPath, (err, data) => {
                res.setHeader('Content-ype', `${mimie.getType(absPath)};charset=utf-8`)
                res.end(data)
            })
        } else {
            fs.readFile(path.join(absPath, 'index.html'), (err, data) => {
                res.setHeader('Content-type', `${mimie.getType(path.join(absPath, 'index.html'))};charset=utf-8`)
                res.end(data)
            })
        }
    })
    // res.end('111')
})

server.listen(1080, () => {
    console.log('server is started')
})
