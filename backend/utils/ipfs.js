// utils/ipfs.js
const axios = require("axios");
const FormData = require("form-data");

const PINATA_JWT ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NDVkMmYyNC04MWY2LTQzOGUtOGI2Ny0wN2NiMTdlNTNiMmEiLCJlbWFpbCI6ImthcmFuMDkwMjIwMDVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijk0OTc4ZGVlYjM5ZWFiODQ2YTJmIiwic2NvcGVkS2V5U2VjcmV0IjoiZDQ5ZTFiNmQ4NjMxMmYwYWQwMjU0OWQyZjVhZmQ3MDVlMTA5OTYwZGU3OTY2NjI5NTA3MmE1MDE5NzExZDZmNiIsImV4cCI6MTc4ODUwMjI3OH0.GFmPXzlJODgTpd2HD9u0SeqdcUshNSA-r_A_zR3F_50";
const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

/**
 * Upload a file buffer to Pinata's IPFS
 */
async function uploadFileToIPFS(file) {
  if (!PINATA_JWT) throw new Error("Pinata JWT not set in .env11111111111111111111111");
  if (!file || !file.buffer) throw new Error("Invalid file input");

  try {
    const url = `${PINATA_BASE_URL}/pinFileToIPFS`;
    const formData = new FormData();

    formData.append("file", file.buffer, {
      filename: file.originalname || "upload",
      contentType: file.mimetype || "application/octet-stream",
    });

    const res = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return res.data.IpfsHash;
  } catch (err) {
    console.error("❌ IPFS file upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Upload a JSON object to Pinata's IPFS
 */
async function uploadJSONToIPFS(json) {

  if (!PINATA_JWT) throw new Error("Pinata JWT not set in .env1111");

  try {
    const url = `${PINATA_BASE_URL}/pinJSONToIPFS`;
    const res = await axios.post(url, json, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    return res.data.IpfsHash;
  } catch (err) {
    console.error("❌ IPFS JSON upload error:", err.response?.data || err.message);
    throw new Error("Failed to upload JSON metadata to IPFS");
  }
}

module.exports = { uploadFileToIPFS, uploadJSONToIPFS };

