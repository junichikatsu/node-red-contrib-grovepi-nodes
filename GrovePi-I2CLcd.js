
"use strict";

const GrovePi = require('@ia-cloud/node-grovepi').GrovePi;
var i2c       = require('i2c-bus')
var fs          = require('fs')

var i2c0Path  = '/dev/i2c-0'
var i2c1Path  = '/dev/i2c-1'
var bus
var busNumber

var LCD_ADDRESS   = 0x3E
var LED_ADDRESS   = 0x62

// color define
const WHITE         = 0
const RED           = 1
const GREEN         = 2
const BLUE          = 3

const REG_RED       = 0x04        // pwm2
const REG_GREEN     = 0x03        // pwm1
const REG_BLUE      = 0x02        // pwm0

const REG_MODE1     = 0x00
const REG_MODE2     = 0x01
const REG_OUTPUT    = 0x08

// commands
const LCD_CLEARDISPLAY  = 0x01
const LCD_RETURNHOME    = 0x02
const LCD_ENTRYMODESET  = 0x04
const LCD_DISPLAYCONTROL = 0x08
const LCD_CURSORSHIFT   = 0x10
const LCD_FUNCTIONSET   = 0x20
const LCD_SETCGRAMADDR  = 0x40
const LCD_SETDDRAMADDR  = 0x80

// flags for display entry mode
const LCD_ENTRYRIGHT    = 0x00
const LCD_ENTRYLEFT     = 0x02
const LCD_ENTRYSHIFTINCREMENT = 0x01
const LCD_ENTRYSHIFTDECREMENT = 0x00

// flags for display on/off control
const LCD_DISPLAYON     = 0x04
const LCD_DISPLAYOFF    = 0x00
const LCD_CURSORON      = 0x02
const LCD_CURSOROFF     = 0x00
const LCD_BLINKON       = 0x01
const LCD_BLINKOFF      = 0x00

// flags for display/cursor shift
const LCD_DISPLAYMOVE   = 0x08
const LCD_CURSORMOVE    = 0x00
const LCD_MOVERIGHT     = 0x04
const LCD_MOVELEFT      = 0x00

// flags for function set
const LCD_8BITMODE      = 0x10
const LCD_4BITMODE      = 0x00
const LCD_2LINE         = 0x08
const LCD_1LINE         = 0x00
const LCD_5x10DOTS      = 0x04
const LCD_5x8DOTS       = 0x00

const COLOR_TABLE = [
    [255, 255, 255],            // white
    [255, 0, 0],                // red
    [0, 255, 0],                // green
    [0, 0, 255],                // blue
    [255, 255, 0],              // yellow
    [255, 0, 255],              // magenta
    [0, 255, 255],              // cyan
    [0,0,0]                     // black
];

module.exports = function(RED) {

    function GrovePiI2CLcd(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        const gpNode = RED.nodes.getNode(config.grovepi);
        const gpBoard = gpNode.gpBoard;
        let backlight = 'white';

        // if grovepi exists and initialized
        if (gpBoard.checkStatus()) {

            if (fs.existsSync(i2c0Path)) {
                busNumber = 0
            } else if (fs.existsSync(i2c1Path)) {
                busNumber = 1
            } else busNumber = 0

            bus = i2c.openSync(busNumber)

            command(LCD_FUNCTIONSET | LCD_2LINE);

            command(LCD_DISPLAYCONTROL | LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF);
            
            command(LCD_CLEARDISPLAY);

            command(LCD_ENTRYMODESET | LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT);

            // backlight init
            setReg(REG_MODE1, 0);
            // set LEDs controllable by both PWM and GRPPWM registers
            setReg(REG_OUTPUT, 0xFF);
            // set MODE2 values
            // 0010 0000 -> 0x20  (DMBLNK to 1, ie blinky mode)
            setReg(REG_MODE2, 0x20);

            setColor(backlight);
        }

        this.on("input",function(msg) {
            let col = 0;
            let row = 0;
            if(msg.hasOwnProperty('col')) col = msg.col;
            if(msg.hasOwnProperty('row')) row = msg.row;
            if(msg.hasOwnProperty('color')) backlight = msg.color;
            setCursor(col, row);
            setColor(backlight);
            print(String(msg.payload).split(''));
            //if(typeof(msg.payload) === String)
            node.send(msg);
        });

        this.on("close",function(done) {
            setTimeout(done, 300);
        });

        function print(str) {
            str.forEach(element => write(element.charCodeAt(0)));
        }
        function command(value) {
            var bytes = [ 0x80 , value ];
            writeBytes(bytes);
        }
        function write(value) {
            var bytes = [ 0x40 , value ];
            writeBytes(bytes);
            return 1; // assume sucess
        }
        function setCursor(col, row) {

            col = (row == 0 ? col | 0x80 : col | 0xc0);
            var bytes = [ 0x80, col ];
        
            writeBytes(bytes);
        
        }
        function writeBytes(bytes) {
            var buffer = new Buffer.from(bytes)
            var ret = false
            try {
              var val = bus.i2cWriteSync(LCD_ADDRESS, buffer.length, buffer)
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
                var val = bus.i2cReadSync(LCD_ADDRESS, length, buffer)
                ret = val > 0 ? buffer : false
            } catch (err) {
                ret = false
            } finally {
                return ret
            }
        }
        function setColor(color) {
            let code = 0;
            if (color === 'red')    code = 1;
            if (color === 'green')  code = 2;
            if (color === 'blue')   code = 3;
            if (color === 'yellow') code = 4;
            if (color === 'magenta') code = 5;
            if (color === 'cyan')   code = 6;
            if (color === 'black')  code = 7;

            setRGB(COLOR_TABLE[code][0], COLOR_TABLE[code][1], COLOR_TABLE[code][2]);
        }
        function setRGB(r, g, b) {
            setReg(REG_RED, r);
            setReg(REG_GREEN, g);
            setReg(REG_BLUE, b);
        }
        function setReg(address,data) {
            var bytes = [address , data];
            var buffer = new Buffer.from(bytes)
            var ret = false
            try {
              var val = bus.i2cWriteSync(LED_ADDRESS, buffer.length, buffer)
              ret = val > 0 ? true : false
            } catch (err) {
              ret = false
            } finally {
              return ret
            }
        }
    };

    RED.nodes.registerType("GrovePi-I2CLcd",GrovePiI2CLcd);
}
