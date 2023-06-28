
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
var Commands = GrovePi.commands;

const ON_VALUE = 1;
const OFF_VALUE = 0;

module.exports = function(RED) {

    function GrovePiDigitalIn(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        let button = OFF_VALUE;
        let preButton = OFF_VALUE;
        const PRESENT_VALUE_TEXT = RED._("runtime.value");
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {

            gpBoard.pinMode(parseInt(config.din), 'input');

            this.intervalId = setInterval(function () {
                var writeRet = gpBoard.writeBytes(Commands.dRead.concat([parseInt(config.din), Commands.unused, Commands.unused]))
                if (writeRet) {
                    gpBoard.wait(100);
                    preButton = button;
                    let bytes = gpBoard.readBytes();
                    if( bytes ){
                        if( bytes[0] !== 255)   button = bytes[0];
                        if( bytes[1] !== 255)   button = bytes[1];
                        if (preButton !== button) msgSend();
                    }
                }
            }, 200)

        }

        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });
        // called ato deploy timing
        this.on("close",function(done) {
            clearInterval(this.intervalId);
            setTimeout(done, 300);
        });

        function msgSend () {
            let msg = {payload:0};
            msg.payload = button;
            // send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            let statusTxt = RED._("runtime.sent");
            let value = (button === ON_VALUE)? "on": "off";
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + value + ":" + statusTxt});
        }
    };

    RED.nodes.registerType("GrovePi-DigitalIn",GrovePiDigitalIn);
}
