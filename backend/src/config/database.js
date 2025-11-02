import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path with security validation
const validatePath = (path) => {
  const resolved = resolve(path);
  const baseDir = resolve(__dirname, '../database');
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Invalid database path');
  }
  return resolved;
};

const dbPath = process.env.DATABASE_PATH 
  ? validatePath(process.env.DATABASE_PATH)
  : join(__dirname, '../database/calendar.json');
const dbDir = dirname(dbPath);

// Ensure database directory exists
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Initialize JSON database structure
const initializeDatabase = () => {
  if (!existsSync(dbPath)) {
    const initialData = {
      users: [],
      events: [],
      event_exceptions: [],
      ai_suggestions: [],
      conflicts: []
    };
    writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    console.log('✅ JSON Database initialized successfully');
  } else {
    console.log('✅ JSON Database loaded successfully');
  }
};

// Database operations
class JSONDatabase {
  constructor() {
    this.dbPath = dbPath;
  }

  // Read data from JSON file
  read() {
    try {
      if (!existsSync(this.dbPath)) {
        const initialData = { users: [], events: [], event_exceptions: [], ai_suggestions: [], conflicts: [] };
        this.write(initialData);
        return initialData;
      }
      const data = readFileSync(this.dbPath, 'utf8');
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid database format');
      }
      return parsed;
    } catch (error) {
      console.error('Error reading database:', error.message);
      return { users: [], events: [], event_exceptions: [], ai_suggestions: [], conflicts: [] };
    }
  }

  // Write data to JSON file
  write(data) {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }
      const jsonString = JSON.stringify(data, null, 2);
      writeFileSync(this.dbPath, jsonString, 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing to database:', error.message);
      return false;
    }
  }

  // Get all records from a table
  all(table) {
    try {
      const data = this.read();
      return Array.isArray(data[table]) ? data[table] : [];
    } catch (error) {
      console.error(`Error getting all records from ${table}:`, error.message);
      return [];
    }
  }

  // Insert a record
  insert(table, record) {
    try {
      if (!record || typeof record !== 'object') {
        throw new Error('Invalid record format');
      }
      const data = this.read();
      if (!Array.isArray(data[table])) data[table] = [];
      
      // Generate ID
      const maxId = data[table].length > 0 ? Math.max(...data[table].map(r => r.id || 0)) : 0;
      record.id = maxId + 1;
      record.created_at = new Date().toISOString();
      record.updated_at = new Date().toISOString();
      
      data[table].push(record);
      if (!this.write(data)) {
        throw new Error('Failed to write to database');
      }
      return record;
    } catch (error) {
      console.error(`Error inserting record into ${table}:`, error.message);
      return null;
    }
  }

  // Update a record
  update(table, id, updates) {
    try {
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates format');
      }
      const data = this.read();
      if (!Array.isArray(data[table])) return null;
      
      const index = data[table].findIndex(r => r.id === id);
      if (index !== -1) {
        data[table][index] = { ...data[table][index], ...updates, updated_at: new Date().toISOString() };
        if (!this.write(data)) {
          throw new Error('Failed to write to database');
        }
        return data[table][index];
      }
      return null;
    } catch (error) {
      console.error(`Error updating record in ${table}:`, error.message);
      return null;
    }
  }

  // Delete a record
  delete(table, id) {
    try {
      const data = this.read();
      if (!Array.isArray(data[table])) return null;
      
      const index = data[table].findIndex(r => r.id === id);
      if (index !== -1) {
        const deleted = data[table].splice(index, 1)[0];
        if (!this.write(data)) {
          throw new Error('Failed to write to database');
        }
        return deleted;
      }
      return null;
    } catch (error) {
      console.error(`Error deleting record from ${table}:`, error.message);
      return null;
    }
  }

  // Find records
  find(table, condition) {
    try {
      const data = this.read();
      if (!Array.isArray(data[table])) return [];
      
      return data[table].filter(record => {
        return Object.keys(condition).every(key => record[key] === condition[key]);
      });
    } catch (error) {
      console.error(`Error finding records in ${table}:`, error.message);
      return [];
    }
  }

  // Find one record
  findOne(table, condition) {
    try {
      const results = this.find(table, condition);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Error finding one record in ${table}:`, error.message);
      return null;
    }
  }

  // Get record by ID
  get(table, id) {
    try {
      const data = this.read();
      if (!Array.isArray(data[table])) return null;
      
      return data[table].find(r => r.id === id) || null;
    } catch (error) {
      console.error(`Error getting record from ${table}:`, error.message);
      return null;
    }
  }
}

// Initialize on import
initializeDatabase();

const db = new JSONDatabase();
export default db;