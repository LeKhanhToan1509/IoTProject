import React, { useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
  Progress,
  Space,
  Divider,
} from "antd";
import {
  UserOutlined,
  GithubOutlined,
  FilePdfOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

const ProfilePage = () => {
  // Dữ liệu profile với thêm progress bar sáng tạo (ví dụ: tiến độ học tập)
  const profile = {
    name: "Lê Khánh Toàn",
    class: "D22HTT06",
    id: "B22DCCN31",
    birth: "15/09/2004",
    subject: "IoT",
    progress: 85, // Tiến độ học tập (sáng tạo thêm)
    github: {
      avatar: "https://avatars.githubusercontent.com/u/12345678?v=4",
      username: "LeKhanhToan1509",
      repo: "LeKhanhToan1509/IoT-project",
      stars: 0, // Số sao GitHub giả
    },
    pdf: "B22DCCN31_IoT.pdf",
  };

  const [hovered, setHovered] = useState(false); // State cho hover animation

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Row gutter={[24, 24]} justify="center">
          {/* Phần avatar tên */}
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                style={{
                  height: 320,
                  borderRadius: 16,
                  border: "none",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <Avatar
                    size={80}
                    icon={<UserOutlined />}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "32px",
                    }}
                  />
                </div>
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <Title
                    level={3}
                    style={{
                      margin: "0 0 8px 0",
                      color: "#333",
                      fontSize: "22px",
                      textAlign: "center",
                      lineHeight: "1.2",
                    }}
                  >
                    {profile.name}
                  </Title>
                  <Text
                    style={{
                      color: "#666",
                      fontSize: "16px",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {profile.class}
                  </Text>
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Phần GitHub */}
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                style={{
                  height: 320,
                  borderRadius: 16,
                  border: "1px solid #d1d9e0",
                  background: "#ffffff",
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                  padding: 0,
                  overflow: "hidden",
                  position: "relative",
                }}
                bodyStyle={{ padding: 0 }}
              >
                {/* Header với stars */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
                    padding: "16px 20px",
                    borderBottom: "1px solid #30363d",
                    position: "relative",
                  }}
                >
                  {/* Stars badge ở góc phải trên */}
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "16px",
                      background: "#21262d",
                      border: "1px solid #30363d",
                      borderRadius: "12px",
                      padding: "4px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Text style={{ color: "#f0c14b", fontSize: "12px" }}>
                      ⭐
                    </Text>
                    <Text
                      style={{
                        color: "#f0f6fc",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {profile.github.stars}
                    </Text>
                  </div>

                  {/* Avatar và username */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Avatar
                      size={40}
                      src={profile.github.avatar}
                      icon={<GithubOutlined />}
                      style={{
                        backgroundColor: "#24292e",
                        border: "2px solid #30363d",
                      }}
                    />
                    <div>
                      <Text
                        strong
                        style={{
                          color: "#f0f6fc",
                          fontSize: "16px",
                          display: "block",
                          lineHeight: "1.2",
                        }}
                      >
                        {profile.github.username}
                      </Text>
                      <Text
                        style={{
                          color: "#8b949e",
                          fontSize: "12px",
                        }}
                      >
                        Member since 2024
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "20px" }}>
                  {/* Repository info */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#1f6feb",
                        }}
                      />
                      <Text
                        strong
                        style={{ color: "#0969da", fontSize: "14px" }}
                      >
                        IoT-project
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: "#656d76",
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "12px",
                      }}
                    >
                      Smart IoT monitoring system with real-time data
                      visualization
                    </Text>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      padding: "12px",
                      background: "#f6f8fa",
                      borderRadius: "8px",
                      border: "1px solid #d1d9e0",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <Text
                        style={{
                          color: "#0969da",
                          fontSize: "16px",
                          fontWeight: "600",
                          display: "block",
                        }}
                      >
                        12
                      </Text>
                      <Text style={{ color: "#656d76", fontSize: "11px" }}>
                        Repositories
                      </Text>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Text
                        style={{
                          color: "#0969da",
                          fontSize: "16px",
                          fontWeight: "600",
                          display: "block",
                        }}
                      >
                        156
                      </Text>
                      <Text style={{ color: "#656d76", fontSize: "11px" }}>
                        Contributions
                      </Text>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Text
                        style={{
                          color: "#0969da",
                          fontSize: "16px",
                          fontWeight: "600",
                          display: "block",
                        }}
                      >
                        8
                      </Text>
                      <Text style={{ color: "#656d76", fontSize: "11px" }}>
                        Followers
                      </Text>
                    </div>
                  </div>

                  {/* Button */}
                  <Button
                    type="primary"
                    icon={<GithubOutlined />}
                    href="https://github.com/LeKhanhToan1509/IoTProject"
                    target="_blank"
                    block
                    style={{
                      borderRadius: "8px",
                      background: "#238636",
                      borderColor: "#238636",
                      height: "36px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    View on GitHub
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Phần thông tin học thuật */}
          <Col xs={24} sm={24} md={8} lg={8} xl={8}>
            <Card
              style={{
                height: 320,
                borderRadius: 16,
                border: "2px solid #E31E24",
                background: "linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)",
                boxShadow: "0 8px 25px rgba(227, 30, 36, 0.15)",
                padding: 0,
                overflow: "hidden",
              }}
              bodyStyle={{ padding: 0 }}
            >
              {/* Header academic */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #E31E24 0%, #C91920 100%)",
                  padding: "16px 20px",
                  borderBottom: "3px solid #FFD700",
                  position: "relative",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: "#FFD700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BookOutlined
                      style={{ fontSize: "20px", color: "#E31E24" }}
                    />
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        color: "#ffffff",
                        fontSize: "16px",
                        display: "block",
                        lineHeight: "1.2",
                      }}
                    >
                      Academic Profile
                    </Text>
                    <Text
                      style={{
                        color: "#ffd4d6",
                        fontSize: "12px",
                      }}
                    >
                      PTIT University Student
                    </Text>
                  </div>
                </div>
                {/* University logo placeholder */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "16px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FFD700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#E31E24",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    PTIT
                  </Text>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: "20px" }}>
                {/* Student Information */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#fff8f8",
                      borderRadius: "8px",
                      border: "1px solid #ffe6e6",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text style={{ color: "#E31E24", fontSize: "12px" }}>
                        🎓
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "13px", color: "#E31E24" }}
                      >
                        Student ID
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: "#C91920",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {profile.id}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#fff8f8",
                      borderRadius: "8px",
                      border: "1px solid #ffe6e6",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text style={{ color: "#E31E24", fontSize: "12px" }}>
                        📚
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "13px", color: "#E31E24" }}
                      >
                        Class
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: "#C91920",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      D22HTT06
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#fff8f8",
                      borderRadius: "8px",
                      border: "1px solid #ffe6e6",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text style={{ color: "#E31E24", fontSize: "12px" }}>
                        🎂
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "13px", color: "#E31E24" }}
                      >
                        Birth Date
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: "#C91920",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {profile.birth}
                    </Text>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: "#fff8f8",
                      borderRadius: "8px",
                      border: "1px solid #ffe6e6",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text style={{ color: "#E31E24", fontSize: "12px" }}>
                        🔬
                      </Text>
                      <Text
                        strong
                        style={{ fontSize: "13px", color: "#E31E24" }}
                      >
                        Major
                      </Text>
                    </div>
                    <Text
                      style={{
                        color: "#C91920",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      {profile.subject}
                    </Text>
                  </div>
                </div>

                {/* Academic Progress */}
              </div>
            </Card>
          </Col>

          {/* Phần PDF */}
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                style={{
                  borderRadius: 16,
                  border: "none",
                  background:
                    "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      flex: 1,
                    }}
                  >
                    <FilePdfOutlined
                      style={{ fontSize: "32px", color: "#ff6b6b" }}
                    />
                    <div>
                      <Text
                        strong
                        style={{
                          display: "block",
                          color: "#333",
                          fontSize: "18px",
                          marginBottom: "4px",
                        }}
                      >
                        Tài liệu CV
                      </Text>
                      <Text
                        style={{
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        {profile.pdf}
                      </Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<FilePdfOutlined />}
                    href="#"
                    download
                    style={{ borderRadius: 8 }}
                  >
                    Tải xuống
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
