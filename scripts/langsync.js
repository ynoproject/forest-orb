#!/usr/bin/env node

const en = require('../lang/en.json')
const { readdir, writeFile } = require('fs')
const path = require('path')

readdir(path.resolve(__dirname, '../lang'), (err, files) => {
  if (err) throw err;

  for (const file of files) {
    const data = require(`../lang/${file}`)
    if (file !== 'en.json')
      mergeInPlace(data, en)
    writeFile(path.resolve(__dirname, '../lang', file), JSON.stringify(data, undefined, 2), () => {
      console.log(`Updated ${file}`)
    })
  }
});

function mergeInPlace(dest, source) {
  for (const key in dest) {
    if (!(key in source))
      dest[key] = undefined
  }
  for (const key in source) {
    if (!(key in dest))
      dest[key] = source[key]
    else if (typeof dest[key] === 'object')
      mergeInPlace(dest[key], source[key])
  }
}
