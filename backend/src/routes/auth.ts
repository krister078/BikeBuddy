import { Router, Request, Response, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/User';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface AuthRequest extends Request {
  body: {
    email?: string;
    password?: string;
    token?: string;
  };
}

// Register new user
const registerHandler: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Received registration request:', req.body);
    const { email, password } = req.body;
    console.log('Registration attempt:', { email });

    if (!email || !password) {
      console.error('Missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    console.log('Existing user check:', existingUser);
    
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Create new user
    console.log('Creating new user...');
    const user = await UserModel.create({ email, password });
    console.log('User created:', user);

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
    console.log('Token generated');

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error details:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(400).json({ error: 'Failed to create account' });
  }
};

// Login user
const loginHandler: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // Find user
    const user = await UserModel.findByEmail(email!);
    console.log('User found:', user);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await UserModel.verifyPassword(user, password!);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
    console.log('Token generated');

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: 'Login failed' });
  }
};

// Google authentication
const googleHandler: RequestHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token: idToken } = req.body;
    console.log('Received Google ID token:', idToken ? 'Token present' : 'No token');
    
    if (!idToken) {
      throw new Error('No ID token provided');
    }

    console.log('Verifying ID token...');
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    console.log('Google token verified successfully. Payload:', {
      email: payload.email,
      name: payload.name,
      sub: payload.sub
    });

    const { email, sub: google_id, name } = payload;

    if (!email) {
      throw new Error('Email not provided in token');
    }

    // Find or create user
    let user = await UserModel.findByEmail(email);
    console.log('User lookup result:', user ? 'User found' : 'No user found');
    
    if (!user) {
      console.log('Creating new user for Google sign-in');
      user = await UserModel.create({ email, google_id, name });
      console.log('New user created:', { id: user?.id, email: user?.email });
    } else if (!user.google_id) {
      console.log('Updating existing user with Google ID');
      await UserModel.updateGoogleId(email, google_id);
      user = await UserModel.findByEmail(email);
      console.log('User updated with Google ID:', { id: user?.id, email: user?.email });
    }

    if (!user) {
      throw new Error('Failed to create or update user');
    }

    // Generate token
    const jwtToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
    console.log('JWT token generated successfully');

    res.json({ user, token: jwtToken });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(400).json({ 
      error: 'Google authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/google', googleHandler);

export default router; 