import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { client, subscribeTopic } from './mqttConfig';

const SoilMoistureComponent = () => {
  const [soilMoisture, setSoilMoisture] = useState("no data");

  useEffect(() => {
    subscribeTopic("ttcntt3/mqleeee/soil", onMessageArrived);
  }, []);

  const onMessageArrived = (message) => {
    console.log("Soil moisture message: " + message.payloadString);
    const jsondata = JSON.parse(message.payloadString);
    setSoilMoisture(jsondata.message);
  };

  return (
    <View style={styles.main}>
      <Text style={styles.subTitle}>Soil Moisture: {soilMoisture}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 5,
    marginTop: 30,
    alignItems: "center",
  },
  subTitle: {
    fontSize: 20,
    fontStyle: "bold",
    color: "white",
  },
});

export default SoilMoistureComponent;
