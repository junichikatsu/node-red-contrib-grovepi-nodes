
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
const AnalogIn = GrovePi.sensors.base.Analog;

module.exports = function(RED) {

    function GrovePiAnalogIn(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        const PRESENT_VALUE_TEXT = RED._("runtime.value");
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {

            gpBoard.pinMode(parseInt(config.din), 'input');

            this.Analog = new AnalogIn(parseInt(config.din));

            this.Analog.on('change', function (res) {
                msgSend(res);
            });

            this.Analog.watch(config.cycle * 1000);
        }

        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });
        // called ato deploy timing
        this.on("close",function(done) {
            // stop Grovrpi sensor watch
            this.Analog.stopWatch();
            // just in case
            setTimeout(done, 300);
        });

        function msgSend (value) {
            let msg = {payload:0};
            msg.payload = value;
            // send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            let statusTxt = RED._("runtime.sent");
            
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + value + ":" + statusTxt});
        }
    };

    RED.nodes.registerType("GrovePi-AnalogIn",GrovePiAnalogIn);
}
