import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';

import crypto from 'crypto';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

import Organization from '../models/Organization';
import Project from '../models/Project';
import { logAuditAction } from '../services/auditService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user without organizationId first
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN, // First user in their own org is Admin
    });

    // Auto-create Organization for the user
    const organization = await Organization.create({
      name: `${name}'s Organization`,
      plan: 'Free',
    });

    const rawApiKey = crypto.randomBytes(32).toString('hex');
    const projectSalt = await bcrypt.genSalt(10);
    const apiKeyHash = await bcrypt.hash(rawApiKey, projectSalt);
    const apiKeyPreview = rawApiKey.substring(0, 8);

    // Auto-create Default Project
    const project = await Project.create({
      name: 'Default Project',
      environment: 'production',
      organizationId: organization._id,
      ownerId: user._id,
      apiKeyHash,
      apiKeyPreview
    });

    // Update user with organizationId
    user.organizationId = organization._id as any;
    await user.save();

    // Audit log
    await logAuditAction(organization._id.toString(), user._id.toString(), 'registered', 'User', { email: user.email });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set in auth middleware, but we need to typecast
    const user = (req as any).user; 
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
