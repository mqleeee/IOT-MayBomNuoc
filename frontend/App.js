import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import init from "react_native_mqtt";
import axios from "axios"; // Import axios to call API

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

const client = new Paho.MQTT.Client(options.host, options.port, options.path);

const TurnOnOffLedScreen_Mqtt = ({ navigation }) => {
  const [msg, setMsg] = useState("No message");
  const [statusLed, setStatusLed] = useState("off");
  const [soilMoisture, setSoilMoisture] = useState("no data");
  const [timestamp, setTimeStamp] = useState("no data");
  const [time_schedule, setTime_Schedule] = useState([]); // State to store the schedule data
  const [threshold, setThreshold] = useState(800);
  const [timestart, setTimeStart] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState(""); // State to store the current timestamp
  const [autoActive, setAutoActive] = useState(false); // State to track auto activity

  useEffect(() => {
    connect();
    client.onMessageArrived = onMessageArrived;
    fetchTimeSchedule();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentTimestamp !== "" && soilMoisture !== "no data" && timestamp !== "no data" && autoActive ) {
      startAuto();
    }
  }, [currentTimestamp, soilMoisture, timestamp,autoActive]);

  const connect = () => {
    client.connect({
      onSuccess: () => {
        console.log("connect MQTT broker ok!");
        subscribeTopic();
      },
      useSSL: false,
      timeout: 5,
      onFailure: () => {
        console.log("connect fail");
        connect();
        console.log("reconnect ...");
      },
    });
  };

  const publishTopic = (deviceStatus) => {
    const s = '{"name":"led","status":"' + deviceStatus + '"}';
    var message = new Paho.MQTT.Message(s);
    message.destinationName = "ttcntt3/mqleeee/ledstatus";
    client.send(message);
  };

  const startAuto = () => {
    if (timestamp >= timestart && soilMoisture > threshold) {
      publishTopic("on");
      // Set a timeout to turn off the pump after 10 seconds
      setTimeout(() => {
        publishTopic("off");
        setAutoActive(false);
      }, 10000);  // 10000 milliseconds = 10 seconds
    } else {
      console.log(currentTimestamp);
      console.log(timestart);
    }
  };

  const subscribeTopic = () => {
    client.subscribe("ttcntt3/mqleeee/ledstatus", { qos: 0 });
    client.subscribe("ttcntt3/mqleeee/soil", { qos: 0 });
    client.subscribe("ttcntt3/mqleeee/time", { qos: 0 });
  };

  const onMessageArrived = async (message) => {
    console.log("onMessageArrived: " + message.payloadString);
    const topic = message.destinationName;
    const jsondata = JSON.parse(message.payloadString);

    if (topic === "ttcntt3/mqleeee/ledstatus") {
      console.log(jsondata.message);
      setStatusLed(jsondata.statusLed);
      setMsg(message.payloadString);
    }

    if (topic === "ttcntt3/mqleeee/soil") {
      setSoilMoisture(jsondata.soilMoisture);
    }
    if (topic === "ttcntt3/mqleeee/time")
      setTimeStamp(jsondata.timestamp);
  };

  const handleButtonOn = async () => {
    console.log("turn on led...");
    publishTopic("on");
  };

  const handleButtonOff = async () => {
    console.log("turn off led...");
    publishTopic("off");
  };

  const handleButtonAuto = async () => {
    console.log("turn on auto...");
    setAutoActive(true);
  };

  const fetchTimeSchedule = async () => {
    try {
      const response = await axios.get('http://localhost:3003/time_schedule'); // API call to get schedule data
      setTime_Schedule(response.data);
    } catch (error) {
      console.error("Error fetching time schedule data: ", error);
    }
  };

  const saveTimeSchedule = async () => {
    try {
      const response = await axios.post('http://localhost:3003/time_schedules', {
        timestart: timestart,
      });
      console.log("Time schedule saved:", response.data);
      fetchTimeSchedule(); // Refresh the schedule data
    } catch (error) {
      console.error("Error saving time schedule: ", error);
    }
  };

  return (
    <View style={styles.containerLedView}>
      <ScrollView>
        <View style={styles.header}>
          <Ionicons name="home" size={64} color="orange" />
          <Text style={styles.title}>Hệ Thống Bơm Nước Tự Động</Text>
          <Text style={styles.subTitle}>ON / OFF AUTO WATER</Text>
        </View>
        <View style={styles.main}>
          {statusLed === "on" ? (
            <View style={styles.boxLightOn}>
              <Ionicons name="water" size={64} color="blue" />
            </View>
          ) : (
            <View style={styles.boxLightOff}>
              <Ionicons name="water-outline" size={64} color="white" />
            </View>
          )}
          <View style={styles.controlGroup}>
            <TouchableOpacity
              style={[styles.btnOff, styles.btn]}
              onPress={() => handleButtonOff()}
            >
              <Text style={styles.btnText}>OFF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnOn, styles.btn]}
              onPress={() => handleButtonOn()}
            >
              <Text style={styles.btnText}>ON</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAuto, styles.btn]}
              onPress={() => handleButtonAuto()}
            >
              <Text style={styles.btnText}>Auto</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subTitle}>{msg}</Text>
          <Text style={styles.subTitle}>Soil Moisture: {soilMoisture}</Text>
          <Text style={styles.subTitle}>Timestamp: {timestamp}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter threshold"
            keyboardType="numeric"
            value={threshold.toString()}
            onChangeText={(value) => setThreshold(parseInt(value))}
          />
          <Text style={styles.subTitle}>Threshold: {threshold}</Text>
          <Text style={styles.title}>Time Schedule</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter start time"
            value={timestart}
            onChangeText={(value) => setTimeStart(value)}
          />
          <TouchableOpacity
            style={[styles.btnOn, styles.btn]}
            onPress={() => saveTimeSchedule()}
          >
            <Text style={styles.btnText}>Save Schedule</Text>
          </TouchableOpacity>
          {time_schedule.map((time, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.scheduleText}>Start: {time.timestart}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  containerLedView: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "orange",
    marginTop: 10,
  },
  subTitle: {
    fontSize: 18,
    color: "white",
    marginVertical: 5,
  },
  main: {
    alignItems: "center",
  },
  controlGroup: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  btn: {
    alignItems: "center",
    width: 100,
    marginVertical: 10,
    justifyContent: "center",
    marginHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 5,
  },
  btnOn: {
    backgroundColor: "#4CAF50",
  },
  btnOff: {
    backgroundColor: "#F44336",
  },
  btnAuto: {
    backgroundColor: "#2196F3",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 10,
    width: 250,
    color: 'white',
    borderRadius: 5,
  },
  boxLightOff: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "grey",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  boxLightOn: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "orange",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  scheduleItem: {
    backgroundColor: "#1E1E1E",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  scheduleText: {
    color: "white",
  },
});

export default TurnOnOffLedScreen_Mqtt;
