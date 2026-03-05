// MongoDB initialization script — FZ-152 compliant setup
db = db.getSiblingDB('loghist');

db.createUser({
  user: 'loghist_app',
  pwd: process.env.MONGO_APP_PASSWORD || 'app_changeme',
  roles: [{ role: 'readWrite', db: 'loghist' }],
});

// Collections with validation schemas
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password_hash', 'created_at'],
      properties: {
        email: { bsonType: 'string' },
        password_hash: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('requests');
db.createCollection('counterparties');
db.createCollection('drivers');
db.createCollection('vehicles');
db.createCollection('documents');
db.createCollection('audit_logs');
db.createCollection('ai_usage_logs');
db.createCollection('notifications');

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { sparse: true });
db.requests.createIndex({ user_id: 1, created_at: -1 });
db.requests.createIndex({ status: 1 });
db.requests.createIndex({ created_at: 1 }, { expireAfterSeconds: 2592000 }); // TTL 30 days
db.audit_logs.createIndex({ user_id: 1, created_at: -1 });
db.audit_logs.createIndex({ action: 1 });
db.ai_usage_logs.createIndex({ user_id: 1, created_at: -1 });
db.ai_usage_logs.createIndex({ created_at: -1 });
db.notifications.createIndex({ user_id: 1, is_read: 1 });
db.documents.createIndex({ owner_id: 1 });

print('MongoDB initialized for loghist — FZ-152 compliant');
