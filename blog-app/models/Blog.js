const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [20, 'Content must be at least 20 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    excerpt: {
      type: String,
      maxlength: 300,
    },
    coverImage: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ['Technology', 'Programming', 'AI', 'Education', 'Lifestyle', 'Health', 'Business', 'Science', 'Other'],
      default: 'Other',
    },
  },
  { timestamps: true }
);

// Auto-generate excerpt from content
blogSchema.pre('save', function (next) {
  if (this.isModified('content') || !this.excerpt) {
    this.excerpt = this.content.substring(0, 200).replace(/\n/g, ' ') + (this.content.length > 200 ? '...' : '');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
