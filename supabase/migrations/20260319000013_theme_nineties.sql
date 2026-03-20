-- Add 'nineties' as a valid theme option in user_preferences

ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_theme_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_theme_check
  CHECK (theme IN ('warm', 'ocean', 'forest', 'sunset', 'lavender', 'midnight', 'vintage', 'nineties'));
