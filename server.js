const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Mongoose Connection
mongoose.connect('mongodb://127.0.0.1:27017/smart_leave')
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 2. Schemas & Models
const leaveSchema = new mongoose.Schema({
    employeeName: String,
    employeeEmail: String,
    leaveType: String,
    startDate: String,
    endDate: String,
    reason: String,
    status: { type: String, default: 'Pending' }
});
const Leave = mongoose.model('Leave', leaveSchema);

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Employee' }
});
const User = mongoose.model('User', userSchema);

// 3. User & Auth Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json({ message: "Employee registered successfully!" });
    } catch (err) {
        res.status(400).json({ message: "Email already exists." });
    }
});

app.get('/api/users/all', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users" });
    }
});

// POST: Login Route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user in the database where both email and password match
        const user = await User.findOne({ email: email, password: password });

        if (user) {
            // Success: Return user details to the frontend
            res.status(200).json({
                user: { 
                    email: user.email, 
                    role: user.role, 
                    name: user.name 
                },
                token: "real-session-token" // In production, use JWT here
            });
        } else {
            // Failure: No matching user found
            res.status(401).json({ message: "Invalid email or password. Please contact Admin." });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// 4. Leave Routes
app.post('/api/leaves/apply', async (req, res) => {
    try {
        const newLeave = new Leave(req.body);
        await newLeave.save();
        res.status(201).json({ message: "Applied successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Save failed" });
    }
});

app.get('/api/leaves/my-leaves/:email', async (req, res) => {
    const leaves = await Leave.find({ employeeEmail: req.params.email });
    res.status(200).json(leaves);
});

app.get('/api/leaves/all', async (req, res) => {
    const leaves = await Leave.find();
    res.status(200).json(leaves);
});

app.put('/api/leaves/update/:id', async (req, res) => {
    const { status } = req.body;
    const updated = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json(updated);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));