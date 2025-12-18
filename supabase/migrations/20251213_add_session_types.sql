-- Create enum for session types
CREATE TYPE public.session_type_enum AS ENUM ('meeting', 'presentation', 'networking', 'break');

-- Alter sessions table to add new columns
ALTER TABLE public.sessions
ADD COLUMN session_type public.session_type_enum NOT NULL DEFAULT 'meeting',
ADD COLUMN location text,
ADD COLUMN description text,
ADD COLUMN speaker text,
ADD COLUMN max_capacity integer;

-- Update RLS policies if necessary (usually not needed for adding columns if table policy covers update/select generally, but good to check)
-- Existing policies are usually ON public.sessions FOR ALL ... so this should be fine.

-- Comment on columns for clarity
COMMENT ON COLUMN public.sessions.session_type IS 'Type of the session: meeting (default, booth-based), presentation, networking, or break.';
COMMENT ON COLUMN public.sessions.max_capacity IS 'Optional maximum capacity for the entire session (room capacity), distinct from booth capacity.';
