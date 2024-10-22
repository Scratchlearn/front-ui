import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ProgressBar, Form } from 'react-bootstrap';
import './DeliveryList.css'; // Ensure to modify this file for background styling

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch deliveries from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://server-pass-1.onrender.com/api/data');
        const data = await response.json();

        // Convert object of delivery arrays into a flat array
        const tasksArray = Object.values(data).flat();

        // Filter deliveries where Step_ID === 0
        const filteredDeliveries = tasksArray.filter(delivery => delivery.Step_ID === 0);

        // Map API data to UI variable names
        const mappedDeliveries = filteredDeliveries.map(delivery => ({
          // Use DelCode_w_o__ instead of Key for URL
          delCode: delivery.DelCode_w_o__, // Save DelCode_w_o__ as delCode
          client: `${delivery.Short_description} for ${delivery.Client}`,
          initiated: formatTimestamp(delivery.Planned_Start_Timestamp), // Format timestamp
          deadline: calculateDeadline(delivery.Planned_Delivery_Timestamp, delivery.Planned_Start_Timestamp),
          tasksPlanned: delivery.Planned_Tasks || 0, // Ensure 0 if undefined
          tasksTotal: delivery.Total_Tasks || 0, // Ensure 0 if undefined
        }));

        setDeliveries(mappedDeliveries);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Function to format the start timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No start time';
    const date = new Date(timestamp?.value || timestamp); // Handle nested value in timestamp
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
  };

  // Calculate the difference between delivery and start timestamp
  const calculateDeadline = (deliveryTimestamp, startTimestamp) => {
    if (deliveryTimestamp && startTimestamp) {
      const deliveryTime = new Date(deliveryTimestamp?.value || deliveryTimestamp);
      const startTime = new Date(startTimestamp?.value || startTimestamp);
      if (isNaN(deliveryTime.getTime()) || isNaN(startTime.getTime())) return 'Invalid deadline';

      const timeDiff = deliveryTime - startTime;
      const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${daysLeft} days ${hoursLeft} hrs left`;
    }
    return 'No deadline';
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter deliveries based on search term
  const filteredDeliveries = deliveries.filter((delivery) =>
    delivery.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <h1 className="my-4">List of Deliveries</h1>

      <Row className="mb-4">
        <Col xs={10}>
          <Form.Control
            type="text"
            placeholder="Search for deliveries..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Col>
        <Col xs={2} className="text-right">
          <span role="img" aria-label="filter" style={{ fontSize: '1.5rem', cursor: 'pointer' }}>
            🔍
          </span>
        </Col>
      </Row>

      <p>You have {filteredDeliveries.length} active deliveries</p>
      <Row>
        {filteredDeliveries.map((delivery) => {
          const progress = delivery.tasksTotal === 0 ? 0 : (delivery.tasksPlanned / delivery.tasksTotal) * 100;

          return (
            <Col xs={12} key={delivery.delCode} className="mb-3">
              <LazyLoad
                height={200}
                offset={100}
                once
                placeholder={
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                    <FaSpinner className="spinner-icon" style={{ fontSize: '2rem', color: '#007bff', animation: 'spin 1s linear infinite' }} />
                  </div>
                }
              >
                <Link to={`/delivery/${delivery.delCode}`} className="card-link-wrapper">
                  <Card className="p-3 shadow-sm task-card">
                    <div
                      className="shaded-bg"
                      style={{ width: `${progress}%` }}
                    ></div>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center mb-2">
                            <FiCheckCircle style={{ marginRight: '8px', color: 'green' }} />
                            <span className="font-weight-bold" style={{ fontSize: '1.5rem' }}>
                              {delivery.tasksPlanned} of {delivery.tasksTotal} Planned
                            </span>
                          </div>
                          <div className="mb-2">
                            <ProgressBar
                              now={progress}
                              variant={progress > 50 ? 'success' : progress > 20 ? 'warning' : 'danger'}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mb-1 text-muted">
                            <FiClock style={{ marginRight: '5px' }} />
                            {delivery.initiated || 'No start time'}
                          </p>
                          <p className="mb-0 text-muted">
                            <FiFlag style={{ marginRight: '5px' }} />
                            {delivery.deadline}
                          </p>
                        </div>
                      </div>
                      <h5 className="mt-3">{delivery.client}</h5>
                    </Card.Body>
                  </Card>
                </Link>
              </LazyLoad>
            </Col>
          );
        })}
      </Row>
    </Container>
  );

};

export default DeliveryList;
