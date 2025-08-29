const { create } = require('ipfs-http-client');
const crypto = require('crypto');

class IPFSService {
  constructor() {
    // Configure IPFS client
    this.client = create({
      host: process.env.IPFS_HOST || 'localhost',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'http'
    });
  }

  async uploadFile(buffer, filename) {
    try {
      // Create file hash for verification
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      
      // Upload to IPFS
      const result = await this.client.add({
        path: filename,
        content: buffer
      });

      return {
        hash: result.cid.toString(),
        path: result.path,
        size: result.size,
        fileHash: hash
      };
    } catch (error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  async uploadJSON(data) {
    try {
      const buffer = Buffer.from(JSON.stringify(data));
      const result = await this.client.add(buffer);

      return {
        hash: result.cid.toString(),
        size: result.size
      };
    } catch (error) {
      throw new Error(`IPFS JSON upload failed: ${error.message}`);
    }
  }

  async getFile(hash) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw new Error(`IPFS retrieval failed: ${error.message}`);
    }
  }

  async pinFile(hash) {
    try {
      await this.client.pin.add(hash);
      return true;
    } catch (error) {
      throw new Error(`IPFS pinning failed: ${error.message}`);
    }
  }
}

module.exports = new IPFSService();