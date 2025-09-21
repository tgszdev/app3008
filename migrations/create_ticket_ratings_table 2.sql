-- Create ticket_ratings table
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one rating per user per ticket
  UNIQUE(ticket_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_ticket_id ON ticket_ratings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_user_id ON ticket_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_created_at ON ticket_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_ratings_rating ON ticket_ratings(rating);

-- Enable RLS (Row Level Security)
ALTER TABLE ticket_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all ratings" ON ticket_ratings;
DROP POLICY IF EXISTS "Users can create their own ratings" ON ticket_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ticket_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON ticket_ratings;

-- Create RLS policies
-- Allow users to view all ratings
CREATE POLICY "Users can view all ratings"
ON ticket_ratings FOR SELECT
TO authenticated
USING (true);

-- Allow users to create ratings only for tickets they created
CREATE POLICY "Users can create their own ratings"
ON ticket_ratings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM tickets 
    WHERE tickets.id = ticket_ratings.ticket_id 
    AND tickets.created_by = auth.uid()
  )
);

-- Allow users to update only their own ratings
CREATE POLICY "Users can update their own ratings"
ON ticket_ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own ratings
CREATE POLICY "Users can delete their own ratings"
ON ticket_ratings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_ticket_ratings_updated_at_trigger ON ticket_ratings;
CREATE TRIGGER update_ticket_ratings_updated_at_trigger
BEFORE UPDATE ON ticket_ratings
FOR EACH ROW
EXECUTE FUNCTION update_ticket_ratings_updated_at();

-- Add comment to table
COMMENT ON TABLE ticket_ratings IS 'Stores user ratings and feedback for resolved tickets';
COMMENT ON COLUMN ticket_ratings.rating IS 'Rating from 1 (worst) to 5 (best)';
COMMENT ON COLUMN ticket_ratings.comment IS 'Optional feedback comment from the user';

-- Grant permissions
GRANT ALL ON ticket_ratings TO authenticated;
GRANT ALL ON ticket_ratings TO service_role;