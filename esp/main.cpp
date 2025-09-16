#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Thông tin WiFi
const char* WIFI_SSID = "Iphone";
const char* WIFI_PASS = "15092004";

// Thông tin MQTT Broker
const char* MQTT_SERVER = "192.168.100.239"; 
const int   MQTT_PORT   = 1883;

// Định nghĩa chân LED
#define LED1_PIN 18    // D25
#define LED2_PIN 19    // D26
#define LED3_PIN 21    // D27

// Cấu hình cảm biến DHT11
#define DHT_PIN 16     // D16
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// Cấu hình cảm biến ánh sáng
#define LIGHT_SENSOR_AO_PIN 34  // D34 (ADC1_CH6)
#define LIGHT_SENSOR_DO_PIN 23  // D23 (Digital)

// MQTT Topics
const char* TOPIC_CONTROL = "led/control";
const char* TOPIC_SENSOR = "sensor/information";

// Tạo đối tượng WiFi và MQTT
WiFiClient espClient;
PubSubClient client(espClient);

// Biến lưu trạng thái LED
bool led1_state = false;
bool led2_state = false;
bool led3_state = false;

// Biến thời gian cho cảm biến
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000; // 2 giây

void setup() {
  Serial.begin(115200);
  
  // Khởi tạo chân LED
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  
  // Tắt tất cả LED ban đầu
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);
  
  // Khởi tạo cảm biến DHT11
  dht.begin();
  Serial.println("DHT11 sensor initialized");
  
  // Khởi tạo cảm biến ánh sáng
  pinMode(LIGHT_SENSOR_AO_PIN, INPUT);
  pinMode(LIGHT_SENSOR_DO_PIN, INPUT_PULLUP); // Thêm pull-up cho DO
  
  // Kết nối WiFi
  setupWiFi();
  
  // Cấu hình MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Đọc cảm biến mỗi 2 giây
  if (millis() - lastSensorRead >= sensorInterval) {
    readAndPublishSensor();
    lastSensorRead = millis();
  }
}

void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting to reconnect...");
    setupWiFi();
  }
  
  while (!client.connected()) {
    
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("MQTT connected");
      client.subscribe(TOPIC_CONTROL);
    } else {
      delay(5000);
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (String(topic) == TOPIC_CONTROL) {
    controlLEDsJSON(message);
  }
}

void controlLEDsJSON(String jsonMessage) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, jsonMessage);
  
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  if (doc.containsKey("led1")) {
    String command = doc["led1"].as<String>();
    if (command == "ON" || command == "on" || command == "1") {
      digitalWrite(LED1_PIN, HIGH);
      led1_state = true;
      Serial.println("LED1 turned ON");
    } else if (command == "OFF" || command == "off" || command == "0") {
      digitalWrite(LED1_PIN, LOW);
      led1_state = false;
      Serial.println("LED1 turned OFF");
    }
  }
  
  if (doc.containsKey("led2")) {
    String command = doc["led2"].as<String>();
    if (command == "ON" || command == "on" || command == "1") {
      digitalWrite(LED2_PIN, HIGH);
      led2_state = true;
      Serial.println("LED2 turned ON");
    } else if (command == "OFF" || command == "off" || command == "0") {
      digitalWrite(LED2_PIN, LOW);
      led2_state = false;
      Serial.println("LED2 turned OFF");
    }
  }
  
  if (doc.containsKey("led3")) {
    String command = doc["led3"].as<String>();
    if (command == "ON" || command == "on" || command == "1") {
      digitalWrite(LED3_PIN, HIGH);
      led3_state = true;
      Serial.println("LED3 turned ON");
    } else if (command == "OFF" || command == "off" || command == "0") {
      digitalWrite(LED3_PIN, LOW);
      led3_state = false;
      Serial.println("LED3 turned OFF");
    }
  }
}

void readAndPublishSensor() {
  // Lấy thời gian
  unsigned long currentTime = millis();
  
  // Đọc nhiệt độ và độ ẩm
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Đọc cảm biến ánh sáng
  int lightValue = analogRead(LIGHT_SENSOR_AO_PIN);
  // Mapping ánh sáng (LDR: ánh sáng mạnh -> giá trị thấp)
  float lightPercent = map(lightValue, 4095, 0, 0, 100); // Đảo ngược
  lightPercent = constrain(lightPercent, 0, 100);
  
  int lightDigital = digitalRead(LIGHT_SENSOR_DO_PIN);
  
  // Kiểm tra lỗi đọc DHT
  if (isnan(humidity) || isnan(temperature)) {
    return;
  }
  

  // Tạo JSON
  StaticJsonDocument<256> doc;
  doc["time"] = currentTime;
  doc["temperature"] = String(temperature, 1);
  doc["humidity"] = String(humidity, 1);
  doc["light_percent"] = String(lightPercent, 1);
  doc["light_raw"] = lightValue;
  doc["light_digital"] = lightDigital;
  
  String jsonData;
  serializeJson(doc, jsonData);
  
  // Publish JSON tới topic sensor/information
  if (client.connected()) {
    client.publish(TOPIC_SENSOR, jsonData.c_str());
  } 
}