// MongoDB initialization script
db = db.getSiblingDB('projector_warranty');

// Create collections with validation
db.createCollection('sites', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'address', 'contactPerson', 'contactPhone'],
      properties: {
        name: { bsonType: 'string' },
        address: { bsonType: 'string' },
        contactPerson: { bsonType: 'string' },
        contactPhone: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('projectors', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['model', 'serialNumber', 'siteId'],
      properties: {
        model: { bsonType: 'string' },
        serialNumber: { bsonType: 'string' },
        siteId: { bsonType: 'objectId' }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'role'],
      properties: {
        username: { bsonType: 'string' },
        email: { bsonType: 'string' },
        role: { 
          bsonType: 'string',
          enum: ['admin', 'manager', 'fse', 'viewer']
        }
      }
    }
  }
});

// Create indexes for better performance
db.sites.createIndex({ name: 1 });
db.sites.createIndex({ contactPerson: 1 });

db.projectors.createIndex({ serialNumber: 1 }, { unique: true });
db.projectors.createIndex({ siteId: 1 });
db.projectors.createIndex({ model: 1 });

db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

// Create default admin user
db.users.insertOne({
  username: 'admin',
  email: 'admin@projectorcare.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
