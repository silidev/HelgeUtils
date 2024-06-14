import {HelgeUtils} from './HelgeUtils.js'
import suppressUnusedWarning = HelgeUtils.suppressUnusedWarning

/**
* Source:
* https://stackoverflow.com/questions/17528749/semaphore-like-queue-in-javascript
*/
export class Queue {
  private running: any
  private readonly autorun: boolean
  private queue: any[]

  constructor(autorun = true, queue = []) {
    this.running = false
    this.autorun = autorun
    this.queue = queue
  }

  //ts-ignore
  add(cb: (arg0: any) => any) {
    this.queue.push((value: any) => {
      const finished = new Promise((resolve, reject) => {
        const callbackResponse = cb(value)

        if (callbackResponse !== false) {
          resolve(callbackResponse)
        } else {
          reject(callbackResponse)
        }
      })
      finished.then(this.dequeue.bind(this), (() => {
      }))
    })

    if (this.autorun && !this.running) {
      // @ts-expect-error
      this.dequeue()
    }
    return this
  }

  dequeue(value: any) {
    this.running = this.queue.shift()
    if (this.running) {
      this.running(value)
    }
    return this.running
  }

  get next() {
    return this.dequeue
  }
}

// noinspection JSUnusedLocalSymbols
const test = () => {
  // passing false into the constructor makes it so
  // the queue does not start till we tell it to
  const q = new Queue(false).add(function () {
    //start running something
  }).add(function () {
    //start running something 2
  }).add(function () {
    //start running something 3
  })

  setTimeout(function () {
    // start the queue
    // @ts-expect-error
    q.next()
  }, 2000)
}
suppressUnusedWarning(test)

