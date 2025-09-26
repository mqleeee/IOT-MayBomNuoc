const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = 3002;
const bodyParser = require('body-parser');


// Middleware
app.use(cors());
app.use(express.json()); // Body parser middleware

// Thiết lập kết nối cơ sở dữ liệu MySQL
const db = mysql.createConnection({
  host: 'db',
  user: 'root',
  password: 'Quangdeptrai123', // Thay đổi mật khẩu tương ứng
  database: 'mydatabase'
});

app.use(bodyParser.json());  // Parse JSON bodies

// Kết nối đến MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL connected...');
});

// Endpoint: Lấy tất cả các ngày trong tuần
app.get('/time_schedule', (req, res) => {
  const sql = 'SELECT * FROM time_schedule ORDER BY id DESC LIMIT 1';
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching data' });
      return;
    }
    res.json(results);
  });
});
app.post('/time_schedules', (req, res) => {
  const { timestart } = req.body;
  const sql = 'INSERT INTO time_schedule (timestart) VALUES (?)';
  db.query(sql, [timestart], (err, result) => {
    if (err) throw err;
    res.send('Time schedule saved');
  });
});
app.post('/data', (req, res) => {
  const { soilMoisture, timestamp } = req.body;
  const sql = 'INSERT INTO data (soilMoisture, timestamp) VALUES (?, ?)';

  db.query(sql, [soilMoisture, timestamp], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('Error saving data');
      return;
    }
    res.send('Data saved');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
