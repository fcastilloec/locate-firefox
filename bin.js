#!/usr/bin/env node

const locateFirefox = require('./')

locateFirefox().then(function (r) {
  console.log(r)
})
