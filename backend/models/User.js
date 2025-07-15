const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'viewer'],
    default: 'user'
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    // Ya no es obligatorio
    index: true
  },
  permissions: {
    dashboard: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    exports: {
      type: Boolean,
      default: true
    },
    uploads: {
      type: Boolean,
      default: true
    },
    userManagement: {
      type: Boolean,
      default: false
    },
    audit: {
      type: Boolean,
      default: false
    },
    integrations: {
      type: Boolean,
      default: false
    }
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    avatar: String,
    phone: String,
    department: String,
    position: String,
    timezone: {
      type: String,
      default: 'America/Argentina/Buenos_Aires'
    },
    language: {
      type: String,
      default: 'es'
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      desktop: {
        type: Boolean,
        default: true
      },
      fileUploads: {
        type: Boolean,
        default: true
      },
      dataChanges: {
        type: Boolean,
        default: true
      },
      systemAlerts: {
        type: Boolean,
        default: true
      }
    },
    dashboard: {
      autoRefresh: {
        type: Boolean,
        default: true
      },
      refreshInterval: {
        type: Number,
        default: 300000 // 5 minutos
      },
      compactMode: {
        type: Boolean,
        default: false
      }
    }
  },
  security: {
    passwordChangedAt: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    lastPasswordReset: Date,
    sessionTokens: [{
      token: String,
      createdAt: Date,
      lastUsed: Date,
      ipAddress: String,
      userAgent: String
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  lastActivity: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Índices compuestos para consultas eficientes
userSchema.index({ organizationId: 1, email: 1 });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });
userSchema.index({ 'security.lockUntil': 1 }, { expireAfterSeconds: 0 });

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Virtual para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Solo hash si la contraseña fue modificada
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Actualizar fecha de cambio de contraseña
    this.security.passwordChangedAt = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para actualizar lastActivity
userSchema.pre('save', function(next) {
  if (this.isModified('lastLogin')) {
    this.lastActivity = new Date();
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Cuenta bloqueada. Intenta más tarde.');
  }
  
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  
  if (!isMatch) {
    return this.incrementLoginAttempts();
  }
  
  // Reset intentos si el login es exitoso
  if (this.security.loginAttempts > 0) {
    this.security.loginAttempts = 0;
    this.security.lockUntil = undefined;
    await this.save();
  }
  
  return true;
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutos
  
  // Incrementar intentos
  this.security.loginAttempts += 1;
  
  // Bloquear cuenta si se superan los intentos máximos
  if (this.security.loginAttempts >= maxAttempts && !this.isLocked) {
    this.security.lockUntil = Date.now() + lockTime;
  }
  
  await this.save();
  return false;
};

// Method to update last activity
userSchema.methods.updateActivity = async function(sessionInfo = {}) {
  this.lastActivity = new Date();
  
  if (sessionInfo.token) {
    // Actualizar información de sesión
    const existingSession = this.security.sessionTokens.find(
      s => s.token === sessionInfo.token
    );
    
    if (existingSession) {
      existingSession.lastUsed = new Date();
      existingSession.ipAddress = sessionInfo.ipAddress || existingSession.ipAddress;
    } else {
      // Agregar nueva sesión (límite de 5 sesiones activas)
      this.security.sessionTokens.push({
        token: sessionInfo.token,
        createdAt: new Date(),
        lastUsed: new Date(),
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent
      });
      
      // Mantener solo las últimas 5 sesiones
      if (this.security.sessionTokens.length > 5) {
        this.security.sessionTokens = this.security.sessionTokens
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, 5);
      }
    }
  }
  
  await this.save();
};

// Method to revoke session
userSchema.methods.revokeSession = async function(token) {
  this.security.sessionTokens = this.security.sessionTokens.filter(
    s => s.token !== token
  );
  await this.save();
};

// Method to revoke all sessions
userSchema.methods.revokeAllSessions = async function() {
  this.security.sessionTokens = [];
  await this.save();
};

// Method to check permissions
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions[permission] === true;
};

// Method to exclude password from JSON response
userSchema.methods.toJSON = function() {
  const userObject = this.toObject({ virtuals: true });
  delete userObject.password;
  delete userObject.security.twoFactorSecret;
  delete userObject.security.sessionTokens;
  return userObject;
};

// Method to get safe user info for responses
userSchema.methods.getSafeInfo = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    fullName: this.fullName,
    profile: this.profile,
    preferences: this.preferences,
    permissions: this.permissions,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    organizationId: this.organizationId
  };
};

// Static method to find by organization
userSchema.statics.findByOrganization = function(organizationId, filter = {}) {
  return this.find({ 
    organizationId, 
    ...filter 
  }).populate('organizationId', 'name slug');
};

// Static method to get user statistics
userSchema.statics.getStats = async function(organizationId) {
  try {
    const stats = await this.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          users: {
            $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
          },
          viewers: {
            $sum: { $cond: [{ $eq: ['$role', 'viewer'] }, 1, 0] }
          },
          recentLogins: {
            $sum: {
              $cond: [
                { 
                  $gte: [
                    '$lastLogin', 
                    new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ] 
                }, 
                1, 
                0
              ]
            }
          }
        }
      }
    ]);
    
    return stats[0] || {
      total: 0,
      active: 0,
      admins: 0,
      users: 0,
      viewers: 0,
      recentLogins: 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    throw error;
  }
};

// Verificar si el modelo ya existe antes de compilarlo
let User;
try {
  User = mongoose.model('User');
} catch (error) {
  User = mongoose.model('User', userSchema);
}

module.exports = User;