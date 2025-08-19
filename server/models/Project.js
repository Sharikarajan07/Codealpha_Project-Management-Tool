const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'on-hold'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  color: {
    type: String,
    default: '#3B82F6', // Blue color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  // Task columns/lists for Kanban board
  columns: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Column name cannot be more than 50 characters']
    },
    order: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#6B7280'
    }
  }],
  inviteCode: {
    type: String,
    unique: true,
    sparse: true // Allow multiple null values
  }
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: 'text', description: 'text' });

// Default columns for new projects
projectSchema.pre('save', function(next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { name: 'To Do', order: 0, color: '#EF4444' },
      { name: 'In Progress', order: 1, color: '#F59E0B' },
      { name: 'Review', order: 2, color: '#8B5CF6' },
      { name: 'Done', order: 3, color: '#10B981' }
    ];
  }
  next();
});

// Add owner to members array
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    // Add owner as a member with owner role
    const ownerMember = {
      user: this.owner,
      role: 'owner',
      joinedAt: new Date()
    };
    
    // Check if owner is not already in members
    const ownerExists = this.members.some(member => 
      member.user.toString() === this.owner.toString()
    );
    
    if (!ownerExists) {
      this.members.push(ownerMember);
    }
  }
  next();
});

// Instance method to check if user is a member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Instance method to get user's role in project
projectSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Instance method to check if user can edit project
projectSchema.methods.canEdit = function(userId) {
  const role = this.getUserRole(userId);
  return role === 'owner' || role === 'admin';
};

// Static method to find projects by user
projectSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  }).populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');
};

// Virtual for task count (will be populated by tasks)
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Virtual for completed task count
projectSchema.virtual('completedTaskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  match: { status: 'completed' },
  count: true
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
