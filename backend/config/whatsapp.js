const axios = require('axios');

class WhatsAppConfig {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessId = process.env.WHATSAPP_BUSINESS_ID;
    this.webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  }

  // Create axios instance with default config
  createApiClient(accessToken = null) {
    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${accessToken || this.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // Validate configuration
  validateConfig() {
    const required = [
      'WHATSAPP_API_URL',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WEBHOOK_VERIFY_TOKEN'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required WhatsApp config: ${missing.join(', ')}`);
    }

    return true;
  }

  // Get API URL for specific endpoint
  getEndpoint(phoneNumberId, endpoint = 'messages') {
    return `${this.apiUrl}/${phoneNumberId}/${endpoint}`;
  }

  // Get business profile endpoint
  getBusinessProfileEndpoint(phoneNumberId) {
    return `${this.apiUrl}/${phoneNumberId}/whatsapp_business_profile`;
  }

  // Get media endpoint
  getMediaEndpoint(mediaId) {
    return `${this.apiUrl}/${mediaId}`;
  }

  // Upload media endpoint
  getUploadMediaEndpoint(phoneNumberId) {
    return `${this.apiUrl}/${phoneNumberId}/media`;
  }

  // Template management endpoint
  getTemplateEndpoint(businessId) {
    return `${this.apiUrl}/${businessId || this.businessId}/message_templates`;
  }

  // Verify webhook token
  verifyWebhookToken(token) {
    return token === this.webhookVerifyToken;
  }

  // Get webhook configuration
  getWebhookConfig() {
    return {
      verifyToken: this.webhookVerifyToken,
      subscriptions: ['messages', 'message_status']
    };
  }
}

module.exports = new WhatsAppConfig();
