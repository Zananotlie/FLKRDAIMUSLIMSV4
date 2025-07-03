-- Complete fix for community relationships

-- Drop all existing tables and recreate with proper structure
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS user_reports CASCADE;
DROP TABLE IF EXISTS user_blocks CASCADE;

-- Recreate posts table with proper structure
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate post_comments table with proper foreign key naming
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate post_likes table
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "posts_select_policy" ON posts FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "posts_insert_policy" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_policy" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_policy" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_select_policy" ON post_comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "comments_insert_policy" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update_policy" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete_policy" ON post_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "likes_select_policy" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_policy" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_policy" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_approved_created ON posts(is_approved, created_at DESC);
CREATE INDEX idx_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX idx_likes_post_user ON post_likes(post_id, user_id);

-- Insert sample data
INSERT INTO posts (user_id, content, is_approved) 
SELECT id, 'Welcome to FLKRD Muslims! 🕌 May Allah bless our community.', true 
FROM profiles 
LIMIT 1
ON CONFLICT DO NOTHING;
