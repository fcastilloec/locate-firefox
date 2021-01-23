const fs = require('fs')
const exec = require('child_process').exec
const Promise = require('es6-promise').Promise
const userhome = require('userhome')
const queue = require('queue-async')

module.exports = function (cb) {
  return new Promise(function (resolve) {
    const finisher = cb || function (r) {
      resolve(r)
    }

    if (process.platform === 'darwin') {
      getOSXPath(finisher)
    } else if (process.platform === 'win32') {
      getWinPath(finisher)
    } else {
      getLinuxPath(finisher)
    }
  })
}

function getOSXPath (finisher) {
  const toExec = '/Contents/MacOS/Firefox'
  const regPath = '/Applications/Firefox.app' + toExec
  const altPath = userhome(regPath.slice(1))
  const mdFindCmd = 'mdfind \'kMDItemDisplayName == "Firefox" && kMDItemKind == Application\''

  queue(1)
    .defer(tryLocation, regPath, finisher)
    .defer(tryLocation, altPath, finisher)
    .defer(tryMd)
    .awaitAll(function () { finisher(null) })

  function tryMd (next) {
    exec(mdFindCmd, function (err, stdout) {
      if (err || !stdout) next()
      else finisher(stdout.trim() + toExec)
    })
  }
}

function getWinPath (finisher) {
  const winSuffix = '\\Mozilla Firefox\\firefox.exe'
  const prefixes = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)']
  ]

  queue(1)
    .defer(tryLocation, prefixes[0] + winSuffix, finisher)
    .defer(tryLocation, prefixes[1] + winSuffix, finisher)
    .defer(tryLocation, prefixes[2] + winSuffix, finisher)
    .awaitAll(function () { finisher(null) })
}

function getLinuxPath (finisher) {
  exec('which firefox', function (err, r) {
    if (err) throw err
    finisher(r.trim())
  })
}

function tryLocation (p, success, next) {
  fs.access(p, function (error) {
    if (error) next()
    else success(p)
  })
}
