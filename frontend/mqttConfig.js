// mqttConfig.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import init from "react_native_mqtt";

init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync: {},
});

const options = {
  host: "broker.emqx.io",
  port: 8083,
  path: "ttcntt3/mqleeee",
  id: "id_" + parseInt(Math.random() * 100000),
};

export const client = new Paho.MQTT.Client(options.host, options.port, options.path);

export const connect = () => {
  client.connect({
    onSuccess: () => {
      console.log("Connected to MQTT broker!");
    },
    useSSL: false,
    timeout: 5,
    onFailure: () => {
      console.log("Connection failed");
      connect();
      console.log("Reconnecting...");
    },
  });
};

export const publishTopic = (topic, message) => {
  const payload = JSON.stringify({ message: "turn on/off led", name: "led", status: message });
  var mqttMessage = new Paho.MQTT.Message(payload);
  mqttMessage.destinationName = topic;
  client.send(mqttMessage);
};

export const subscribeTopic = (topic, callback) => {
  client.subscribe(topic, { qos: 0 });
  client.onMessageArrived = (message) => {
    if (message.destinationName === topic) {
      callback(message);
    }
  };
};
