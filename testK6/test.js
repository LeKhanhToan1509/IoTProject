import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10000,          // số lượng virtual users chạy đồng thời
  duration: '30s',   // thời gian test
};

export default function () {
  const url = 'http://192.168.100.65:8080/api/v1/device/control';
  const payload = JSON.stringify({
    device1: { device_id: 1, status: Math.random() < 0.5 ? "ON" : "OFF", user_id: 1, user_change: "Toan Le" },
    device2: { device_id: 2, status: Math.random() < 0.5 ? "ON" : "OFF", user_id: 1, user_change: "Toan Le" },
    device3: { device_id: 3, status: Math.random() < 0.5 ? "ON" : "OFF", user_id: 1, user_change: "Toan Le" },
  });

  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1); // để user không spam liên tục (tùy chỉnh)
}
