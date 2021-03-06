import Task from '../src/index.js'

describe('Execution', function() {
  it('#fork should return an Execution', function() {
    var value = 42

    function computation(resolve, reject) {
      setTimeout(_ => resolve(value), 100)
    }

    var task = Task(computation)

    var execution = task.fork(err => {}, res => {})

    expect(execution).toBeDefined()
    expect(execution.cancel).toBeDefined()
    expect(execution.inspect).toBeDefined()

    var executionState = execution.getStatus()

    expect(executionState).toEqual({ status: 'pending', value: undefined })
  })
})

describe('Execution', function() {
  it('should handle resolved/rejected/cancelled states', function() {
    var value = 42
    var resolvingTask = Task.of(value)
    var execution1 = resolvingTask.fork(err => {}, res => {})
    var executionState1 = execution1.getStatus()

    expect(executionState1).toEqual({ status: 'resolved', value: value })

    var rejectingTask = Task.reject(value)
    var execution2 = rejectingTask.fork(err => {}, res => {})
    var executionState2 = execution2.getStatus()

    expect(executionState2).toEqual({ status: 'rejected', reason: value })

    var taskToCancel = Task.wait(100, value)
    var execution3 = taskToCancel.fork(err => {}, res => {})
    execution3.cancel()
    var executionState3 = execution3.getStatus()

    expect(executionState3).toEqual({ status: 'cancelled' })
  })
})

describe('Execution', function() {
  it('.promisify() should return a promise', function() {
    var value = 42
    var resolvingTask = Task.of(value)
    var execution1 = resolvingTask.fork(err => {}, res => {})
    var promise1 = execution1.promisify()

    promise1.then(v => {
      expect(v).toEqual(value)
    })

    var rejectingTask = Task.reject(value)
    var execution2 = rejectingTask.fork(err => {}, res => {})
    var promise2 = execution2.promisify()

    promise2.catch(err => {
      expect(err).toEqual(value)
    })

    var taskToCancel = Task.wait(100, value)
    var execution3 = taskToCancel.fork(err => {}, res => {})
    execution3.cancel()
    var promise3 = execution3.promisify()

    promise3.then(v => {
      expect(v).toEqual('cancelled')
    })
  })
})
