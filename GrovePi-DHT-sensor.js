
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
const DHTDigitalSensor = GrovePi.sensors.DHTDigital;

module.exports = function(RED) {

    function GrovePiDHTSensor(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        let value = {
            temperature:undefined,
            humidity:undefined,
            heatIndex:undefined
        };
        const PRESENT_VALUE_TEXT = RED._("runtime.value");
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {
 
            // make UltrasonicDigitalSensor instantiated
            this.DHTsensor = new DHTDigitalSensor(
                config.din, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);

            // set data change event listener
            this.DHTsensor.on('change', function (res) {
                if (res) {
                    value.temperature = Number(res[0]);
                    value.humidity = Number(res[1]);
                    value.heatIndex = Number(res[2]);

                    msgSend();
                }
            });
            // start sennsor watch
            this.DHTsensor.watch(config.cycle * 1000);
   
        }
    
        this.on("input",function(msg) {
            if (msg.payload) msgSend();
        });

        this.on("close",function(done) {
            // stop Grovrpi sensor watch
            this.DHTsensor.stopWatch();
            // just in case
            setTimeout(done, 300);
        });

        function msgSend () {

            if (!value) return;

            let msg = {payload:{}};
            msg.payload = value;
            // Send output message to the next Nodes
            node.send(msg);
            // make Node status to "sent"
            let statusTxt = RED._("runtime.sent");
            node.status({fill:"green", shape:"dot",
                text: PRESENT_VALUE_TEXT + value.temperature + ":" + statusTxt});
        }
    };

    RED.nodes.registerType("GrovePi-DHT-sensor",GrovePiDHTSensor);
}
