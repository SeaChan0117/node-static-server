#! /usr/bin/env node
const {program} = require('commander')

// program.option('-p --port', 'set server port')

// 配置信息
let options = {
    '-p --port <dir>': {
        'description': 'init server port',
        'example': 'cs-serve -p 3000'
    },
    '-d --directory <dir>': {
        'description': 'init server directory',
        'example': 'cs-serve -d c:'
    }
}

function initOptions(config, cb) {
    Object.entries(options).forEach(([key, val]) => {
        cb(key, val)
    })
}

initOptions(options, (cmd, val) => {
    program.option(cmd, val.description)
})

program.on('--help', () => {
    console.log('Example:')
    initOptions(options, (cmd, val) => {
        console.log(val.example)
    })
})

program.name('cs-serve')
const version = require('../package.json').version
program.version(version)

const cmdConfig = program.parse(process.argv)

// console.log(cmdConfig)
const Server = require('../main.js')
new Server(cmdConfig).start()
