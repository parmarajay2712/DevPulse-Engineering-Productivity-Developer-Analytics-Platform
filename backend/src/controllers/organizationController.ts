import { Request, Response } from 'express';
import Organization from '../models/Organization';
import User from '../models/User';
import { enqueueTask } from '../utils/taskQueue';

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const user = (req as any).user;

    if (user.organizationId) {
      res.status(400).json({ message: 'User already belongs to an organization' });
      return;
    }

    const organization = await Organization.create({
      name,
    });

    // Update user to link to this org and make them an Admin
    user.organizationId = organization._id;
    user.role = 'Admin';
    await user.save();

    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating organization' });
  }
};

export const getMyOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user.organizationId) {
      res.status(404).json({ message: 'User does not belong to any organization' });
      return;
    }

    const organization = await Organization.findById(user.organizationId);
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching organization' });
  }
};

import { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';

export const getMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user.organizationId) {
      res.json([user]); // Return just the user if no org
      return;
    }

    const members = await User.find({ organizationId: user.organizationId }).select('-password');
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Server error fetching members' });
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;
    const adminUser = (req as any).user;

    if (!adminUser.organizationId) {
      res.status(400).json({ message: 'You must belong to an organization to invite members' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const newUser = await User.create({
      name: email.split('@')[0],
      email,
      password: hashedPassword,
      role: role || UserRole.MEMBER,
      organizationId: adminUser.organizationId
    });

    await enqueueTask('email', {
      to: email,
      subject: 'You have been invited to DevPulse',
      html: `<h2>Welcome to DevPulse!</h2><p>You have been invited to join your team's organization.</p><p>You can login with the default password: <b>password123</b></p><p>Please change your password immediately after logging in.</p>`,
      text: `Welcome to DevPulse!\n\nYou have been invited to join your team's organization.\nYou can login with the default password: password123\n\nPlease change your password immediately after logging in.`
    });

    res.status(201).json({ message: 'User invited successfully. They can login with password123', user: newUser });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ message: 'Server error inviting member' });
  }
};

import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user.organizationId) {
      res.status(400).json({ message: 'User does not belong to any organization' });
      return;
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const logs = await AuditLog.find({ organizationId: user.organizationId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments({ organizationId: user.organizationId });

    res.json({ logs, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
};
