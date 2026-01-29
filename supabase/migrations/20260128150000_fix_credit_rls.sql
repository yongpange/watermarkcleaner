
-- Enable RLS on wmc_credit if not already enabled (idempotent)
alter table wmc_credit enable row level security;

-- Policy to allow users to view their own credit records
create policy "Users can view their own credit records"
on wmc_credit for select
to authenticated
using (auth.uid() = user_id);

-- Verify policy (comment)
-- Select * from wmc_credit where user_id = auth.uid();
