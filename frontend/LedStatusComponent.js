import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { client, publishTopic, subscribeTopic } from './mqttConfig';

const LedStatusComponent = () => {
  const [msg, setMsg] = useState("No message");
  const [statusLed, setStatusLed] = useState("off");

  useEffect(() => {
    subscribeTopic("ttcntt3/mqleeee/ledstatus", onMessageArrived);
  }, []);

  const onMessageArrived = (message) => {
    console.log("onMessageArrived: " + message.payloadString);
    const jsondata = JSON.parse(message.payloadString);
    setMsg(message.payloadString);
    setStatusLed(jsondata.status);
  };

  const handleButtonOn = () => {
    console.log("turn on led...");
    publishTopic("ttcntt3/mqleeee/ledstatus", "on");
  };

  const handleButtonOff = () => {
    console.log("turn off led...");
    publishTopic("ttcntt3/mqleeee/ledstatus", "off");
  };

  return (
    <View style={styles.main}>
      {statusLed === "on" ? (
        <View style={styles.boxLightOn}>
          <Ionicons name="bulb" size={64} color="orange" />
        </View>
      ) : (
        <View style={styles.boxLightOff}>
          <Ionicons name="bulb" size={64} color="grey" />
        </View>
      )}
      <View style={styles.controlGroup}>
        <TouchableOpacity style={[styles.btnOff, styles.btn]} onPress={handleButtonOff}>
          <Text style={styles.btnText}>OFF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnOn, styles.btn]} onPress={handleButtonOn}>
          <Text style={styles.btnText}>ON</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subTitle}>{msg}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 5,
    marginTop: 30,
    alignItems: "center",
  },
  controlGroup: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  btn: {
    alignItems: "center",
    width: 100,
    marginBottom: 5,
    marginTop: 5,
    justifyContent: "center",
    marginRight: 15,
    padding: 15,
    borderRadius: 5,
  },
  btnOn: {
    backgroundColor: "blue",
  },
  btnOff: {
    backgroundColor: "red",
  },
  btnText: {
    color: "#FFFFFF",
  },
  boxLightOff: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "grey",
    padding: 15,
  },
  boxLightOn: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: "orange",
    padding: 15,
  },
  subTitle: {
    fontSize: 20,
    fontStyle: "bold",
    color: "white",
  },
});

export default LedStatusComponent;
