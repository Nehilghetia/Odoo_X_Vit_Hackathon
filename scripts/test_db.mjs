import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ email: 'admin@demo.com' }).toArray();
    console.log('Database users found for admin@demo.com:', users.length);

    if (users.length > 0) {
        console.log('First user:', JSON.stringify(users[0], null, 2));

        // Test bcrypt
        if (users[0].passwordHash) {
            const match = await bcrypt.compare('demo1234', users[0].passwordHash);
            console.log('Bcrypt comparison with demo1234 on passwordHash:', match);
        } else if (users[0].password) {
            const match = await bcrypt.compare('demo1234', users[0].password);
            console.log('Bcrypt comparison with demo1234 on password:', match);
        } else {
            console.log('No password or passwordHash field found!');
        }
    }

    await mongoose.disconnect();
}

test().catch(console.error);
