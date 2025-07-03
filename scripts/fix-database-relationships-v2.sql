-- Complete database relationship fix

-- Drop all existing policies first
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "comments_select_policy" ON post_comments;
DROP POLICY IF EXISTS "posts_select_own_policy" ON posts;
DROP POLICY IF EXISTS "comments_select_own_policy" ON post_comments;

-- Drop existing foreign key constraints
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Recreate tables with proper structure
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;

-- Recreate posts table
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Recreate post_likes table
CREATE TABLE post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(post_id, user_id)
);

-- Recreate post_comments table
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "post_likes_select_all" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "post_comments_select_all" ON post_comments FOR SELECT USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_update_own" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "post_comments_delete_own" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_approved_created ON posts(is_approved, created_at DESC);
CREATE INDEX idx_post_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX idx_post_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX idx_profiles_id_name ON profiles(id, name);

-- Insert sample data for testing
INSERT INTO posts (user_id, content, is_approved) 
SELECT id, 'Welcome to FLKRD Muslims! 🕌 May Allah bless our community.', true 
FROM profiles 
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO posts (user_id, content, is_approved) 
SELECT id, 'SubhanAllah! Beautiful sunset today. Reminded me of Allah''s creation. 🌅', true 
FROM profiles 
LIMIT 1
ON CONFLICT DO NOTHING;
