/*
 * Entry point for the companion app
 */
import * as messaging from "messaging";
import Paho from "./paho-mqtt";

import { me } from "companion";
// import * as tf from '@tensorflow/tfjs';
// import * as tsnode from '@tensorflow/tfjs-node';
// import { getCoordsDataType } from '@tensorflow/tfjs-core/dist/backends/webgl/shader_compiler';
 
// // Define a model for linear regression.
// const model = tf.sequential();
// model.add(tf.layers.dense({units: 1, inputShape: [1]}));
// console.log('Model created');
// console.log(model.toJSON());
// // Prepare the model for training: Specify the loss and the optimizer.
// model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
// console.log(tf.util.now());
// // Generate some synthetic data for training.
// const xs = tf.tensor2d([1, 2, 3, 4, 5, 6, 7, 8], [8, 1]);
// const ys = tf.tensor2d([1, 2, 3, 4, 5, 6, 7, 8], [8, 1]);
// console.log('Just before fitting');
// // Train the model using the data.
// var init2 = new Date();
// tf.loadLayersModel('http://192.168.1.101:4580/model.json').then((loadedModel)=>{
//               console.log('Second promise resolved');
//               console.log(loadedModel);
//               console.log('Model has been loaded');
//               console.log('Prediction2 '+loadedModel.predict(tf.tensor2d([1], [1, 1])).toString());
//               //loadedModel.predict(tf.tensor2d([1], [1, 1])).print();
//               //loadedModel.summary();
// });
// // model.fit(xs, ys, {epochs:500}).then(() => {
// //   console.log(new Date() - init2);
// //   // Use the model to do inference on a data point the model hasn't seen before:
// //   model.predict(tf.tensor2d([2], [1, 1])).print();
// // }).catch(error=>{
// //   console.log('Promise rejected');
// //   console.log(error);
// // })

console.log('Current wake interval for companion is: ' + me.wakeInterval);
// me.wakeInterval = 300000;
console.log('Current wake interval for companion is: ' + me.wakeInterval);

console.log("Companion code started");
var MQTT = Paho();
let init;
let timestamp, battery, av_Memory, totalMemory, heartRate;
var accel = {x:0,y:0,z:0};
var client = new MQTT.Client("192.168.1.70", 3000, "clientId");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({ onSuccess: onConnect,onFailure: function(){
  console.log('Failed to connect');
} });


// called when the client connects
function onConnect() {
  client.subscribe('watch2/ack');
  client.subscribe('watch2/start');
  client.subscribe('watch2/kill');
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  // messaging.peerSocket.onopen = function() {
    client.publish('watch2/connect', "Ready");
  // }
  
  // client.subscribe("World");

}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:" + responseObject.errorMessage);
  }
}

// called when a message arrives
function onMessageArrived(message) {
  if(message.destinationName == 'watch2/start'){
    console.log('Message arrived');
    console.log(JSON.stringify(message));
    var msg = JSON.parse(message.payloadString);
    var period = msg.frequency;
    if(msg.test_type == 'baseline'){
      messaging.peerSocket.send(period);
      console.log('baseline');
      messaging.peerSocket.onmessage = function (evt) {
        // Output the message to the console
        console.log(evt.data);
        // finalMessage = evt.data;
        init = new Date();
        var data = JSON.parse(evt.data);
        timestamp = data.timestamp, battery = data.battery, av_Memory = data.av_Mem, totalMemory = data.totalMemory, heartRate = data.heartRate;
        var message = new MQTT.Message(JSON.stringify({
          timestamp: timestamp, battery: battery, av_Memory: av_Memory, totalMemory: totalMemory,
          heartRate: heartRate, roundtrip_time: 0
        }));
        message.destinationName = "watch2/finaldata";
        client.send(message);
      }
    } else {
      messaging.peerSocket.send(period);
      console.log('Sent start period code to app');
      messaging.peerSocket.onmessage = function (evt) {
        // Output the message to the console
        console.log(evt.data);
        // finalMessage = evt.data;
  
        init = new Date();
        var data = JSON.parse(evt.data);
        // var ac = JSON.parse(data.accel);
        console.log(data.accel.x + ":" + data.accel.y);
        // timestamp = data.timestamp, battery = data.battery, av_Memory = data.av_Mem, totalMemory = data.totalMemory, heartRate = data.heartRate;
        timestamp = data.timestamp, battery = data.battery, av_Memory = data.av_Mem, totalMemory = data.totalMemory, accel.x = data.accel.x, accel.y = data.accel.y, accel.z = data.accel.z;
        var message = new MQTT.Message(JSON.stringify(data));
        // var message = new MQTT.Message("Hello");
        message.destinationName = "watch2/watchdata";
        console.log('Accel is now: ' + accel.x);
        client.send(message);
        
      }
    }   
  } else if(message.destinationName == 'watch2/ack'){
    console.log("onMessageArrived:" + message.payloadString);
    console.log('init is: '+ init);
    var finaldate = new Date() - init;
    // var message = new MQTT.Message(JSON.stringify({
    //   timestamp: timestamp, battery: battery, av_Memory: av_Memory, totalMemory: totalMemory,
    //   heartRate: heartRate, roundtrip_time: finaldate
    // }));
    var message = new MQTT.Message(JSON.stringify({
      timestamp: timestamp, battery: battery, av_Memory: av_Memory, totalMemory: totalMemory,
      accel: accel, roundtrip_time: finaldate
    }));
    message.destinationName = "watch2/finaldata";
    client.send(message);
  } else if(message.destinationName == 'watch2/kill'){
    messaging.peerSocket.send('Stop');
  }

}

// }
