-- Fix the database relationships and constraints

-- Drop existing foreign key constraints if they exist
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_user_id_fkey;
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

-- Recreate foreign key constraints with proper names
ALTER TABLE posts 
ADD CONSTRAINT posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure all tables have proper indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Update RLS policies to be more specific
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Approved posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Approved comments are viewable by everyone" ON post_comments;

-- Recreate policies with better names
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "posts_select_policy" ON posts
  FOR SELECT USING (is_approved = true);

CREATE POLICY "comments_select_policy" ON post_comments
  FOR SELECT USING (is_approved = true);

-- Add policy for authenticated users to see their own unapproved content
CREATE POLICY "posts_select_own_policy" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "comments_select_own_policy" ON post_comments
  FOR SELECT USING (auth.uid() = user_id);

-- Ensure storage policies are correct
DROP POLICY IF EXISTS "Media files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload media files" ON storage.objects;

CREATE POLICY "storage_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "storage_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Add function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
