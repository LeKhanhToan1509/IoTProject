#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ================= WIFI CONFIG =================
const char* WIFI_SSID = "Iphone";
const char* WIFI_PASS = "15092004";

// ================= MQTT CONFIG =================
const char* MQTT_SERVER = "192.168.100.65";   // IP của broker
const int   MQTT_PORT   = 1883;
const char* TOPIC_CONTROL = "led/control";
const char* TOPIC_SENSOR  = "sensor/information";

// ================= LED PINS ====================
#define LED1_PIN 18   // D25
#define LED2_PIN 19   // D26
#define LED3_PIN 21   // D27

// ================= DHT11 CONFIG ================
#define DHT_PIN 16
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// ================= LIGHT SENSOR CONFIG =========
#define LIGHT_SENSOR_AO_PIN 34   // Analog pin
#define LIGHT_SENSOR_DO_PIN 23   // Digital pin

// ================= GLOBAL VARS =================
WiFiClient espClient;
PubSubClient client(espClient);

bool led1_state = false;
bool led2_state = false;
bool led3_state = false;

unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000; // 2 giây

// ==================================================
// SETUP
// ==================================================
void setup() {
  Serial.begin(115200);

  // LED setup
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);

  // Sensors
  dht.begin();
  pinMode(LIGHT_SENSOR_AO_PIN, INPUT);
  pinMode(LIGHT_SENSOR_DO_PIN, INPUT_PULLUP);

  // WiFi + MQTT
  setupWiFi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

// ==================================================
// LOOP
// ==================================================
void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  if (millis() - lastSensorRead >= sensorInterval) {
    readAndPublishSensor();
    lastSensorRead = millis();
  }
}

// ==================================================
// WIFI CONNECT
// ==================================================
void setupWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

// ==================================================
// MQTT CONNECT
// ==================================================
void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }

  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Connected!");
      client.subscribe(TOPIC_CONTROL);
    } else {
      Serial.print("Failed, rc=");
      Serial.print(client.state());
      Serial.println(" retry in 5s");
      delay(5000);
    }
  }
}

// ==================================================
// MQTT CALLBACK
// ==================================================
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (String(topic) == TOPIC_CONTROL) {
    controlLEDsJSON(message);
  }
}

// ==================================================
// LED CONTROL
// ==================================================
void controlLEDsJSON(String jsonMessage) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, jsonMessage);

  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc.containsKey("led1")) {
    String cmd = doc["led1"].as<String>();
    if (cmd == "ON" || cmd == "on" || cmd == "1") {
      digitalWrite(LED1_PIN, HIGH);
      led1_state = true;
      Serial.println("LED1 ON");
    } else {
      digitalWrite(LED1_PIN, LOW);
      led1_state = false;
      Serial.println("LED1 OFF");
    }
  }

  if (doc.containsKey("led2")) {
    String cmd = doc["led2"].as<String>();
    if (cmd == "ON" || cmd == "on" || cmd == "1") {
      digitalWrite(LED2_PIN, HIGH);
      led2_state = true;
      Serial.println("LED2 ON");
    } else {
      digitalWrite(LED2_PIN, LOW);
      led2_state = false;
      Serial.println("LED2 OFF");
    }
  }

  if (doc.containsKey("led3")) {
    String cmd = doc["led3"].as<String>();
    if (cmd == "ON" || cmd == "on" || cmd == "1") {
      digitalWrite(LED3_PIN, HIGH);
      led3_state = true;
      Serial.println("LED3 ON");
    } else {
      digitalWrite(LED3_PIN, LOW);
      led3_state = false;
      Serial.println("LED3 OFF");
    }
  }
}

// ==================================================
// SENSOR READ + PUBLISH
// ==================================================
void readAndPublishSensor() {
  unsigned long currentTime = millis();

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int lightValue = analogRead(LIGHT_SENSOR_AO_PIN);
  float lightPercent = map(lightValue, 4095, 0, 0, 100);
  lightPercent = constrain(lightPercent, 0, 100);
  int lightDigital = digitalRead(LIGHT_SENSOR_DO_PIN);

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read DHT11!");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["time"] = currentTime;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["light_percent"] = lightPercent;
  doc["light_raw"] = lightValue;
  doc["light_digital"] = lightDigital;

  String jsonData;
  serializeJson(doc, jsonData);

  if (client.connected()) {
    client.publish(TOPIC_SENSOR, jsonData.c_str());
    Serial.println("Published: " + jsonData);
  }
}
