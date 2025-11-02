import db from '../config/database.js';

class UserModel {
  static findByEmail(email) {
    try {
      if (!email || typeof email !== 'string' || email.length > 254) {
        throw new Error('Invalid email parameter');
      }
      // Sanitize email to prevent NoSQL injection
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '');
      if (!sanitizedEmail.includes('@') || sanitizedEmail !== email) {
        throw new Error('Invalid email format');
      }
      return db.findOne('users', { email: sanitizedEmail });
    } catch (error) {
      console.error('Error finding user by email:', error.message);
      return null;
    }
  }

  static create(email) {
    try {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new Error('Invalid email format');
      }

      const defaultSettings = {
        emailNotifications: true,
        reminderTime: 30,
        weekStart: 'sunday',
        timeFormat: '12h',
        theme: 'light'
      };

      const newUser = {
        email,
        gmail_connected: false,
        gmail_access_token: null,
        gmail_refresh_token: null,
        settings: JSON.stringify(defaultSettings)
      };

      return db.insert('users', newUser);
    } catch (error) {
      console.error('Error creating user:', error.message);
      return null;
    }
  }

  static connectGmail(email, accessToken, refreshToken) {
    try {
      if (!email || !accessToken) {
        throw new Error('Email and access token are required');
      }

      const user = this.findByEmail(email);
      if (user) {
        return db.update('users', user.id, {
          gmail_connected: true,
          gmail_access_token: accessToken,
          gmail_refresh_token: refreshToken
        });
      }
      return null;
    } catch (error) {
      console.error('Error connecting Gmail:', error.message);
      return null;
    }
  }

  static disconnectGmail(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const user = this.findByEmail(email);
      if (user) {
        return db.update('users', user.id, {
          gmail_connected: false,
          gmail_access_token: null,
          gmail_refresh_token: null
        });
      }
      return null;
    } catch (error) {
      console.error('Error disconnecting Gmail:', error.message);
      return null;
    }
  }

  static updateSettings(email, settings) {
    try {
      if (!email || !settings || typeof settings !== 'object') {
        throw new Error('Invalid email or settings');
      }

      const user = this.findByEmail(email);
      if (user) {
        return db.update('users', user.id, {
          settings: JSON.stringify(settings)
        });
      }
      return null;
    } catch (error) {
      console.error('Error updating user settings:', error.message);
      return null;
    }
  }

  static getOrCreate(email) {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      let user = this.findByEmail(email);
      if (!user) {
        user = this.create(email);
      }
      return user;
    } catch (error) {
      console.error('Error getting or creating user:', error.message);
      return null;
    }
  }
}

export default UserModel;