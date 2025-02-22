const mongoose = require('mongoose');

//function that establishes connection to mongodb
const connectDB = async () => {
    try{
        const uri = "mongodb+srv://danishtaher7:4L8f2eg8ZNcWfOC5@cluster0.kspqzjt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Atlas connected');
    } catch (error){
        console.error('MongoDB connection error: ', error);
        process.exit(1);
    }
};

//exporting function
module.exports = connectDB;

