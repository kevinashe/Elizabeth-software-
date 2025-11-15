/*
  # Add DELETE Policy for Chat Messages

  1. Security Enhancement
    - Add missing DELETE policy for chat_messages table
    - Allows users to delete their own chat messages
    - Maintains data ownership and privacy

  2. Changes
    - Create DELETE policy for authenticated users
    - Users can only delete messages they own (user_id = auth.uid())

  3. Notes
    - This fixes the issue where the "Clear Chat" button wasn't working
    - RLS was blocking delete operations without this policy
*/

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
