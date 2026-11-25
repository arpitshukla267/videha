import bcrypt from "bcryptjs";
import { connectDatabase } from "../db/connect";
import { User } from "../models/User";

async function checkPasswords() {
  await connectDatabase();
  const users = await User.find({ email: { $in: ["superadmin@videhaoverseas.com", "shilpasachin31@gmail.com", "sejalbidgar@gmail.com"] } }).select("+passwordHash").lean();
  for (const u of users) {
    const isSales123 = await bcrypt.compare("sales123", u.passwordHash);
    const isAdmin123 = await bcrypt.compare("admin123", u.passwordHash);
    console.log(`${u.email} | matches sales123: ${isSales123} | matches admin123: ${isAdmin123}`);
  }
  process.exit(0);
}

checkPasswords().catch(console.error);
