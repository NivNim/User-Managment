const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: { 
        type: String,
        required: true
    },
    mobilenumber: {
        type: String,
        required: true
    },
    userId:{
        type:String
    }
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
