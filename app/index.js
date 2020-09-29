/*
 * Entry point for the watch app
 */
import document from "document";
import { HeartRateSensor } from "heart-rate";
import { Accelerometer } from "accelerometer";
import { battery } from "power";
import * as messaging from "messaging";
import { memory } from "system";
import { display } from "display";
import { me } from "appbit";

display.autoOff = false;
console.log('Current setting for app timeout: ' + me.appTimeoutEnabled);
// me.appTimeoutEnabled = false;
// console.log('Current setting for app timeout: '+ me.appTimeoutEnabled);
console.log("JS memory: " + memory.js.used + "/" + memory.js.total);
var start = false;
var period = 1000;


// console.log("Max message size=" + peerSocket.MAX_MESSAGE_SIZE);

// console.log(Math.floor(battery.chargeLevel) + "%");
messaging.peerSocket.onerror = function (err) {
  // Handle any errors
  console.log("error:" + err);
  // me.exit();
}

messaging.peerSocket.onmessage = function (evt) {
  if (evt.data != 'Stop') {
    console.log('Got a message' + evt.data);
    period = Number(evt.data);
    console.log('Period is: ' + period);
    if (period instanceof Number) {
      console.log('Yes it is');
    }
    start = true;
    if (Accelerometer && start) {
      // sampling at 1Hz (once per second)
      const accel = new Accelerometer({ frequency: 2 });
      var accl = {x:0,y:0,z:0};
      accel.addEventListener("reading", () => {
        console.log(
          `ts: ${accel.timestamp}, \
           x: ${accel.x}, \
           y: ${accel.y}, \
           z: ${accel.z}`
        );
        accl.x = accel.x,accl.y = accel.y, accl.z = accel.z;
      });
      setInterval(() => {
        messaging.peerSocket.send(JSON.stringify({ timestamp: new Date().getTime(), battery: battery.chargeLevel, accel: accl, av_Mem: memory.js.used, totalMemory: memory.js.total }));
        console.log("Message Sent");
      }, period);
      accel.start();
    }
    // if (HeartRateSensor && start) {
    //   const hrm = new HeartRateSensor();
    //   var hr = 0;
    //   hrm.addEventListener("reading", () => {
    //     console.log(`Current heart rate: ${hrm.heartRate}`);
    //     // messaging.peerSocket.onopen = function() {
    //       hr = hrm.heartRate;
    //   });
      // setInterval(() => {
      //   messaging.peerSocket.send(JSON.stringify({ timestamp: new Date().getTime(), battery: battery.chargeLevel, heartRate: hr, av_Mem: memory.js.used, totalMemory: memory.js.total }));
      //   console.log("Message Sent");
      // }, period);
      // hrm.start();
    // }
  } else {
    me.exit();
  }

}

