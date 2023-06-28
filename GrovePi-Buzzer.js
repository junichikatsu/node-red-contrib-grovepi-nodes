
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
const DigitalOut = GrovePi.sensors.DigitalOutput;

module.exports = function(RED) {

    function GrovePiBuzzer(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        let buzzer;

        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {
            buzzer = new DigitalOut(parseInt(config.din));
        }

        this.on("input",function(msg) {
            buzzer.turnOn();

            setTimeout(function(){
                buzzer.turnOff();
            }, (config.run_time * 1000));

            node.send(msg);
        });
    };

    RED.nodes.registerType("GrovePi-Buzzer",GrovePiBuzzer);
}
