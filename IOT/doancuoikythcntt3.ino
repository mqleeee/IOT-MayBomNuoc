#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP8266HTTPClient.h>  // Include the HTTPClient library

// WiFi credentials
// #define ssid "HSU_Students"
// #define password "dhhs12cnvch"

#define ssid "Tenda_CBCCD0"
#define password "t12345678"
// MQTT broker details
#define mqtt_server "broker.emqx.io"
const uint16_t mqtt_port = 1883;
#define mqtt_topic_pub_led "ttcntt3/mqleeee/ledstatus"
#define mqtt_topic_sub_led "ttcntt3/mqleeee/ledstatus"
#define mqtt_topic_pub_soil "ttcntt3/mqleeee/soil"
#define mqtt_topic_sub_soil "ttcntt3/mqleeee/soil"
#define mqtt_topic_pub_time "ttcntt3/mqleeee/time"
#define mqtt_topic_sub_time "ttcntt3/mqleeee/time"

// Sensor and LED pin definitions
#define soil A0
#define LED_PIN D4

WiFiClient espClient;
PubSubClient client(espClient);
StaticJsonDocument<256> doc;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600, 60000);  // UTC+7, update every 60 seconds

const char* URL = "http://192.168.1.87:3003/data";  // Your server URL

char ledstatus[32] = "off";

void setup() {
  pinMode(soil, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);  // Set initial state to OFF
  Serial.begin(115200);

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  timeClient.begin();

  reconnect();
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  deserializeJson(doc, payload, length);
  if (String(topic) == mqtt_topic_sub_led) {
    strlcpy(ledstatus, doc["status"] | "off", sizeof(ledstatus));
    String mystring(ledstatus);

    Serial.print("Message arrived [");
    Serial.print(topic);
    Serial.print("] ");
    Serial.println(ledstatus);

    if (mystring == "on") {
      Serial.println("Turning LED on");
      digitalWrite(LED_PIN, HIGH);
    } else {
      Serial.println("Turning LED off");
      digitalWrite(LED_PIN, LOW);
    }
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ttcntt3_mqleeee")) {
      Serial.println("connected");

      // Xuất bản trạng thái LED ban đầu
      doc.clear();
      doc["name"] = "led";
      doc["status"] = ledstatus;

      char buffer[256];
      size_t n = serializeJson(doc, buffer);
      client.publish(mqtt_topic_pub_led, buffer, n);

      // Xuất bản thời gian ban đầu
      doc.clear();
      doc["timestamp"] = timeClient.getFormattedTime();
      n = serializeJson(doc, buffer);
      client.publish(mqtt_topic_pub_time, buffer, n);

      // Xuất bản độ ẩm đất ban đầu
      doc.clear();
      doc["soilMoisture"] = analogRead(soil);
      n = serializeJson(doc, buffer);
      client.publish(mqtt_topic_pub_soil, buffer, n);

      client.subscribe(mqtt_topic_sub_led);
      client.subscribe(mqtt_topic_sub_soil);
      client.subscribe(mqtt_topic_sub_time);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}
void postData(int soilMoistureValue, const String& timestamp) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(espClient,URL);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> jsonDoc;
    jsonDoc["soilMoisture"] = soilMoistureValue;
    jsonDoc["timestamp"] = timestamp;

    String requestBody;
    serializeJson(jsonDoc, requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(httpResponseCode);
      Serial.println(response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  static unsigned long lastPublish = 0;
  timeClient.update();
  unsigned long now = millis();
  if (now - lastPublish >= 15000) {  // Corrected to use >= instead of ==
    // Publish soil moisture periodically
    int soilMoistureValue = analogRead(soil);
    String formattedTime = timeClient.getFormattedTime();

    doc.clear();
    doc["soilMoisture"] = soilMoistureValue;
    char buffer[256];
    size_t n = serializeJson(doc, buffer);
    client.publish(mqtt_topic_pub_soil, buffer, n);

    Serial.print("Soil Moisture: ");
    Serial.print(soilMoistureValue);
    Serial.print(" at ");
    Serial.println(formattedTime);

    doc.clear();
    doc["timestamp"] = formattedTime;
    n = serializeJson(doc, buffer); 
    client.publish(mqtt_topic_pub_time, buffer, n);
    lastPublish = now;

    // Post data to the server
    postData(soilMoistureValue, formattedTime);
  }
}
