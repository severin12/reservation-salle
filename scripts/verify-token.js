const jwt = require('jsonwebtoken');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXEzNTQwMGMwMDAwbWtuOGVnZjVmcmgzIiwiZW1haWwiOiJhZG1pbkByZXNlcnZhdGlvbi5kZXYiLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3ODA4NjQxNjEsImV4cCI6MTc4MTQ2ODk2MX0.aq969SKd9bO0Cc9IOSHZG8MCPskREq9uYX2ob2WknkM';
const secret = process.env.JWT_SECRET || 'dev-secret';
try {
  const decoded = jwt.verify(token, secret);
  console.log('valid', decoded);
} catch (error) {
  console.error('invalid', error.message);
  process.exit(1);
}
