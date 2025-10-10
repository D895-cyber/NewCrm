const nodemailer = require('nodemailer');
const RMA = require('../models/RMA');
const Site = require('../models/Site');
const Projector = require('../models/Projector');
const CommunicationService = require('./CommunicationService');

class EmailProcessingService {
  constructor() {
    this.transporter = this.initializeEmail();
    this.communicationService = new CommunicationService();
    this.rmaKeywords = [
      'rma', 'return merchandise', 'defective part', 'faulty part', 
      'replacement needed', 'warranty claim', 'part failure', 'broken part'
    ];
    this.priorityKeywords = {
      'critical': ['urgent', 'critical', 'emergency', 'down', 'not working'],
      'high': ['important', 'priority', 'asap', 'soon'],
      'medium': ['normal', 'standard', 'routine'],
      'low': ['when possible', 'low priority', 'non-urgent']
    };
  }

  initializeEmail() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    return null;
  }

  // Process incoming emails for RMA requests
  async processIncomingEmail(emailData) {
    try {
      console.log('📧 Processing incoming email for RMA analysis...');
      
      const { from, subject, body, attachments, receivedAt } = emailData;
      
      // Check if email is RMA-related
      if (!this.isRMAEmail(subject, body)) {
        console.log('📧 Email not RMA-related, skipping...');
        return { processed: false, reason: 'Not RMA-related' };
      }

      // Extract RMA data from email
      const extractedData = await this.extractRMAData(emailData);
      
      if (!extractedData) {
        console.log('📧 Could not extract sufficient RMA data from email');
        return { processed: false, reason: 'Insufficient data' };
      }

      // Check for existing RMA
      const existingRMA = await this.findExistingRMA(extractedData);
      if (existingRMA) {
        console.log(`📧 RMA already exists: ${existingRMA.rmaNumber}`);
        return { processed: false, reason: 'RMA already exists', rmaId: existingRMA._id };
      }

      // Create new RMA
      const newRMA = await this.createRMAFromEmail(extractedData, emailData);
      
      // Send acknowledgment email
      await this.sendRMAAcknowledgment(newRMA, from);
      
      // Notify relevant parties
      await this.notifyRMAStakeholders(newRMA, 'created');
      
      console.log(`✅ RMA created from email: ${newRMA.rmaNumber}`);
      return { processed: true, rmaId: newRMA._id, rmaNumber: newRMA.rmaNumber };
      
    } catch (error) {
      console.error('❌ Error processing email for RMA:', error);
      throw error;
    }
  }

  // Check if email is RMA-related
  isRMAEmail(subject, body) {
    const text = `${subject} ${body}`.toLowerCase();
    return this.rmaKeywords.some(keyword => text.includes(keyword));
  }

  // Extract RMA data from email content
  async extractRMAData(emailData) {
    try {
      const { subject, body, from } = emailData;
      const text = `${subject} ${body}`;
      
      const extractedData = {
        // Basic info
        source: 'email',
        emailFrom: from,
        emailSubject: subject,
        emailBody: body,
        
        // Extract dates
        ascompRaisedDate: this.extractDate(text) || new Date(),
        customerErrorDate: this.extractDate(text, ['reported', 'occurred', 'happened']) || new Date(),
        
        // Extract site information
        siteName: this.extractSiteName(text),
        
        // Extract product information
        productName: this.extractProductName(text),
        serialNumber: this.extractSerialNumber(text),
        productPartNumber: this.extractPartNumber(text),
        
        // Extract defective part info
        defectivePartNumber: this.extractDefectivePartNumber(text),
        defectivePartName: this.extractDefectivePartName(text),
        defectiveSerialNumber: this.extractDefectiveSerialNumber(text),
        symptoms: this.extractSymptoms(text),
        
        // Extract priority
        priority: this.extractPriority(text),
        
        // Extract contact info
        createdBy: this.extractCreatedBy(from, text),
        
        // Extract additional info
        remarks: this.extractRemarks(text)
      };

      // Validate required fields
      if (!extractedData.siteName || !extractedData.productName || !extractedData.serialNumber) {
        console.log('❌ Missing required fields for RMA creation');
        return null;
      }

      return extractedData;
    } catch (error) {
      console.error('❌ Error extracting RMA data:', error);
      return null;
    }
  }

  // Extract site name from text
  extractSiteName(text) {
    const sitePatterns = [
      /site[:\s]+([^,\n]+)/i,
      /location[:\s]+([^,\n]+)/i,
      /customer[:\s]+([^,\n]+)/i,
      /client[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of sitePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract product name from text
  extractProductName(text) {
    const productPatterns = [
      /projector[:\s]+([^,\n]+)/i,
      /model[:\s]+([^,\n]+)/i,
      /product[:\s]+([^,\n]+)/i,
      /device[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of productPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract serial number from text
  extractSerialNumber(text) {
    const serialPatterns = [
      /serial[:\s]+([A-Z0-9\-]+)/i,
      /s\/n[:\s]+([A-Z0-9\-]+)/i,
      /sn[:\s]+([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of serialPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract part number from text
  extractPartNumber(text) {
    const partPatterns = [
      /part[:\s]+([A-Z0-9\-]+)/i,
      /part\s*number[:\s]+([A-Z0-9\-]+)/i,
      /pn[:\s]+([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of partPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract defective part number
  extractDefectivePartNumber(text) {
    const defectivePatterns = [
      /defective\s+part[:\s]+([A-Z0-9\-]+)/i,
      /faulty\s+part[:\s]+([A-Z0-9\-]+)/i,
      /broken\s+part[:\s]+([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of defectivePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract defective part name
  extractDefectivePartName(text) {
    const defectiveNamePatterns = [
      /defective\s+([^,\n]+)/i,
      /faulty\s+([^,\n]+)/i,
      /broken\s+([^,\n]+)/i
    ];
    
    for (const pattern of defectiveNamePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract defective serial number
  extractDefectiveSerialNumber(text) {
    const defectiveSerialPatterns = [
      /defective\s+serial[:\s]+([A-Z0-9\-]+)/i,
      /faulty\s+serial[:\s]+([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of defectiveSerialPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract symptoms/issue description
  extractSymptoms(text) {
    const symptomPatterns = [
      /symptoms?[:\s]+([^,\n]+)/i,
      /issue[:\s]+([^,\n]+)/i,
      /problem[:\s]+([^,\n]+)/i,
      /fault[:\s]+([^,\n]+)/i,
      /error[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of symptomPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract priority from text
  extractPriority(text) {
    const textLower = text.toLowerCase();
    
    for (const [priority, keywords] of Object.entries(this.priorityKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
      }
    }
    
    return 'Medium';
  }

  // Extract created by from email
  extractCreatedBy(from, text) {
    // Try to extract name from email signature or text
    const namePatterns = [
      /from[:\s]+([^,\n]+)/i,
      /regards?[:\s]+([^,\n]+)/i,
      /thanks?[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    // Fallback to email address
    return from;
  }

  // Extract remarks from text
  extractRemarks(text) {
    const remarkPatterns = [
      /remarks?[:\s]+([^,\n]+)/i,
      /notes?[:\s]+([^,\n]+)/i,
      /comments?[:\s]+([^,\n]+)/i
    ];
    
    for (const pattern of remarkPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Extract date from text
  extractDate(text, keywords = ['date', 'on', 'at']) {
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          return new Date(match[1]);
        } catch (error) {
          continue;
        }
      }
    }
    
    return null;
  }

  // Find existing RMA to prevent duplicates
  async findExistingRMA(extractedData) {
    try {
      const { serialNumber, siteName, productName } = extractedData;
      
      // Look for existing RMA with same serial number and site
      const existingRMA = await RMA.findOne({
        $and: [
          { serialNumber: serialNumber },
          { siteName: { $regex: siteName, $options: 'i' } },
          { caseStatus: { $nin: ['Completed', 'Rejected'] } }
        ]
      });
      
      return existingRMA;
    } catch (error) {
      console.error('❌ Error finding existing RMA:', error);
      return null;
    }
  }

  // Create new RMA from email data
  async createRMAFromEmail(extractedData, emailData) {
    try {
      const rmaData = {
        ...extractedData,
        caseStatus: 'Under Review',
        approvalStatus: 'Pending Review',
        warrantyStatus: 'In Warranty', // Default, can be updated later
        createdBy: extractedData.createdBy || 'Email System',
        remarks: extractedData.remarks || `Created from email: ${emailData.subject}`,
        emailThread: {
          messageId: emailData.messageId,
          threadId: emailData.threadId,
          originalEmail: {
            from: emailData.from,
            subject: emailData.subject,
            receivedAt: emailData.receivedAt
          }
        }
      };

      const rma = new RMA(rmaData);
      await rma.save();
      
      console.log(`✅ RMA created: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error creating RMA from email:', error);
      throw error;
    }
  }

  // Send RMA acknowledgment email
  async sendRMAAcknowledgment(rma, recipientEmail) {
    try {
      if (!this.transporter) {
        console.log('📧 Email service not available - skipping acknowledgment');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: `RMA Acknowledgment - ${rma.rmaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">RMA Request Acknowledged</h2>
            <p>Your RMA request has been received and is being processed.</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #1e40af;">RMA Details</h3>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">RMA Number:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.rmaNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Site:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.siteName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Product:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Serial Number:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.serialNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Status:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.caseStatus}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Priority:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.priority}</td>
              </tr>
            </table>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0c4a6e;">Next Steps</h3>
              <p style="margin: 8px 0;">1. Your RMA request is under review</p>
              <p style="margin: 8px 0;">2. We will prepare the CDS form and submit it</p>
              <p style="margin: 8px 0;">3. You will receive updates on the approval status</p>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 RMA acknowledgment sent to: ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending RMA acknowledgment:', error);
      return false;
    }
  }

  // Notify RMA stakeholders
  async notifyRMAStakeholders(rma, action) {
    try {
      // Notify FSE if available
      if (rma.createdBy && rma.createdBy !== 'Email System') {
        await this.communicationService.sendStatusUpdate(
          rma._id,
          'New',
          rma.caseStatus,
          'System',
          `RMA ${rma.rmaNumber} created from email`
        );
      }

      // Notify managers
      if (process.env.MANAGER_EMAIL) {
        await this.sendManagerNotification(rma, action);
      }

      console.log(`📧 RMA stakeholders notified for: ${rma.rmaNumber}`);
    } catch (error) {
      console.error('❌ Error notifying RMA stakeholders:', error);
    }
  }

  // Send manager notification
  async sendManagerNotification(rma, action) {
    try {
      if (!this.transporter || !process.env.MANAGER_EMAIL) {
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.MANAGER_EMAIL,
        subject: `RMA ${action} - ${rma.rmaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">RMA ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
            <p>A new RMA has been ${action} and requires your attention.</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #92400e;">Action Required</h3>
              <p style="margin: 8px 0;">Please review and prepare CDS form for submission.</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">RMA Number:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.rmaNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Site:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.siteName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Product:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Priority:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.priority}</td>
              </tr>
            </table>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Manager notification sent for RMA: ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending manager notification:', error);
      return false;
    }
  }

  // Process CDS form submission
  async processCDSFormSubmission(rmaId, formData) {
    try {
      const rma = await RMA.findById(rmaId);
      if (!rma) {
        throw new Error('RMA not found');
      }

      // Update RMA with CDS form data
      rma.caseStatus = 'Sent to CDS';
      rma.cdsWorkflow.sentToCDS = {
        date: new Date(),
        sentBy: formData.sentBy || 'System',
        referenceNumber: formData.referenceNumber,
        notes: formData.notes || 'CDS form submitted'
      };

      await rma.save();

      // Send CDS form to CDS
      await this.sendCDSForm(rma, formData);

      // Notify stakeholders
      await this.notifyRMAStakeholders(rma, 'sent to CDS');

      console.log(`✅ CDS form submitted for RMA: ${rma.rmaNumber}`);
      return rma;
    } catch (error) {
      console.error('❌ Error processing CDS form submission:', error);
      throw error;
    }
  }

  // Send CDS form to CDS
  async sendCDSForm(rma, formData) {
    try {
      if (!this.transporter || !process.env.CDS_EMAIL) {
        console.log('📧 CDS email not configured - skipping form submission');
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.CDS_EMAIL,
        subject: `RMA Request - ${rma.rmaNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">RMA Request Form</h2>
            <p>Please find the RMA request details below:</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #1e40af;">RMA Information</h3>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">RMA Number:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.rmaNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Site Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.siteName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Product Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Serial Number:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.serialNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Defective Part:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.defectivePartName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Symptoms:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.symptoms || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Priority:</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${rma.priority}</td>
              </tr>
            </table>

            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
              <h3 style="margin: 0; color: #0c4a6e;">Action Required</h3>
              <p style="margin: 8px 0;">Please review this RMA request and provide approval status.</p>
              <p style="margin: 8px 0;">Reply with your decision and case ID if approved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 CDS form sent for RMA: ${rma.rmaNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending CDS form:', error);
      return false;
    }
  }

  // Process CDS response
  async processCDSResponse(emailData) {
    try {
      const { subject, body, from } = emailData;
      
      // Extract RMA number from subject
      const rmaNumberMatch = subject.match(/RMA[:\s-]+([A-Z0-9-]+)/i);
      if (!rmaNumberMatch) {
        console.log('📧 No RMA number found in CDS response');
        return { processed: false, reason: 'No RMA number found' };
      }

      const rmaNumber = rmaNumberMatch[1];
      const rma = await RMA.findOne({ rmaNumber });
      
      if (!rma) {
        console.log(`📧 RMA not found: ${rmaNumber}`);
        return { processed: false, reason: 'RMA not found' };
      }

      // Extract case ID and approval status
      const caseIdMatch = body.match(/case[:\s]+id[:\s]+([A-Z0-9-]+)/i);
      const approvalMatch = body.match(/(approved|rejected|pending)/i);
      
      if (caseIdMatch) {
        rma.cdsWorkflow.cdsApproval = {
          date: new Date(),
          approvedBy: 'CDS',
          approvalNotes: 'Approved via email',
          caseId: caseIdMatch[1]
        };
        rma.caseStatus = 'CDS Approved';
        rma.approvalStatus = 'Approved';
      } else if (approvalMatch) {
        const status = approvalMatch[1].toLowerCase();
        if (status === 'approved') {
          rma.caseStatus = 'CDS Approved';
          rma.approvalStatus = 'Approved';
        } else if (status === 'rejected') {
          rma.caseStatus = 'Rejected';
          rma.approvalStatus = 'Rejected';
        }
      }

      await rma.save();

      // Notify stakeholders
      await this.notifyRMAStakeholders(rma, 'CDS response received');

      console.log(`✅ CDS response processed for RMA: ${rma.rmaNumber}`);
      return { processed: true, rmaId: rma._id, rmaNumber: rma.rmaNumber };
      
    } catch (error) {
      console.error('❌ Error processing CDS response:', error);
      throw error;
    }
  }
}

module.exports = EmailProcessingService;




