import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    companyId?: string;
  };
}

// Mock authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // In a real application, you would:
  // 1. Extract JWT token from Authorization header
  // 2. Verify the token
  // 3. Decode user information
  // 4. Attach user to request object

  // For demo purposes, we'll use a simple header-based auth
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // For development, allow requests without auth
    // In production, you should return 401
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }
    
    // Mock user for development
    req.user = {
      id: 'dev-user-1',
      role: 'company_admin',
      companyId: 'company-1'
    };
    return next();
  }

  // Mock token validation
  try {
    // In real app, verify JWT here
    const mockUser = {
      id: 'user-123',
      role: 'company_admin',
      companyId: 'company-1'
    };
    
    req.user = mockUser;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

// Role-based access control middleware
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Permission-based access control middleware
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Define role-permission mapping
    const rolePermissions: Record<string, string[]> = {
      'candidate': ['view_own_profile', 'update_own_profile'],
      'company_admin': [
        'view_candidate_profiles',
        'start_interviews',
        'view_fraud_scores',
        'view_ai_analysis',
        'manage_company_users'
      ],
      'company_member': [
        'view_candidate_profiles',
        'start_interviews',
        'view_fraud_scores',
        'view_ai_analysis'
      ],
      'verifier': [
        'verify_candidates',
        'view_candidate_profiles',
        'view_fraud_scores',
        'view_ai_analysis'
      ],
      'admin': [
        'manage_system',
        'verify_candidates',
        'view_candidate_profiles',
        'start_interviews',
        'view_fraud_scores',
        'view_ai_analysis',
        'manage_company_users'
      ]
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${permission}`
      });
    }

    next();
  };
}

// Company isolation middleware
export function requireCompanyAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Admin and verifier can access any company
  if (req.user.role === 'admin' || req.user.role === 'verifier') {
    return next();
  }

  // For company users, check if they're accessing their own company's data
  const requestedCompanyId = req.params.companyId || req.body.companyId;
  
  if (requestedCompanyId && req.user.companyId !== requestedCompanyId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your company\'s data'
    });
  }

  next();
}
