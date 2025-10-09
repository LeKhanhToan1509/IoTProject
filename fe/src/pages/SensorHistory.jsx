import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Input, Pagination, Tag, Select, Row, Col, DatePicker, Button, Space, message } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '../hooks/apiClients';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SensorHistory = () => {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Applied filter states (được gửi lên API)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    temperature: 'all',
    humidity: 'all',
    light: 'all',
    dateRange: null,
    sortOrder: 'desc'
  });

  // Temporary filter states (chưa apply)
  const [tempFilters, setTempFilters] = useState({
    search: '',
    temperature: 'all',
    humidity: 'all',
    light: 'all',
    dateRange: null,
    sortOrder: 'desc'
  });

  // Data states
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format date string
  const formatDateString = (dateStr) => {
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm:ss');
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = {
        limit: pageSize,
        offset: offset,
        order: appliedFilters.sortOrder,
        sort_by: 'created_at',
      };

      // Add search filter
      if (appliedFilters.search.trim()) {
        params.search = appliedFilters.search.trim();
      }

      // Add date range filter
      if (appliedFilters.dateRange && appliedFilters.dateRange[0] && appliedFilters.dateRange[1]) {
        params.start_date = appliedFilters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = appliedFilters.dateRange[1].format('YYYY-MM-DD');
      }

      console.log('Fetching with params:', params);

      const response = await apiClient.get('/sensor/all', { params });
      const { data, total } = response.data;

      if (data) {
        // Apply client-side filters for temperature, humidity, light
        let filteredData = data.filter(item => {
          // Temperature filter
          const matchTemperature = appliedFilters.temperature === 'all' || 
            (appliedFilters.temperature === 'low' && item.Temperature < 25) ||
            (appliedFilters.temperature === 'normal' && item.Temperature >= 25 && item.Temperature <= 30) ||
            (appliedFilters.temperature === 'high' && item.Temperature > 30);

          // Humidity filter  
          const matchHumidity = appliedFilters.humidity === 'all' ||
            (appliedFilters.humidity === 'low' && item.Humidity < 50) ||
            (appliedFilters.humidity === 'normal' && item.Humidity >= 50 && item.Humidity <= 70) ||
            (appliedFilters.humidity === 'high' && item.Humidity > 70);

          // Light filter
          const matchLight = appliedFilters.light === 'all' ||
            (appliedFilters.light === 'dark' && item.Light < 300) ||
            (appliedFilters.light === 'dim' && item.Light >= 300 && item.Light <= 600) ||
            (appliedFilters.light === 'bright' && item.Light > 600);

          return matchTemperature && matchHumidity && matchLight;
        });

        const mappedData = filteredData.map((item) => ({
          key: item.ID,
          id: `#${item.ID}`,
          temperature: parseFloat(item.Temperature),
          humidity: parseFloat(item.Humidity),
          light: item.Light,
          date: new Date(item.CreatedAt),
          dateString: formatDateString(item.CreatedAt),
        }));
        
        setDataSource(mappedData);
        setTotalCount(total || 0);
      } else {
        throw new Error('API response not success');
      }
    } catch (err) {
      message.error(err.message || 'Failed to load data');
      console.error('Fetch error:', err);
      setDataSource([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, appliedFilters]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters - gửi lên backend
  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setCurrentPage(1); // Reset về trang 1
  };

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      temperature: 'all',
      humidity: 'all',
      light: 'all',
      dateRange: null,
      sortOrder: 'desc'
    };
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };

  // Check if filters have changed
  const hasFilterChanges = () => {
    return JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  // Handle pagination change
  const handlePaginationChange = (page) => {
    setCurrentPage(page);
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      align: 'center',
    },
    {
      title: 'Temperature (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 140,
      align: 'center',
      render: (value) => (
        <Tag 
          color={value > 30 ? 'red' : value < 25 ? 'blue' : 'green'}
          style={{ borderRadius: 12, padding: '4px 16px', fontSize: '13px', fontWeight: 500 }}
        >
          {value}°C
        </Tag>
      ),
    },
    {
      title: 'Humidity (%)',
      dataIndex: 'humidity',
      key: 'humidity',
      width: 130,
      align: 'center',
      render: (value) => (
        <Tag 
          color={value > 70 ? 'red' : value < 50 ? 'orange' : 'cyan'}
          style={{ borderRadius: 12, padding: '4px 16px', fontSize: '13px', fontWeight: 500 }}
        >
          {value}%
        </Tag>
      ),
    },
    {
      title: 'Light (lux)',
      dataIndex: 'light',
      key: 'light',
      width: 130,
      align: 'center',
      render: (value) => (
        <Tag 
          color={value > 600 ? 'gold' : value < 300 ? 'purple' : 'geekblue'}
          style={{ borderRadius: 12, padding: '4px 16px', fontSize: '13px', fontWeight: 500 }}
        >
          {value} lux
        </Tag>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'dateString',
      key: 'date',
      width: 180,
    },
  ];

  return (
    <Card 
      style={{ 
        height: '100%', 
        borderRadius: 8, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }
      }}
    >
      {/* Header with filters */}
      <div style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} lg={8}>
            <Search
              placeholder="Search by ID or date..."
              value={tempFilters.search}
              onChange={(e) => setTempFilters({ ...tempFilters, search: e.target.value })}
              onSearch={applyFilters}
              allowClear
              enterButton
              onPressEnter={applyFilters}
            />
          </Col>
          
          <Col xs={8} sm={6} lg={4}>
            <Select
              placeholder="Temperature"
              value={tempFilters.temperature}
              onChange={(value) => setTempFilters({ ...tempFilters, temperature: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Temp</Option>
              <Option value="low">Low (&lt;25°C)</Option>
              <Option value="normal">Normal (25-30°C)</Option>
              <Option value="high">High (&gt;30°C)</Option>
            </Select>
          </Col>

          <Col xs={8} sm={6} lg={4}>
            <Select
              placeholder="Humidity"
              value={tempFilters.humidity}
              onChange={(value) => setTempFilters({ ...tempFilters, humidity: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Humidity</Option>
              <Option value="low">Low (&lt;50%)</Option>
              <Option value="normal">Normal (50-70%)</Option>
              <Option value="high">High (&gt;70%)</Option>
            </Select>
          </Col>

          <Col xs={8} sm={6} lg={4}>
            <Select
              placeholder="Light"
              value={tempFilters.light}
              onChange={(value) => setTempFilters({ ...tempFilters, light: value })}
              style={{ width: '100%' }}
            >
              <Option value="all">All Light</Option>
              <Option value="dark">Dark (&lt;300)</Option>
              <Option value="dim">Dim (300-600)</Option>
              <Option value="bright">Bright (&gt;600)</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <RangePicker
              value={tempFilters.dateRange}
              onChange={(value) => setTempFilters({ ...tempFilters, dateRange: value })}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              format="DD/MM/YYYY"
            />
          </Col>

          
        </Row>

        <Row style={{ marginTop: '12px' }} justify="space-between" align="middle">
          <Col>
            <Space size="small">
              <span style={{ fontSize: '13px', color: '#666' }}>Sort:</span>
              <Select
                value={tempFilters.sortOrder}
                onChange={(value) => setTempFilters({ ...tempFilters, sortOrder: value })}
                style={{ width: 140 }}
                size="small"
              >
                <Option value="desc">Newest first</Option>
                <Option value="asc">Oldest first</Option>
              </Select>
              <Button 
                type="primary" 
                size="small"
                onClick={applyFilters}
                loading={loading}
                disabled={!hasFilterChanges()}
              >
                Apply Filters
              </Button>
              {hasFilterChanges() && (
                <span style={{ fontSize: '12px', color: '#faad14' }}>
                  • Filters changed
                </span>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={12} lg={2}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchData}
                loading={loading}
                title="Refresh data"
              />
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                title="Clear all filters"
              />
            </Space>
          </Col>
          <Col>
            <span style={{ fontSize: '13px', color: '#666' }}>
              Total: <strong style={{ color: '#1890ff', fontSize: '14px' }}>{totalCount}</strong> records
            </span>
          </Col>
          
        </Row>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          rowKey="key"
          loading={loading}
          locale={{ emptyText: 'No data available' }}
          size="middle"
        />
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #f0f0f0', 
          background: '#fafafa',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Show:</span>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ width: 80 }}
              size="small"
            >
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={50}>50</Option>
              <Option value={100}>100</Option>
            </Select>
            <span style={{ fontSize: '13px', color: '#666' }}>per page</span>
          </div>
          
          <Pagination
            current={currentPage}
            total={totalCount}
            pageSize={pageSize}
            onChange={handlePaginationChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total, range) => (
              <span style={{ fontSize: '13px', color: '#666', marginRight: '16px' }}>
                {range[0]}-{range[1]} of {total}
              </span>
            )}
          />
        </div>
      )}
    </Card>
  );
};

export default SensorHistory;