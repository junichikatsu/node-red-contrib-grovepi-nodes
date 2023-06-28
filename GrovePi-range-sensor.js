
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
const UltrasonicDigitalSensor = GrovePi.sensors.UltrasonicDigital;

module.exports = function(RED) {

    function GrovePiRangeSensor(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        let range = undefined;
        let preRange = undefined;
        let statusTxt = "";
        const PRESENT_VALUE_TEXT = RED._("runtime.value");
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {
 
            // make UltrasonicDigitalSensor instantiated
            this.ultrasonicSensor = new UltrasonicDigitalSensor(parseInt(config.din));

            // set data change event listener
            this.ultrasonicSensor.on('change', function (res) {

                if (res) {
                    res = parseInt(res);
                    // update measured value and status on node
                    statusTxt = RED._("runtime.waiting");
                    node.status({fill:"green", shape:"dot",
                    text: PRESENT_VALUE_TEXT + res + ": " + statusTxt});
                    
                    preRange = range;
                    range = res;

                    if (preRange !== range) msgSend();
                }
            });
            // start sennsor watch
            this.ultrasonicSensor.watch(config.cycle * 1000);
   
        }

        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });

        this.on("close",function(done) {
            // stop Grovrpi sensor watch
            this.ultrasonicSensor.stopWatch();
            // just in case
            setTimeout(done, 300);
        });

        function msgSend () {

            if (!range) return;

            let msg = { payload: 0 };
            msg.payload = range;
            // Send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            statusTxt = RED._("runtime.sent");
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + range + ":" + statusTxt});
        }
    };

    RED.nodes.registerType("GrovePi-range-sensor",GrovePiRangeSensor);
}
