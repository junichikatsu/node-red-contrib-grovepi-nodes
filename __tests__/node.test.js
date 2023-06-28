const templateNode = require('../node')
const helper = require('node-red-node-test-helper')
helper.init(require.resolve('node-red'))

describe('private-template', () => {
  afterEach(() => {
    helper.unload()
    jest.resetModules()
  })

  test('Nomal', done => {
    const flow = [{ id: 'n1', type: 'private-template', name: 'test', wires: [['n2']] }, { id: 'n2', type: 'helper' }]
    helper.load(templateNode, flow, function () {
      const n1 = helper.getNode('n1')
      const n2 = helper.getNode('n2')

      n2.on('input', (msg) => {
        expect(msg.payload).toBe('test_template')
        done()
      })

      const msg = { payload: 'test' }
      n1.receive(msg)
    })
  })
})
