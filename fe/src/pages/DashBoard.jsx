import { useState, useEffect } from "react";
import { Card, Switch, Row, Col, Divider, message, Tooltip, Alert } from "antd";
import { BulbOutlined } from "@ant-design/icons";
import SensorCard from "../components/SensorCard";
import SensorStatusChart from "../components/SensorStatusChart";
import apiClient from "../hooks/apiClients";
import { useSelector } from "react-redux";

const DashBoard = () => {
  const [selectedSensorType, setSelectedSensorType] = useState("temperature");
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState({}); // State cho loading từng device
  const [sensorOffline, setSensorOffline] = useState(false); // State mới cho sensor offline
  const currentUser = useSelector((state) => state.auth.currentUser);

  // Fetch sensor status định kỳ
  useEffect(() => {
    const checkSensorStatus = async () => {
      try {
        const res = await apiClient.get("/sensor/last");
        const lastData = res.data?.data;
        if (lastData?.CreatedAt) {
          const lastTime = new Date(lastData.CreatedAt).getTime();
          const now = Date.now();
          const diffSec = (now - lastTime) / 1000;
          setSensorOffline(diffSec > 5); // Offline nếu > 2 giây
        } else {
          setSensorOffline(true); // Nếu không có data, coi như offline
        }
      } catch (error) {
        console.error("Error checking sensor status:", error);
        setSensorOffline(true);
      }
    };

    checkSensorStatus(); // Fetch ngay lần đầu
    const interval = setInterval(checkSensorStatus, 2000); // Poll mỗi 30 giây

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await apiClient.get("/device/all");
        setDevices(response.data.data || []);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);

  const changeDeviceStatus = async (deviceId, currentStatus, name) => {
    if (sensorOffline) {
      message.error(
        "Không thể điều khiển thiết bị khi sensor đang offline. Vui lòng kiểm tra kết nối."
      );
      return; // Không cần set loading nếu offline
    }

    const newStatus = currentStatus === "ON" ? "OFF" : "ON";
    setLoadingDevices((prev) => ({ ...prev, [deviceId]: true }));

    try {
      const res = await apiClient.get("/sensor/last");
      const lastData = res.data?.data;
      const lastTime = new Date(lastData?.CreatedAt).getTime();
      const now = Date.now();

      const diffMs = now - lastTime;
      const diffSec = diffMs / 1000;

      if (diffSec > 60) { // Kiểm tra lại cho chắc
        const offlineMinutes = Math.round(diffSec / 60);
        message.error(
          `Không thể điều khiển thiết bị khi dữ liệu sensor offline hơn ${offlineMinutes} phút. Vui lòng kiểm tra kết nối.`
        );
        setLoadingDevices((prev) => ({ ...prev, [deviceId]: false }));
        return;
      }

      const mappedDevices = devices.reduce((acc, device, index) => {
        const deviceKey = `device${index + 1}`;
        const isTarget = device.ID === deviceId;
        acc[deviceKey] = {
          device_id: device.ID,
          status: isTarget ? newStatus : device.status,
          user_id: currentUser.id,
          user_change: currentUser.name,
        };
        return acc;
      }, {});

      await apiClient.post("/device/control", mappedDevices);

      // Cập nhật local state
      setDevices((prev) =>
        prev.map((d) => (d.ID === deviceId ? { ...d, status: newStatus } : d))
      );

      message.success(`${name} đã được ${newStatus.toLowerCase()} thành công`);
    } catch (error) {
      console.error("Error changing device status:", error);
      message.error(`Lỗi khi ${newStatus.toLowerCase()} ${name}. Vui lòng thử lại.`);
    } finally {
      setLoadingDevices((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  // Hàm lấy màu icon dựa trên trạng thái
  const getIconColor = (status) => {
    if (sensorOffline) return "#ff4d4f"; // Đỏ nếu offline
    return status === "ON" ? "#52c41a" : "#d9d9d9";
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <Row gutter={24} style={{ flex: "0 0 auto" }}>
        <Col span={6}>
          <SensorCard
            activeTab={selectedSensorType}
            onTabChange={setSelectedSensorType}
          />
        </Col>
        <Col span={18}>
          <SensorStatusChart type={selectedSensorType} />
        </Col>
      </Row>

      <div style={{ flex: "1 1 auto", minHeight: 0 }}>
        <Divider orientation="center" style={{ margin: "16px 0 16px 0" }}>
          Devices
        </Divider>
        {/* Thêm Alert thông báo toàn cục khi offline */}
        {sensorOffline && (
          <Alert
            message="Cảnh báo: Esp32 đang offline"
            description="Không thể điều khiển thiết bị. Vui lòng kiểm tra kết nối Esp32."
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => {}} // Không cần xử lý close, chỉ để có nút X
          />
        )}
        <Row gutter={16} style={{ height: "100%" }}>
          {devices.map((device) => (
            <Col span={8} key={device.ID}>
              <Card
                style={{
                  height: "200px",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  margin: "8px",
                }}
                styles={{
                  body: {
                    padding: 16,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  },
                }}
              >
                <Tooltip title={sensorOffline ? "Sensor offline - Không thể điều khiển" : ""}>
                  <BulbOutlined
                    style={{
                      fontSize: 40,
                      color: getIconColor(device.status),
                      marginBottom: 12,
                    }}
                  />
                </Tooltip>
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: 4,
                    fontSize: "16px",
                  }}
                >
                  {device.name}
                </div>
                <div style={{ color: "#999", fontSize: 12, marginBottom: 16 }}>
                  0.2W
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Switch
                    checked={device.status === "ON"}
                    onChange={() =>
                      changeDeviceStatus(device.ID, device.status, device.name)
                    }
                    loading={loadingDevices[device.ID]}
                    disabled={loadingDevices[device.ID] || sensorOffline} // Disable Switch nếu offline
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: sensorOffline ? "#ff4d4f" : (device.status === "ON" ? "#52c41a" : "#d9d9d9"),
                    }}
                  >
                    {device.status}
                  </span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default DashBoard;