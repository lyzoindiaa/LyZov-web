const axios = require('axios');

class DelhiveryService {
  constructor() {
    this.env = process.env.DELHIVERY_ENV || 'staging';
    this.baseUrl = process.env.DELHIVERY_BASE_URL || 'https://staging-express.delhivery.com';
    this.apiToken = process.env.DELHIVERY_API_TOKEN;
    this.clientName = process.env.DELHIVERY_CLIENT_NAME;
    this.pickupLocation = process.env.DELHIVERY_PICKUP_LOCATION;

    // Environment-safety startup guard
    if (this.env === 'staging' && !this.baseUrl.includes('staging-express')) {
      throw new Error('DELHIVERY_ENV=staging but base URL does not point to staging infrastructure');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Tracking Rate Limiter (750 requests / 5 minutes)
    this.trackingQueue = [];
    this.trackingRequestCount = 0;
    this.trackingRateLimitWindowMs = 5 * 60 * 1000;
    this.trackingMaxRequests = 750;
    this.trackingWindowStart = Date.now();

    // Rates Rate Limiter (40 requests / minute)
    this.ratesQueue = [];
    this.ratesRequestCount = 0;
    this.ratesRateLimitWindowMs = 60 * 1000;
    this.ratesMaxRequests = 40;
    this.ratesWindowStart = Date.now();
  }

  // Generic Request Queue Processor for tracking limits
  async _enqueueRequest(queue, countRef, maxRequests, windowMs, windowStartRef, requestFn) {
    return new Promise((resolve, reject) => {
      queue.push(async () => {
        try {
          const now = Date.now();
          if (now - this[windowStartRef] >= windowMs) {
            this[windowStartRef] = now;
            this[countRef] = 0;
          }

          if (this[countRef] >= maxRequests) {
            const delay = windowMs - (now - this[windowStartRef]);
            await new Promise(res => setTimeout(res, delay));
            this[windowStartRef] = Date.now();
            this[countRef] = 0;
          }

          this[countRef]++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this._processQueue(queue);
        }
      });
      
      if (queue.length === 1) {
        this._processQueue(queue);
      }
    });
  }

  _processQueue(queue) {
    if (queue.length > 0) {
      const task = queue.shift();
      task();
    }
  }

  async checkPincodeServiceability(pincode) {
    try {
      const response = await this.client.get(`/c/api/pin-codes/json/?filter_codes=${pincode}`);
      return response.data;
    } catch (error) {
      console.error('Error checking pincode serviceability:', error.response?.data || error.message);
      throw error;
    }
  }

  async estimateShippingRates(params) {
    // Must use production URL for accurate rates, via GET request
    // Limit: 40 requests/minute
    const queryParams = new URLSearchParams(params).toString();
    const url = `https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?${queryParams}`;
    
    return this._enqueueRequest(this.ratesQueue, 'ratesRequestCount', this.ratesMaxRequests, this.ratesRateLimitWindowMs, 'ratesWindowStart', async () => {
      try {
        const response = await axios.get(url, {
          headers: { 'Authorization': `Token ${this.apiToken}` }
        });
        return response.data;
      } catch (error) {
        console.error('Error estimating shipping rates:', error.response?.data || error.message);
        throw error;
      }
    });
  }

  async createOrder(orderData) {
    // Must send as application/x-www-form-urlencoded with format=json&data=<url-encoded-JSON-string>
    try {
      const payloadString = JSON.stringify(orderData);
      const encodedPayload = encodeURIComponent(payloadString);
      
      const response = await this.client.post('/api/cmu/create.json', `format=json&data=${encodedPayload}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Delhivery order:', error.response?.data || error.message);
      throw error;
    }
  }

  async createReversePickup(orderData) {
    // Wrapper for createOrder setting payment_mode="Pickup"
    orderData.payment_mode = 'Pickup';
    return this.createOrder(orderData);
  }

  async cancelOrder(waybill) {
    try {
      const payload = { waybill, cancellation: "true" };
      const response = await this.client.post('/api/p/edit', payload);
      return response.data;
    } catch (error) {
      console.error('Error canceling order:', error.response?.data || error.message);
      throw error;
    }
  }

  async trackOrder(waybill) {
    // Limit: 750 requests/5 minutes
    return this._enqueueRequest(this.trackingQueue, 'trackingRequestCount', this.trackingMaxRequests, this.trackingRateLimitWindowMs, 'trackingWindowStart', async () => {
      try {
        const response = await this.client.get(`/api/v1/packages/json/?waybill=${waybill}`);
        return response.data;
      } catch (error) {
        console.error('Error tracking order:', error.response?.data || error.message);
        throw error;
      }
    });
  }

  async createPickupRequest(params) {
    try {
      const response = await this.client.post('/fm/request/new/', params);
      return response.data;
    } catch (error) {
      console.error('Error creating pickup request:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPackingSlip(waybill) {
    try {
      const response = await this.client.get(`/api/p/packing_slip?wbns=${waybill}&pdf=true`);
      return response.data;
    } catch (error) {
      console.error('Error fetching packing slip:', error.response?.data || error.message);
      throw error;
    }
  }

}

module.exports = new DelhiveryService();
