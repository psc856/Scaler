import nodemailer from 'nodemailer';
import UserModel from '../models/userModel.js';

// HTML escape function to prevent XSS
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

let transporter = null;

const initializeEmailService = () => {
  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Verify connection
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service verification failed:', error.message);
          transporter = null;
        } else {
          console.log('✅ Email service initialized and verified');
        }
      });
    } else {
      console.warn('⚠️  Email service not configured');
    }
  } catch (error) {
    console.error('❌ Email service error:', error.message);
  }
};

initializeEmailService();

export const sendEventReminder = async (event, recipientEmail) => {
  if (!transporter) {
    return { success: false, message: 'Email not configured' };
  }

  try {
    let user = null;
    try {
      user = UserModel.findByEmail(recipientEmail);
    } catch (userError) {
      console.warn('User lookup failed:', userError.message);
    }
    
    if (user && !user.gmail_connected) {
      try {
        const settings = JSON.parse(user.settings || '{}');
        if (!settings.emailNotifications) {
          return { success: false, message: 'Email notifications disabled' };
        }
      } catch (settingsError) {
        console.warn('Settings parse error:', settingsError.message);
      }
    }

    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);
    const duration = Math.round((eventEnd - eventStart) / (1000 * 60));

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: `🔔 Reminder: ${escapeHtml(event.title)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📅 Event Reminder</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>${escapeHtml(event.title)}</h3>
            <p><strong>📅 Date:</strong> ${eventStart.toLocaleDateString()}</p>
            <p><strong>🕐 Time:</strong> ${eventStart.toLocaleTimeString()}</p>
            <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
            ${event.location ? `<p><strong>📍 Location:</strong> ${escapeHtml(event.location)}</p>` : ''}
            ${event.description ? `<p><strong>📝 Description:</strong> ${escapeHtml(event.description)}</p>` : ''}
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!info || !info.messageId) {
      throw new Error('Email sending failed');
    }
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return {
      success: false,
      message: 'Failed to send email'
    };
  }
};

export const sendEventCreatedEmail = async (event, recipientEmail) => {
  if (!transporter) return { success: false };

  try {
    const eventStart = new Date(event.start_time);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: `✅ Event Created: ${escapeHtml(event.title)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0b8043;">✅ Event Created Successfully</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3>${escapeHtml(event.title)}</h3>
            <p><strong>📅 Date:</strong> ${eventStart.toLocaleDateString()}</p>
            <p><strong>🕐 Time:</strong> ${eventStart.toLocaleTimeString()}</p>
            ${event.location ? `<p><strong>📍 Location:</strong> ${escapeHtml(event.location)}</p>` : ''}
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!info || !info.messageId) {
      throw new Error('Email sending failed');
    }
    
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('Email error:', error.message);
    return { 
      success: false, 
      message: 'Failed to send email' 
    };
  }
};

export default {
  sendEventReminder,
  sendEventCreatedEmail
};