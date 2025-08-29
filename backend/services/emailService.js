const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Email service not configured - missing SMTP credentials');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      this.isConfigured = true;
      console.log('Email service initialized');
    } catch (error) {
      console.error('Email service initialization error:', error);
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      if (!this.isConfigured) {
        console.log('Email service not configured, skipping email send');
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: `"GreenBlocks Platform" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        text: text,
        html: html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return { 
        success: true, 
        messageId: info.messageId,
        response: info.response 
      };
    } catch (error) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  // Email templates
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to GreenBlocks Platform';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #3b82f6 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GreenBlocks!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Hello ${user.name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to the GreenBlocks carbon credit platform! Your account has been successfully created.
          </p>
          <p style="color: #666; line-height: 1.6;">
            <strong>Account Details:</strong><br>
            Name: ${user.name}<br>
            Email: ${user.email}<br>
            Role: ${user.role.replace('_', ' ')}<br>
            Organization: ${user.organization}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #22c55e 0%, #3b82f6 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            If you have any questions, feel free to contact our support team.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The GreenBlocks Team
          </p>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendProjectApprovalEmail(user, project) {
    const subject = `Project "${project.name}" has been approved`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #3b82f6 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Project Approved!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Congratulations ${user.name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your project "${project.name}" has been approved by our verification team.
          </p>
          <p style="color: #666; line-height: 1.6;">
            You can now claim carbon credits for this project through your dashboard.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/projects/${project._id}" 
               style="background: linear-gradient(135deg, #22c55e 0%, #3b82f6 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; 
                      border-radius: 5px; display: inline-block;">
              View Project Details
            </a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendProjectRejectionEmail(user, project, reason) {
    const subject = `Project "${project.name}" requires attention`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Project Review Update</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Hello ${user.name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your project "${project.name}" has been reviewed and requires some modifications.
          </p>
          <div style="background: #fee2e2; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Review Comments:</h3>
            <p style="color: #7f1d1d; line-height: 1.6;">${reason}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please address the feedback and resubmit your project for review.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/projects/${project._id}" 
               style="background: #ef4444; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Project
            </a>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService();