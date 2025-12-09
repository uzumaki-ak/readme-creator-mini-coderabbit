-- Create chat_messages table for project-specific AI conversations
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages (via project ownership)
CREATE POLICY "Users can view their chat messages" 
  ON chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their chat messages" 
  ON chat_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their chat messages" 
  ON chat_messages FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );
