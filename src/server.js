const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Métriques
let requestCount = 0;
let errorCount = 0;
let requestDurations = [];

// Middleware pour compter les requêtes
app.use((req, res, next) => {
  const start = Date.now();
  requestCount++;
  res.on('finish', () => {
    const duration = Date.now() - start;
    requestDurations.push(duration);
    if (res.statusCode >= 400) errorCount++;
  });
  next();
});

// Base de données simulée
let tasks = [
  { id: 1, title: 'Learn DevSecOps', completed: false }
];

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/metrics', (req, res) => {
  const avgDuration = requestDurations.length > 0
    ? requestDurations.reduce((a, b) => a + b, 0) / requestDurations.length
    : 0;

  const metrics = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${requestCount}

# HELP http_errors_total Total number of HTTP errors
# TYPE http_errors_total counter
http_errors_total ${errorCount}

# HELP http_request_duration_ms Average request duration in ms
# TYPE http_request_duration_ms gauge
http_request_duration_ms ${avgDuration.toFixed(2)}
`.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const task = { id: tasks.length + 1, ...req.body, completed: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
