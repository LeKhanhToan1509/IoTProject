import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  type: 'sent' | 'received' | 'system';
  content: string;
  timestamp: Date;
}

const WebSocketTest: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [serverUrl, setServerUrl] = useState('ws://localhost:8080/ws');
  const [clientId, setClientId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [directMessageTo, setDirectMessageTo] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'sent' | 'received' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const connect = () => {
    try {
      const ws = new WebSocket(serverUrl);
      
      ws.onopen = () => {
        setConnected(true);
        setSocket(ws);
        addMessage('system', 'Kết nối WebSocket thành công!');
      };

      ws.onmessage = (event) => {
        addMessage('received', event.data);
      };

      ws.onclose = () => {
        setConnected(false);
        setSocket(null);
        addMessage('system', 'Kết nối WebSocket đã đóng');
      };

      ws.onerror = (error) => {
        addMessage('system', `Lỗi WebSocket: ${error}`);
      };

    } catch (error) {
      addMessage('system', `Không thể kết nối: ${error}`);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
    }
  };

  const sendMessage = () => {
    if (socket && inputMessage.trim()) {
      socket.send(inputMessage);
      addMessage('sent', inputMessage);
      setInputMessage('');
    }
  };

  const sendBroadcast = () => {
    if (socket && inputMessage.trim()) {
      const message = {
        type: 'broadcast',
        content: inputMessage
      };
      socket.send(JSON.stringify(message));
      addMessage('sent', `Broadcast: ${inputMessage}`);
      setInputMessage('');
    }
  };

  const sendDirectMessage = () => {
    if (socket && inputMessage.trim() && directMessageTo.trim()) {
      const message = {
        type: 'direct',
        to: directMessageTo,
        content: inputMessage
      };
      socket.send(JSON.stringify(message));
      addMessage('sent', `Direct to ${directMessageTo}: ${inputMessage}`);
      setInputMessage('');
    }
  };

  const sendGroupMessage = () => {
    if (socket && inputMessage.trim() && groupId.trim()) {
      const message = {
        type: 'group',
        groupId: groupId,
        content: inputMessage
      };
      socket.send(JSON.stringify(message));
      addMessage('sent', `Group ${groupId}: ${inputMessage}`);
      setInputMessage('');
    }
  };

  const joinGroup = () => {
    if (socket && groupId.trim()) {
      const message = {
        type: 'join_group',
        groupId: groupId
      };
      socket.send(JSON.stringify(message));
      addMessage('system', `Tham gia nhóm: ${groupId}`);
    }
  };

  const leaveGroup = () => {
    if (socket && groupId.trim()) {
      const message = {
        type: 'leave_group',
        groupId: groupId
      };
      socket.send(JSON.stringify(message));
      addMessage('system', `Rời nhóm: ${groupId}`);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        WebSocket Test Tool
      </h1>

      {/* Connection Controls */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Kết nối</h2>
        <div className="flex gap-3 items-center mb-3">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="WebSocket URL"
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={connected}
          />
          <button
            onClick={connected ? disconnect : connect}
            className={`px-4 py-2 rounded-md font-medium ${
              connected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {connected ? 'Ngắt kết nối' : 'Kết nối'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">
            Trạng thái: {connected ? 'Đã kết nối' : 'Chưa kết nối'}
          </span>
        </div>
      </div>

      {/* Message Controls */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Gửi tin nhắn</h2>
        
        {/* Input fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Client ID (để nhận direct message)"
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={directMessageTo}
            onChange={(e) => setDirectMessageTo(e.target.value)}
            placeholder="Gửi direct message đến"
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="Group ID"
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!connected}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !inputMessage.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
          >
            Gửi
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={sendBroadcast}
            disabled={!connected || !inputMessage.trim()}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
          >
            Broadcast
          </button>
          <button
            onClick={sendDirectMessage}
            disabled={!connected || !inputMessage.trim() || !directMessageTo.trim()}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:bg-gray-300"
          >
            Direct Message
          </button>
          <button
            onClick={sendGroupMessage}
            disabled={!connected || !inputMessage.trim() || !groupId.trim()}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-gray-300"
          >
            Group Message
          </button>
          <button
            onClick={joinGroup}
            disabled={!connected || !groupId.trim()}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
          >
            Join Group
          </button>
          <button
            onClick={leaveGroup}
            disabled={!connected || !groupId.trim()}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
          >
            Leave Group
          </button>
        </div>
      </div>

      {/* Messages Display */}
      <div className="border rounded-lg bg-white">
        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
          <h2 className="text-xl font-semibold">Tin nhắn</h2>
          <button
            onClick={clearMessages}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Xóa tất cả
          </button>
        </div>
        
        <div className="h-96 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              Chưa có tin nhắn nào
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-2 p-2 rounded-lg max-w-md ${
                  message.type === 'sent'
                    ? 'bg-blue-500 text-white ml-auto'
                    : message.type === 'received'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800 text-center'
                }`}
              >
                <div className="break-all">{message.content}</div>
                <div className="text-xs opacity-75 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 border rounded-lg bg-blue-50">
        <h3 className="font-semibold mb-2">Hướng dẫn sử dụng:</h3>
        <ul className="text-sm space-y-1">
          <li>• <strong>Kết nối:</strong> Nhập URL WebSocket và nhấn "Kết nối"</li>
          <li>• <strong>Gửi tin nhắn thường:</strong> Nhập tin nhắn và nhấn "Gửi"</li>
          <li>• <strong>Broadcast:</strong> Gửi tin nhắn đến tất cả client</li>
          <li>• <strong>Direct Message:</strong> Nhập ID client đích và gửi tin nhắn riêng</li>
          <li>• <strong>Group Message:</strong> Tham gia nhóm trước, sau đó gửi tin nhắn nhóm</li>
          <li>• <strong>Join/Leave Group:</strong> Tham gia hoặc rời khỏi nhóm</li>
        </ul>
      </div>
    </div>
  );
};

export default WebSocketTest;