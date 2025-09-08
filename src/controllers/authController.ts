import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
    
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const userData = {email: req.body.email,password: req.body.password,
                firstName: req.body.firstName,lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber
            };
            const user = await AuthService.register(userData);
            res.status(201).json({success: true,message: 'User registered successfully',data: user});
        } catch (error: any) {
            res.status(400).json({success: false,error: error.message});
        }
    }

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const credentials = {email: req.body.email,password: req.body.password};
            const { user, token } = await AuthService.login(credentials);
            res.json({ success: true,message: 'Login successful',data: { user,token}});
        } catch (error: any) {
            res.status(401).json({success: false,error: error.message});
        }
    }

    static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            await AuthService.logout(req.user.userId);
            res.json({success: true,message: 'Logout successful'});
        } catch (error: any) {
            res.status(500).json({success: false,error: error.message});
        }
    }

    static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = await AuthService.getProfile(req.user.userId);
            res.json({success: true,data: user});
        } catch (error: any) {
            res.status(404).json({ success: false,error: error.message});
        }
    }

    static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const newToken = req.user;
            res.json({success: true, data: {token: newToken}});
        } catch (error: any) {
            res.status(401).json({success: false,error: error.message });
        }
    }
}