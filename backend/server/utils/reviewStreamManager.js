/**
 * Real-time SSE (Server-Sent Events) Stream Manager for Product Reviews
 * Provides zero-dependency, bidirectional-grade live event broadcast to all shoppers
 * currently viewing a product page.
 */

class ReviewStreamManager {
  constructor() {
    // Map of productId (string) -> Set of Express response objects
    this.productClients = new Map();

    // Heartbeat every 25s to keep connections alive through proxies and browsers
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
    if (this.heartbeatTimer && typeof this.heartbeatTimer.unref === "function") {
      this.heartbeatTimer.unref();
    }
  }

  addClient(productId, req, res) {
    const pid = String(productId);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in Nginx
    });

    res.write("retry: 5000\n");
    res.write(`event: connected\ndata: ${JSON.stringify({ productId: pid, connectedAt: new Date() })}\n\n`);

    if (!this.productClients.has(pid)) {
      this.productClients.set(pid, new Set());
    }

    this.productClients.get(pid).add(res);

    req.on("close", () => {
      this.removeClient(pid, res);
    });
  }

  removeClient(productId, res) {
    const pid = String(productId);
    const clients = this.productClients.get(pid);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.productClients.delete(pid);
      }
    }
  }

  broadcastToProduct(productId, eventName, data) {
    const pid = String(productId);
    const clients = this.productClients.get(pid);
    if (!clients || clients.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of clients) {
      try {
        res.write(payload);
      } catch (err) {
        clients.delete(res);
      }
    }
  }

  sendHeartbeat() {
    for (const [, clients] of this.productClients) {
      for (const res of clients) {
        try {
          res.write(": keep-alive\n\n");
        } catch (err) {
          clients.delete(res);
        }
      }
    }
  }
}

const reviewStreamManager = new ReviewStreamManager();
module.exports = reviewStreamManager;
