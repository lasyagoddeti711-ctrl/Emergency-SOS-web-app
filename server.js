const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Verhoeff checksum algorithm for Aadhaar format verification
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function validateChecksum(idString) {
  if (!/^\d{12}$/.test(idString)) return false;
  let c = 0;
  const inverted = idString.split('').map(Number).reverse();
  for (let i = 0; i < inverted.length; i++) {
    c = d[c][p[i % 8][inverted[i]]];
  }
  return c === 0;
}

// Simulated Central Database & Sandbox Verification Stores
const centralIdDatabase = {};
const pendingVerifications = new Map();

// In-memory Donor Storage
let bloodDonors = [
  { id: "DONOR-1", name: "Rahul Sharma", age: 26, gender: "Male", bloodGroup: "O+", phone: "9876543210", city: "Patna", aadharLast4: "5421" },
  { id: "DONOR-2", name: "Pooja Verma", age: 24, gender: "Female", bloodGroup: "A+", phone: "9876543211", city: "Patna", aadharLast4: "8912" },
  { id: "DONOR-3", name: "Amit Kumar", age: 31, gender: "Male", bloodGroup: "B+", phone: "9876543212", city: "Patna", aadharLast4: "3104" },
  { id: "DONOR-4", name: "Sneha Singh", age: 28, gender: "Female", bloodGroup: "O-", phone: "9876543213", city: "Patna", aadharLast4: "7655" }
];

// Recipient -> Array of Compatible Donors
const recipientToCompatibleDonors = {
  "A+":  ["A+", "A-", "O+", "O-"],
  "A-":  ["A-", "O-"],
  "B+":  ["B+", "B-", "O+", "O-"],
  "B-":  ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
  "O+":  ["O+", "O-"],
  "O-":  ["O-"]
};

// 1. UIDAI Sandbox: Request OTP
app.post('/api/auth/aadhaar/generate-otp', (req, res) => {
  const { aadhar, phone } = req.body;

  const cleanId = String(aadhar || '').replace(/\D/g, '');
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required (starting with 6-9)." });
  }

  if (!validateChecksum(cleanId)) {
    return res.status(400).json({ success: false, message: "Invalid 12-digit identification checksum format." });
  }

  // Bind first registered phone to this ID for mock consistency
  if (!centralIdDatabase[cleanId]) {
    centralIdDatabase[cleanId] = cleanPhone;
  }

  const linkedPhone = centralIdDatabase[cleanId];
  if (linkedPhone !== cleanPhone) {
    return res.status(400).json({
      success: false,
      message: `Mobile mismatch: The mobile number does not match the record registered with this identification (Linked record ends in *******${linkedPhone.slice(-3)}).`
    });
  }

  const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const sandboxOtp = "123456";

  pendingVerifications.set(txnId, {
    cleanId,
    cleanPhone,
    otp: sandboxOtp,
    isVerified: false,
    createdAt: Date.now()
  });

  console.log(`[SANDBOX GATEWAY] OTP sent for Txn: ${txnId} to mobile ending in *******${cleanPhone.slice(-3)} (Mock Passcode: ${sandboxOtp})`);

  return res.json({
    success: true,
    txnId,
    message: `OTP sent via UIDAI Developer Gateway to *******${cleanPhone.slice(-3)}.`,
    sandboxHint: "Sandbox Test Mode: Enter 123456"
  });
});

// 2. UIDAI Sandbox: Confirm OTP
app.post('/api/auth/aadhaar/verify-otp', (req, res) => {
  const { txnId, otp, phone } = req.body;

  if (!pendingVerifications.has(txnId)) {
    return res.status(400).json({ success: false, message: "Verification session expired or invalid." });
  }

  const session = pendingVerifications.get(txnId);
  const cleanPhone = String(phone || '').replace(/\D/g, '');

  if (session.cleanPhone !== cleanPhone) {
    return res.status(400).json({ success: false, message: "Mobile mismatch: Tampered mobile number." });
  }

  if (session.otp !== String(otp).trim()) {
    return res.status(400).json({ success: false, message: "Incorrect OTP entered." });
  }

  session.isVerified = true;
  pendingVerifications.set(txnId, session);

  return res.json({
    success: true,
    verificationToken: txnId,
    message: "Identity & mobile linkage verified successfully."
  });
});

// 3. User Registration
app.post('/api/donors/register', async (req, res) => {
  const { name, age, gender, phone, bloodGroup, city, password, verificationToken } = req.body;

  if (!verificationToken || !pendingVerifications.has(verificationToken)) {
    return res.status(400).json({ success: false, message: "Verification session not found. Verify identity first." });
  }

  const session = pendingVerifications.get(verificationToken);
  if (!session.isVerified) {
    return res.status(400).json({ success: false, message: "Identity OTP check was not completed." });
  }

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (session.cleanPhone !== cleanPhone) {
    return res.status(400).json({ success: false, message: "Submitted phone does not match verified identity." });
  }

  if (bloodDonors.some(d => d.phone === cleanPhone)) {
    return res.status(400).json({ success: false, message: "An account with this mobile number already exists." });
  }

  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  if (!password || password.length < 6 || !specialCharRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters and contain at least one special character (!@#$%^&*)."
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newDonor = {
    id: `DONOR-${Date.now()}`,
    name: name.trim(),
    age: Number(age) || 20,
    gender: gender || "Not specified",
    phone: cleanPhone,
    password: hashedPassword,
    aadharLast4: session.cleanId.slice(-4),
    bloodGroup: bloodGroup.toUpperCase(),
    city: city || "Patna",
    isIdentityVerified: true
  };

  bloodDonors.unshift(newDonor);
  pendingVerifications.delete(verificationToken);

  console.log(`[REGISTERED] ${newDonor.name} (${newDonor.bloodGroup}) | ID Verified: ****${newDonor.aadharLast4}`);

  const { password: _, ...safeUser } = newDonor;
  return res.json({ success: true, donor: safeUser });
});
// Sign In Endpoint for Returning Donors
app.post('/api/donors/login', async (req, res) => {
  const { phone, password } = req.body;

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (!cleanPhone || !password) {
    return res.status(400).json({ success: false, message: "Phone number and password are required." });
  }

  // Find user by registered phone number
  const donor = bloodDonors.find(d => d.phone === cleanPhone);
  if (!donor) {
    return res.status(404).json({ success: false, message: "No account found with this mobile number. Please sign up." });
  }

  // Compare hashed password
  const isMatch = await bcrypt.compare(password, donor.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Incorrect password entered." });
  }

  // Return sanitized user object without the hashed password
  const { password: _, ...safeUser } = donor;
  return res.json({ success: true, donor: safeUser });
});

// 4. Public Directory (Masked Phone Numbers)
app.get('/api/donors', (req, res) => {
  const { group } = req.query;
  const filtered = (!group || group === 'ALL')
    ? bloodDonors
    : bloodDonors.filter(d => d.bloodGroup.toUpperCase() === group.toUpperCase());

  const sanitized = filtered.map(d => ({
    id: d.id,
    name: d.name,
    age: d.age,
    gender: d.gender,
    bloodGroup: d.bloodGroup,
    city: d.city,
    aadharLast4: d.aadharLast4 || "XXXX",
    phone: d.phone ? `${d.phone.slice(0, 3)}XXXX${d.phone.slice(-3)}` : "Protected"
  }));

  res.json({ success: true, donors: sanitized });
});

// 5. Update Profile
app.put('/api/donors/:id', (req, res) => {
  const { id } = req.params;
  const { name, age, gender, phone, bloodGroup, city } = req.body;

  const idx = bloodDonors.findIndex(d => String(d.id) === String(id));
  if (idx === -1) return res.status(404).json({ success: false, message: "Donor profile not found." });

  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
    }
    bloodDonors[idx].phone = cleanPhone;
  }

  if (name) bloodDonors[idx].name = name.trim();
  if (age) bloodDonors[idx].age = Number(age);
  if (gender) bloodDonors[idx].gender = gender;
  if (bloodGroup) bloodDonors[idx].bloodGroup = bloodGroup.toUpperCase();
  if (city) bloodDonors[idx].city = city;

  const { password: _, ...safeUser } = bloodDonors[idx];
  return res.json({ success: true, donor: safeUser });
});

// 6. Delete Account
app.delete('/api/donors/:id', (req, res) => {
  const { id } = req.params;
  bloodDonors = bloodDonors.filter(d => String(d.id) !== String(id));
  return res.json({ success: true, message: "Account deleted successfully." });
});

// 7. Urgent Blood Broadcast
app.post('/api/blood/urgent-request', (req, res) => {
  const { bloodGroup, requesterName, requesterPhone, hospitalName, units } = req.body;

  const cleanPhone = String(requesterPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, message: "Valid 10-digit mobile number required for requester." });
  }

  const requestedGroup = bloodGroup.toUpperCase();
  const eligibleDonorGroups = recipientToCompatibleDonors[requestedGroup] || [requestedGroup];

  const requestData = {
    requestId: `REQ-${Date.now()}`,
    neededGroup: requestedGroup,
    compatibleDonorGroups: eligibleDonorGroups,
    requesterName: requesterName || "Emergency Patient",
    requesterPhone: cleanPhone,
    hospitalName: hospitalName || "City Emergency Hospital",
    units: units || "1 Unit",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  io.emit('blood_emergency_broadcast', requestData);
  return res.json({ success: true, request: requestData });
});

// 8. Sockets: Reveal Contact only on Acceptance
io.on('connection', (socket) => {
  socket.on('donor_accepted_request', ({ requestId, donor }) => {
    io.emit(`request_accepted_${requestId}`, donor);
  });
});

// 9. SOS Emergency Dispatch
app.post('/api/sos', (req, res) => {
  const { latitude, longitude, accuracy } = req.body;
  const alertData = {
    id: `EMG-${Date.now().toString().slice(-6)}`,
    latitude: latitude || 25.5941,
    longitude: longitude || 85.1376,
    accuracy: accuracy || 10,
    time: new Date().toLocaleTimeString(),
    mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`
  };
  io.emit('new_emergency_alert', alertData);
  return res.json({ success: true, alert: alertData });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`LifeLink server active on http://localhost:${PORT}`);
});