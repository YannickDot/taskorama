/**
* @Author: Yannick Spark <yannickdot>
* @Date:   2017-02-09T11:28:40+01:00
* @Last modified by:   yannickdot
* @Last modified time: 2017-02-09T11:52:19+01:00
*/

// @flow

import Task from './index.js'

Task.fetch = function(url: string, options: any = {}): TaskInstance {
  return Task(function(reject, resolve) {
    var xhr = new XMLHttpRequest()
    xhr.open(options.method || 'get', url, true)
    xhr.onerror = reject
    xhr.onload = () => {
      if (xhr.status == 200) {
        resolve({
          json: () => JSON.parse(xhr.responseText),
          text: () => xhr.responseText,
          xml: () => xhr.responseXML,
          blob: () => new Blob([xhr.response]),
          xhr: xhr,
          statusText: xhr.statusText,
          status: xhr.status,
          url: url
        })
      } else {
        reject(status)
      }
    }
    xhr.send()

    return { cancel: () => xhr.abort() }
  })
}

function createVars(context) {
  let str = Object.keys(context)
    .reduce((acc, key) => {
      acc.push(`const ${key} = ${JSON.stringify(context[key])};`)
      return acc
    }, [])
    .join('\n')
  return str
}

Task.runInWorker = function(workerFn, context) {
  return Task(function(reject, resolve) {
    const workerCode = workerFn.toString()
    const callback = workerCode.substring(
      workerCode.indexOf('(') + 1,
      workerCode.indexOf(')')
    )
    const callbackCode =
      (callback.length !== 0 && `const ${callback} = dispatchToMain`) || ''

    const code = `
  importScripts('https://unpkg.com/taskorama@2.0.0')
  const Task = taskorama.default
  const dispatchToMain = (x) => postMessage(JSON.stringify(x))
  ${callbackCode}
  ${createVars(context)}
  ${workerCode.substring(workerCode.indexOf('{') + 1, workerCode.lastIndexOf('}'))}`

    const blob = new Blob([code], { type: 'application/javascript' })
    const worker = new Worker(URL.createObjectURL(blob))
    let cancel = () => worker.terminate()

    worker.onmessage = function(msg) {
      resolve(JSON.parse(msg.data))
      worker.terminate()
    }

    worker.onerror = function(err) {
      reject(err)
      worker.terminate()
    }

    return { cancel }
  })
}

export default Task
