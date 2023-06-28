
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
var i2c       = require('i2c-bus')
var fs          = require('fs')

var i2c0Path  = '/dev/i2c-0'
var i2c1Path  = '/dev/i2c-1'
var bus
var busNumber

var ADDRESS   = 0x53

module.exports = function(RED) {

    function GrovePiADXL345(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        let acc = {
            x:undefined,
            y:undefined,
            z:undefined
        };
        let statusTxt = "";
        const PRESENT_VALUE_TEXT = RED._("runtime.value");
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {

            if (fs.existsSync(i2c0Path)) {
                busNumber = 0
            } else if (fs.existsSync(i2c1Path)) {
                busNumber = 1
            } else busNumber = 0

            bus = i2c.openSync(busNumber)

            writeBytes([0x2d,0x00])
            writeBytes([0x2d,0x16])
            writeBytes([0x2d,0x08])
 
            this.intervalId = setInterval(function () {
                let res = readFrom(0x32,6);
                acc.x = res[1] * 256 + res[0];
                if(acc.x >= 32768)  acc.x = acc.x - 65536;
                acc.y = res[3] * 256 + res[2];
                if(acc.y >= 32768)  acc.y = acc.y - 65536;
                acc.z = res[5] * 256 + res[4];
                if(acc.z >= 32768)  acc.z = acc.z - 65536;
                msgSend();
            }, config.cycle * 1000)   
        }

        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });

        this.on("close",function(done) {
            clearInterval(this.intervalId);
            setTimeout(done, 300);
        });

        function msgSend () {
            let msg = { payload:{} };
            msg.payload = acc;
            // Send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            statusTxt = RED._("runtime.sent");
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + acc.x + ":" + statusTxt});
        }
        function readFrom(address,length) {
            writeBytes([address]);
            return readBytes(length);
        }
        function writeBytes(bytes) {
            var buffer = new Buffer.from(bytes)
            var ret = false
            try {
              var val = bus.i2cWriteSync(ADDRESS, buffer.length, buffer)
              ret = val > 0 ? true : false
            } catch (err) {
              ret = false
            } finally {
              return ret
            }
        }
        function readBytes(length) {
            var buffer = new Buffer.alloc(length)
            var ret = false
            try {
                var val = bus.i2cReadSync(ADDRESS, length, buffer)
                ret = val > 0 ? buffer : false
            } catch (err) {
                ret = false
            } finally {
                return ret
            }
        }
    };

    RED.nodes.registerType("GrovePi-ADXL345",GrovePiADXL345);
}
