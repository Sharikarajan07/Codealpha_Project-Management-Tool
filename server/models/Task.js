const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isEdited: {
    type: Boolean,
    default: false
  }
});

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required']
  },
  status: {
    type: String,
    required: true,
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  startDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    default: null
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  position: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  attachments: [attachmentSchema],
  checklist: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Checklist item cannot be more than 200 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: null,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ creator: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ position: 1 });
taskSchema.index({ title: 'text', description: 'text' });

// Update completedDate when status changes to completed
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'Done' || this.status === 'Completed') {
      this.completedDate = new Date();
    } else {
      this.completedDate = null;
    }
  }
  next();
});

// Add creator to watchers by default
taskSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.watchers.includes(this.creator)) {
      this.watchers.push(this.creator);
    }
    if (this.assignee && !this.watchers.includes(this.assignee)) {
      this.watchers.push(this.assignee);
    }
  }
  next();
});

// Instance method to check if user can edit task
taskSchema.methods.canEdit = function(userId, userRole) {
  return (
    this.creator.toString() === userId.toString() ||
    this.assignee?.toString() === userId.toString() ||
    userRole === 'owner' ||
    userRole === 'admin'
  );
};

// Instance method to add comment
taskSchema.methods.addComment = function(authorId, content) {
  this.comments.push({
    author: authorId,
    content: content
  });
  
  // Add author to watchers if not already watching
  if (!this.watchers.includes(authorId)) {
    this.watchers.push(authorId);
  }
  
  return this.save();
};

// Instance method to get progress percentage
taskSchema.methods.getProgress = function() {
  if (this.checklist.length === 0) {
    return this.status === 'Done' || this.status === 'Completed' ? 100 : 0;
  }
  
  const completedItems = this.checklist.filter(item => item.completed).length;
  return Math.round((completedItems / this.checklist.length) * 100);
};

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'Done' && this.status !== 'Completed';
});

// Virtual for comment count
taskSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Static method to find tasks by project
taskSchema.statics.findByProject = function(projectId) {
  return this.find({ project: projectId, isArchived: false })
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('comments.author', 'name email avatar')
    .sort({ position: 1, createdAt: -1 });
};

// Static method to find tasks by assignee
taskSchema.statics.findByAssignee = function(userId) {
  return this.find({ assignee: userId, isArchived: false })
    .populate('project', 'name color')
    .populate('creator', 'name email avatar')
    .sort({ dueDate: 1, priority: -1 });
};

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
