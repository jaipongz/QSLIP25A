import bcrypt from 'bcrypt';
import { DB } from '../utils/database';
import { JWTUtils } from '../utils/jwtUtils';
import { emailService } from '../utils/emailService'; // Import email service

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  // static async register(userData: {
  //   email: string;
  //   password: string;
  //   firstName: string;
  //   lastName: string;
  //   phoneNumber?: string;
  // }): Promise<any> {
  //   const { email, password, firstName, lastName, phoneNumber } = userData;

  //   const existingUser = await DB.execute<any>(
  //     'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
  //     [email]
  //   );

  //   if (existingUser.length > 0) {
  //     throw new Error('User already exists with this email');
  //   }

  //   const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

  //   const result = await DB.execute<any>(
  //     `INSERT INTO users 
  //      (email, password_hash, first_name, last_name, phone_number, verification_token, verification_token_expires) 
  //      VALUES (?, ?, ?, ?, ?, SUBSTRING(MD5(RAND()) FROM 1 FOR 32), DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
  //     [email, passwordHash, firstName, lastName, phoneNumber]
  //   );

  //   const [user] = await DB.execute<any>(
  //     'SELECT id, uuid, email, first_name, last_name, phone_number, status, created_at FROM users WHERE id = ?',
  //     [result.insertId]
  //   );

  //   return user;
  // }
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<any> {
    const { email, password, firstName, lastName, phoneNumber } = userData;

    const existingUser = await DB.execute<any>(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    const verificationToken = this.generateVerificationToken();

    const result = await DB.execute<any>(
      `INSERT INTO users 
       (email, password_hash, first_name, last_name, phone_number, 
        verification_token, verification_token_expires, status) 
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), 'pending')`,
      [email, passwordHash, firstName, lastName, phoneNumber, verificationToken]
    );

    const [user] = await DB.execute<any>(
      'SELECT id, uuid, email, first_name, last_name, phone_number, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Send verification email using EmailService
    try {
      await emailService.sendVerificationEmail(email, verificationToken, firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't throw error - user is created, just email failed
    }

    return user;
  }

  static async login(credentials: { email: string; password: string; }): Promise<{ user: any; token: string }> {
    const { email, password } = credentials;
    const [user] = await DB.execute<any>(
      `SELECT id, uuid, email, password_hash, first_name, last_name, status, role, 
       login_attempts, lock_until 
       FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.login_attempts);
      throw new Error('Invalid email or password');
    }

    await DB.execute(
      'UPDATE users SET login_attempts = 0, lock_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const { password_hash, login_attempts, lock_until, ...userWithoutSensitive } = user;

    const token = JWTUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { user: userWithoutSensitive, token };
  }

  static async logout(userId: number): Promise<void> {
    console.log(`User ${userId} logged out`);
  }

  private static async handleFailedLogin(userId: number, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    let lockUntil = null;

    // Lock account after 5 failed attempts for 30 minutes
    if (newAttempts >= 5) {
      lockUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await DB.execute(
      'UPDATE users SET login_attempts = ?, lock_until = ? WHERE id = ?',
      [newAttempts, lockUntil, userId]
    );
  }

  static async getProfile(userId: number): Promise<any> {
    const [user] = await DB.execute<any>(
      `SELECT id, uuid, email, first_name, last_name, phone_number, 
       status, role, email_verified, phone_verified, created_at 
       FROM users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async verifyEmail(token: string): Promise<boolean> {
    const [user] = await DB.execute<any>(
      `SELECT id, verification_token, verification_token_expires 
       FROM users WHERE verification_token = ? AND status = 'pending'`,
      [token]
    );

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    if (new Date(user.verification_token_expires) < new Date()) {
      throw new Error('Verification token has expired');
    }

    await DB.execute(
      `UPDATE users 
       SET status = 'active', email_verified = 1, 
           verification_token = NULL, verification_token_expires = NULL,
           verified_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    return true;
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    const [user] = await DB.execute<any>(
      `SELECT id, status FROM users WHERE email = ? AND deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === 'active') {
      throw new Error('Email is already verified');
    }

    const newVerificationToken = this.generateVerificationToken();

    await DB.execute(
      `UPDATE users 
       SET verification_token = ?, verification_token_expires = DATE_ADD(NOW(), INTERVAL 24 HOUR)
       WHERE id = ?`,
      [newVerificationToken, user.id]
    );

    await this.sendVerificationEmail(email, newVerificationToken);
  }

  private static generateVerificationToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private static async sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implement your email sending logic here
    // This is a placeholder - you'll need to integrate with your email service
    const verificationLink = `${process.env.BASE_URL}/verify-email?token=${token}`;

    console.log(`Verification email sent to ${email}`);
    console.log(`Verification link: ${verificationLink}`);

    // Example with nodemailer or your email service:
    /*
    await emailService.send({
      to: email,
      subject: 'Verify Your Email Address',
      html: `Click <a href="${verificationLink}">here</a> to verify your email address.`
    });
    */
  }

}