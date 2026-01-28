const axios = require('axios');
const WhatsAppNumber = require('../models/WhatsAppNumber');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

class WhatsAppService {
  /**
   * Send a message via WhatsApp API
   * @param {Object} whatsappNumber - WhatsApp number document from DB
   * @param {String} to - Recipient phone number
   * @param {String} type - Message type (text, image, etc.)
   * @param {Object} content - Message content
   */
  async sendMessage(whatsappNumber, to, type, content) {
    try {
      // Validate inputs
      if (!whatsappNumber) {
        throw new Error('WhatsApp number configuration is required');
      }

      if (!whatsappNumber.phoneNumberId) {
        throw new Error('Phone Number ID is missing from WhatsApp configuration');
      }

      if (!whatsappNumber.accessToken) {
        throw new Error('Access token is missing from WhatsApp configuration');
      }

      if (!to) {
        throw new Error('Recipient phone number is required');
      }

      if (!type) {
        throw new Error('Message type is required');
      }

      if (!content) {
        throw new Error('Message content is required');
      }

      // Format phone number (remove + and any non-digits)
      const cleanPhone = to.replace(/\D/g, '');
      
      console.log('Preparing WhatsApp message:', {
        phoneNumberId: whatsappNumber.phoneNumberId,
        to: cleanPhone,
        type
      });

      const url = `${process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'}/${whatsappNumber.phoneNumberId}/messages`;
      
      let messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone
      };

      // Build message based on type
      switch (type) {
        case 'text':
          if (!content.text) {
            throw new Error('Text content is required for text messages');
          }
          messageData.type = 'text';
          messageData.text = { body: content.text };
          break;

        case 'image':
        case 'video':
        case 'audio':
        case 'document':
          // Handle media messages
          if (content.mediaUrl) {
            // Upload to Cloudinary if available
            if (process.env.CLOUDINARY_CLOUD_NAME) {
              try {
                const uploadResult = await cloudinary.uploader.upload(content.mediaUrl, {
                  resource_type: 'auto'
                });
                content.mediaUrl = uploadResult.secure_url;
              } catch (cloudinaryError) {
                console.warn('Cloudinary upload failed, using original URL:', cloudinaryError.message);
              }
            }

            messageData.type = type;
            messageData[type] = {
              link: content.mediaUrl
            };

            if (content.caption) {
              messageData[type].caption = content.caption;
            }
          } else {
            throw new Error(`Media URL is required for ${type} messages`);
          }
          break;

        case 'button':
          if (!content.text) {
            throw new Error('Text is required for button messages');
          }
          if (!content.buttons || content.buttons.length === 0) {
            throw new Error('Buttons are required for button messages');
          }

          messageData.type = 'interactive';
          messageData.interactive = {
            type: 'button',
            body: { text: content.text },
            action: {
              buttons: content.buttons.slice(0, 3).map((btn, i) => ({
                type: 'reply',
                reply: { 
                  id: btn.id || `btn_${i}`, 
                  title: btn.text.substring(0, 20) // WhatsApp limit
                }
              }))
            }
          };

          if (content.header) {
            messageData.interactive.header = { type: 'text', text: content.header };
          }
          if (content.footer) {
            messageData.interactive.footer = { text: content.footer };
          }
          break;

        case 'list':
          if (!content.text) {
            throw new Error('Text is required for list messages');
          }
          if (!content.listItems || content.listItems.length === 0) {
            throw new Error('List items are required for list messages');
          }

          messageData.type = 'interactive';
          messageData.interactive = {
            type: 'list',
            body: { text: content.text },
            action: {
              button: content.buttonText || 'Options',
              sections: [{
                title: content.sectionTitle || 'Menu',
                rows: content.listItems.slice(0, 10).map((item, i) => ({
                  id: item.id || `item_${i}`,
                  title: item.title.substring(0, 24),
                  description: item.description ? item.description.substring(0, 72) : undefined
                }))
              }]
            }
          };

          if (content.header) {
            messageData.interactive.header = { type: 'text', text: content.header };
          }
          if (content.footer) {
            messageData.interactive.footer = { text: content.footer };
          }
          break;

        case 'template':
          if (!content.templateName) {
            throw new Error('Template name is required for template messages');
          }

          messageData.type = 'template';
          messageData.template = {
            name: content.templateName,
            language: { code: content.language || 'en' }
          };

          if (content.templateParams && content.templateParams.length > 0) {
            messageData.template.components = [{
              type: 'body',
              parameters: content.templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }];
          }
          break;

        default:
          throw new Error(`Unsupported message type: ${type}`);
      }

      console.log('Sending to WhatsApp API:', {
        url,
        messageType: messageData.type,
        to: messageData.to
      });

      // Send request to WhatsApp API
      const response = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${whatsappNumber.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('WhatsApp API success:', {
        messageId: response.data.messages?.[0]?.id,
        status: response.status
      });

      // Update daily count
      const today = new Date().toDateString();
      const lastReset = new Date(whatsappNumber.lastResetDate).toDateString();
      
      if (today !== lastReset) {
        whatsappNumber.currentDailyCount = 0;
        whatsappNumber.lastResetDate = new Date();
      }
      
      whatsappNumber.currentDailyCount += 1;
      await whatsappNumber.save();

      return response.data;
    } catch (error) {
      console.error('WhatsApp Service Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Handle specific WhatsApp API errors
      if (error.response?.data?.error) {
        const waError = error.response.data.error;
        
        // Map WhatsApp error codes to user-friendly messages
        const errorMessages = {
          100: 'Invalid parameter in message',
          130: 'Permission denied - check access token',
          131: 'User has blocked the business number',
          132: 'Message failed to send',
          133: 'Phone number is not a WhatsApp number',
          135: 'Rate limit exceeded',
          136: 'Template does not exist or is not approved',
          190: 'Access token expired'
        };

        const friendlyMessage = errorMessages[waError.code] || waError.message || 'WhatsApp API error';
        
        throw new Error(`WhatsApp Error (${waError.code}): ${friendlyMessage}`);
      }

      throw error;
    }
  }

  async createTemplate(template) {
    const url = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_BUSINESS_ID}/message_templates`;
    
    const components = template.components.map(comp => {
      const component = {
        type: comp.type,
        format: comp.format,
        text: comp.text
      };

      if (comp.example) {
        component.example = { body_text: [comp.example] };
      }

      if (comp.buttons) {
        component.buttons = comp.buttons.map(btn => ({
          type: btn.type,
          text: btn.text,
          url: btn.url,
          phone_number: btn.phoneNumber
        }));
      }

      return component;
    });

    const templateData = {
      name: template.name,
      language: template.language,
      category: template.category,
      components
    };

    try {
      const response = await axios.post(url, templateData, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Create template error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMediaUrl(mediaId, accessToken) {
    const url = `${process.env.WHATSAPP_API_URL}/${mediaId}`;
    
    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data.url;
    } catch (error) {
      console.error('Get media URL error:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppService();