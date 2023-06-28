
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
const AccelerationSensor = GrovePi.sensors.AccelerationI2C;

module.exports = function(RED) {

    function GrovePiAccelerationSensor(config) {

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
 
            this.accelerationSensor = new AccelerationSensor();

            // set data change event listener
            this.accelerationSensor.on('change', function (res) {
                if (res) {
                    acc.x = res[0];
                    acc.y = res[1];
                    acc.z = res[2];

                    msgSend();
                }
            });
            // start sennsor watch
            this.accelerationSensor.watch(config.cycle * 1000);
   
        }

        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });

        this.on("close",function(done) {
            // stop Grovrpi sensor watch
            this.accelerationSensor.stopWatch();
            // just in case
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
    };

    RED.nodes.registerType("GrovePi-Acceleration-sensor",GrovePiAccelerationSensor);
}
