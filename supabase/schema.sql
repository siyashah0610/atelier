-- ─── Atelier Database Schema ─────────────────────────────────────────────────
-- Paste this entire file into the Supabase SQL Editor and run it.

-- Profiles (one per auth user; auto-created by trigger below)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT NOT NULL DEFAULT '',
  username      TEXT,
  palette       JSONB,
  body_profile  JSONB,
  face_analysis JSONB,
  favorite_retailers TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Wish lists
CREATE TABLE IF NOT EXISTS public.wish_lists (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  is_public  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wish list items (each item stores the full WishListItem JSON)
CREATE TABLE IF NOT EXISTS public.wish_list_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wish_list_id UUID REFERENCES public.wish_lists(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data         JSONB NOT NULL,
  added_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses (full SavedAnalysis JSON per row)
CREATE TABLE IF NOT EXISTS public.analyses (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved products
CREATE TABLE IF NOT EXISTS public.saved_products (
  id       TEXT PRIMARY KEY,
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data     JSONB NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product  JSONB NOT NULL,
  size     TEXT,
  quantity INTEGER DEFAULT 1
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_lists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wish_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items      ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Wish lists: owner can do anything; anyone can read public lists
DROP POLICY IF EXISTS "own wish lists" ON public.wish_lists;
CREATE POLICY "own wish lists" ON public.wish_lists FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "public wish lists" ON public.wish_lists;
CREATE POLICY "public wish lists" ON public.wish_lists FOR SELECT USING (is_public = true);

-- Wish list items
DROP POLICY IF EXISTS "own wish list items" ON public.wish_list_items;
CREATE POLICY "own wish list items" ON public.wish_list_items FOR ALL USING (auth.uid() = user_id);

-- Analyses
DROP POLICY IF EXISTS "own analyses" ON public.analyses;
CREATE POLICY "own analyses" ON public.analyses FOR ALL USING (auth.uid() = user_id);

-- Saved products
DROP POLICY IF EXISTS "own saved products" ON public.saved_products;
CREATE POLICY "own saved products" ON public.saved_products FOR ALL USING (auth.uid() = user_id);

-- Cart
DROP POLICY IF EXISTS "own cart" ON public.cart_items;
CREATE POLICY "own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- ─── Auto-create profile on signup ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username, favorite_retailers)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    '{}'::TEXT[]
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
