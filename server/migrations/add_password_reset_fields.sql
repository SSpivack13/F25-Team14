-- Add password reset fields to Users table
ALTER TABLE Users 
ADD COLUMN RESET_TOKEN VARCHAR(255) NULL,
ADD COLUMN RESET_TOKEN_EXPIRY DATETIME NULL;

-- Add index for faster token lookups
CREATE INDEX idx_reset_token ON Users(RESET_TOKEN);

