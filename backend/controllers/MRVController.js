const Project = require("../models/Project");
const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/ipfs.js");

// Upload MRV and attach to project
exports.uploadMRV = async (req, res) => {
  try {
    const { projectId, description } = req.body;
    const files = req.files;
    const wallet = req.headers["x-wallet-address"];
    
    
    
    
    // console.log(projectId,description,wallet);





    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // 1️⃣ Upload each file to IPFS
    let fileCIDs = [];
    for (const file of files) {
      const cid = await uploadFileToIPFS(file);
      fileCIDs.push(cid);
    }

    // 2️⃣ Create metadata JSON and upload
    const metadata = {
      projectId,
      projectName: project.name,
      description,
      files: fileCIDs,
      uploadedBy: wallet,
      uploadedAt: new Date()
    };
    const metadataCid = await uploadJSONToIPFS(metadata);

    // 3️⃣ Create MRVData document
    const mrvRecord = await project.mrvData.create({
      reportName: `MRV-${Date.now()}`,
      description,
      ipfsHash: metadataCid,
      files: fileCIDs,
      uploadedBy: wallet,
    });

    // 4️⃣ Push MRVData reference to project.mrvData
    // console.log(mrvRecord);
    project.mrvData.push(mrvRecord);
    await project.save();

    res.json({
      message: "✅ MRV uploaded",
      metadataCid,
      files: fileCIDs
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Fetch MRVs for a project
exports.getMRVs = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('mrvData');

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({ mrvRecords: project.mrvData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// const Project = require("../models/Project");
// const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/ipfs.js"); // you already wrote these


// // Upload MRV and attach to project
// exports.uploadMRV = async (req, res) => {
//   try {
//     const { projectId, description } = req.body;
//     const files = req.files;
//     const wallet = req.headers["x-wallet-address"];

//     if (!files || files.length === 0) {
//       return res.status(400).json({ error: "No files uploaded" });
//     }

//     const project = await Project.findById(projectId);
//     if (!project) return res.status(404).json({ error: "Project not found" });

//     // 1️⃣ Upload each file to IPFS
//     let fileCIDs = [];
//     for (const file of files) {
//       const cid = await uploadFileToIPFS(file);
//       fileCIDs.push(cid);
//     }

//     // 2️⃣ Create metadata JSON and upload
//     const metadata = {
//       projectId,
//       projectName: project.name,
//       description,
//       files: fileCIDs,
//       uploadedBy: wallet,
//       uploadedAt: new Date()
//     };

//     const metadataCid = await uploadJSONToIPFS(metadata);

//     // 3️⃣ Push subdocument to project.mrvRecords
//     project.mrvRecords.push({
//       reportName: `MRV-${project.mrvRecords.length + 1}`,
//       description,
//       ipfsHash: metadataCid,
//       files: fileCIDs,
//       uploadedBy: wallet
//     });
    
//     await project.save();   // 🔴 Make sure this line is there
//     console.log("✅ Project updated with MRV:", project);
//     res.json({
//       message: "✅ MRV uploaded",
//       metadataCid,
//       files: fileCIDs
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Fetch MRVs for a project
// exports.getMRVs = async (req, res) => {
//   try {
//     console.log(req.params);
//     const { projectId } = req.params;
//     const project = await Project.findById(projectId);

//     if (!project) return res.status(404).json({ error: "Project not found" });

//     res.json({ mrvRecords: project.mrvRecords });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



// // controllers/mrvController.js
// const axios = require("axios");
// const Project = require("../models/Project");
// const { uploadFileToIPFS, uploadJSONToIPFS } = require("../utils/ipfs");

// exports.uploadMRV = async (req, res) => {
//   try {
//     const { projectId, description } = req.body;
//     const files = req.files;

//     if (!files?.length) return res.status(400).json({ error: "No files uploaded" });

//     const project = await Project.findById(projectId);
//     if (!project) return res.status(404).json({ error: "Project not found" });

//     // 🔹 Upload files to Pinata
//     const uploadedFiles = [];
//     for (const file of files) {
//       const cid = await uploadFileToIPFS(file);
//       uploadedFiles.push({
//         date: new Date(),
//         type: file.mimetype,
//         cid,
//         desc: description,
//       });
//     }

//     // 🔹 Load existing metadata if exists
//     let metadata = {
//       projectId: project._id.toString(),
//       name: project.name,
//       owner: project.owner,
//       country: project.country,
//       description: project.description,
//       mrv: [],
//     };

//     if (project.ipfsMetadata) {
//       try {
//         const existing = await axios.get(`https://gateway.pinata.cloud/ipfs/${project.ipfsMetadata}`);
//         metadata = existing.data;
//       } catch (err) {
//         console.warn("⚠️ Could not fetch existing metadata, starting fresh.");
//       }
//     }

//     metadata.mrv.push(...uploadedFiles);

//     // 🔹 Upload updated metadata JSON
//     const jsonCid = await uploadJSONToIPFS(metadata);

//     // 🔹 Save to MongoDB
//     project.ipfsMetadata = jsonCid;
//     await project.save();

//     res.json({
//       message: "✅ MRV uploaded successfully",
//       ipfsMetadata: project.ipfsMetadata,
//       newEntries: uploadedFiles,
//     });
//   } catch (err) {
//     console.error("MRV upload error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };
